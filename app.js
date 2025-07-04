// Verificar si Paho está cargado
if (typeof Paho === 'undefined') {
    console.error("Error: Biblioteca Paho MQTT no cargada");
    document.getElementById("estado").textContent = "Error: Biblioteca MQTT no cargada";
    document.getElementById("estado").className = "desconectado";
} else {
    console.log("Paho MQTT cargado correctamente");
    
    document.addEventListener("DOMContentLoaded", function() {
        console.log("DOM completamente cargado");
        
        // Configuración MQTT mejorada con más opciones
        const clientId = "webclient_" + Math.random().toString(16).substr(2, 8);
        const brokers = [
            { 
                name: "Mosquitto WSS", 
                host: "test.mosquitto.org", 
                port: 8080, 
                path: "/",
                protocol: "wss"
            },
            { 
                name: "EMQX WSS", 
                host: "broker.emqx.io", 
                port: 8084, 
                path: "/mqtt",
                protocol: "wss"
            },
            { 
                name: "Mosquitto WS", 
                host: "test.mosquitto.org", 
                port: 8081, 
                path: "/",
                protocol: "ws"
            }
        ];

        let currentBroker = 0;
        let cliente = null;
        let connectionTimeout = null;

        // Función para actualizar estado con manejo seguro
        function updateStatus(message, isError = false) {
            const statusElement = document.getElementById("estado");
            if (statusElement) {
                statusElement.textContent = message;
                statusElement.className = isError ? "desconectado" : 
                    message.includes("Conectado") ? "conectado" : "conectando";
                console.log("Estado:", message);
            }
        }

        // Función para conectar al broker
        function connectToBroker() {
            clearTimeout(connectionTimeout);
            
            const broker = brokers[currentBroker];
            console.log(`Conectando a: ${broker.name} (${broker.protocol}://${broker.host}:${broker.port}${broker.path})`);
            
            updateStatus(`Conectando a ${broker.name}...`);

            // Crear cliente MQTT
            cliente = new Paho.MQTT.Client(
                broker.host,
                Number(broker.port),
                broker.path,
                clientId
            );

            // Configurar manejadores
            cliente.onConnectionLost = onConnectionLost;
            cliente.onMessageArrived = onMessageArrived;

            // Opciones de conexión
            const options = {
                timeout: 10,
                useSSL: broker.protocol === "wss",
                mqttVersion: 4,
                onSuccess: onConnectSuccess,
                onFailure: onConnectFailure,
                reconnect: false
            };

            // Timeout de conexión
            connectionTimeout = setTimeout(() => {
                if (!cliente.isConnected()) {
                    console.warn("Timeout de conexión");
                    onConnectFailure({errorMessage: "Timeout"});
                }
            }, 10000);

            cliente.connect(options);
        }

        // Conexión exitosa
        function onConnectSuccess() {
            clearTimeout(connectionTimeout);
            console.log("Conexión MQTT establecida");
            updateStatus(`Conectado a ${brokers[currentBroker].name}`);
            
            cliente.subscribe("estacion/datos", {qos: 0});
            cliente.subscribe("estacion/alertas", {qos: 0});
        }

        // Fallo de conexión
        function onConnectFailure(error) {
            clearTimeout(connectionTimeout);
            console.error("Error de conexión:", error.errorMessage);
            
            // Intentar con siguiente broker
            currentBroker = (currentBroker + 1) % brokers.length;
            updateStatus(`Reconectando en 3s...`, true);
            
            setTimeout(connectToBroker, 3000);
        }

        // Conexión perdida
        function onConnectionLost(response) {
            if (response.errorCode !== 0) {
                console.warn("Conexión perdida:", response.errorMessage);
                updateStatus("Desconectado", true);
                setTimeout(connectToBroker, 3000);
            }
        }

        // Mensaje recibido
        function onMessageArrived(message) {
            console.log("Mensaje recibido:", message.destinationName, message.payloadString);
            
            try {
                const datos = JSON.parse(message.payloadString);
                const updateField = (id, value) => {
                    const element = document.getElementById(id);
                    if (element) element.textContent = value ?? "--";
                };

                if (message.destinationName === "estacion/datos") {
                    updateField("temp", datos.temp?.toFixed(1));
                    updateField("hum", datos.hum?.toFixed(1));
                    updateField("luz", datos.luz?.toFixed(1));
                } 
                else if (message.destinationName === "estacion/alertas") {
                    updateField("alerta", datos.alerta);
                }
            } catch (e) {
                console.error("Error procesando mensaje:", e);
            }
        }

        // Iniciar conexión
        connectToBroker();
    });
}