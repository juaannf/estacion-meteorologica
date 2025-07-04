// Esperar a que todo el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM completamente cargado");
    
    // Configuración MQTT mejorada
    const clientId = "webclient_" + Math.random().toString(16).substr(2, 8);
    const brokers = [
        { 
            name: "Mosquitto SSL", 
            host: "test.mosquitto.org", 
            port: 8080,  // Puerto SSL correcto
            protocol: "wss",
            path: "/"
        },
        { 
            name: "EMQX SSL", 
            host: "broker.emqx.io", 
            port: 8084, 
            protocol: "wss",
            path: "/mqtt"
        }
    ];

    let currentBroker = 0;
    let cliente = null;

    // Función para actualizar estado con manejo seguro de elementos
    function updateStatus(message, isError = false) {
        const statusElement = document.getElementById("estado");
        if (!statusElement) {
            console.error("Elemento 'estado' no encontrado");
            return;
        }
        
        statusElement.textContent = message;
        statusElement.className = isError ? "desconectado" : 
                                message.includes("Conectado") ? "conectado" : "conectando";
        
        console.log("Estado:", message);
    }

    // Función para conectar al broker
    function connectToBroker() {
        const broker = brokers[currentBroker];
        console.log(`Intentando conectar a: ${broker.name} (${broker.host}:${broker.port})`);
        
        updateStatus(`Conectando a ${broker.name}...`);

        // Crear nuevo cliente (importante para reconexiones)
        cliente = new Paho.MQTT.Client(
            broker.host,
            Number(broker.port),
            broker.path,
            clientId
        );

        // Configurar manejadores de eventos
        cliente.onConnectionLost = onConnectionLost;
        cliente.onMessageArrived = onMessageArrived;

        // Opciones de conexión
        const options = {
            timeout: 10,
            useSSL: true,
            mqttVersion: 4,
            onSuccess: onConnectSuccess,
            onFailure: onConnectFailure,
            reconnect: false
        };

        cliente.connect(options);
    }

    // Manejador de conexión exitosa
    function onConnectSuccess() {
        console.log("Conexión MQTT establecida");
        updateStatus(`Conectado a ${brokers[currentBroker].name}`);
        
        // Suscribirse a los topics
        cliente.subscribe("estacion/datos", {qos: 0});
        cliente.subscribe("estacion/alertas", {qos: 0});
    }

    // Manejador de fallo de conexión
    function onConnectFailure(error) {
        console.error("Error de conexión:", error.errorMessage);
        updateStatus(`Error: ${error.errorMessage}`, true);
        
        // Intentar con el siguiente broker
        currentBroker = (currentBroker + 1) % brokers.length;
        setTimeout(connectToBroker, 3000);
    }

    // Manejador de conexión perdida
    function onConnectionLost(response) {
        if (response.errorCode !== 0) {
            console.warn("Conexión perdida:", response.errorMessage);
            updateStatus("Desconectado", true);
            setTimeout(connectToBroker, 3000);
        }
    }

    // Manejador de mensajes recibidos
    function onMessageArrived(message) {
        console.log("Mensaje recibido:", message.destinationName, message.payloadString);
        
        try {
            const datos = JSON.parse(message.payloadString);
            
            // Actualizar UI de forma segura
            const updateElement = (id, value) => {
                const element = document.getElementById(id);
                if (element) element.textContent = value;
            };

            if (message.destinationName === "estacion/datos") {
                updateElement("temp", datos.temp?.toFixed(1) || "--");
                updateElement("hum", datos.hum?.toFixed(1) || "--");
                updateElement("luz", datos.luz?.toFixed(1) || "--");
            } 
            else if (message.destinationName === "estacion/alertas") {
                updateElement("alerta", datos.alerta || "--");
            }
        } catch (e) {
            console.error("Error procesando mensaje:", e);
        }
    }

    // Iniciar la conexión
    connectToBroker();
});