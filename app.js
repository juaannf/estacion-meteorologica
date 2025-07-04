// Configuración del cliente MQTT
const clientId = "webclient_" + Math.random().toString(16).substr(2, 8);
const cliente = new Paho.MQTT.Client(
    "test.mosquitto.org",  // Broker público para pruebas
    8081,                  // Puerto WebSocket para Mosquitto
    clientId
);

// Función para actualizar la interfaz
function actualizarDatos(datos) {
    if (datos.temp !== undefined) {
        document.getElementById("temp").textContent = datos.temp.toFixed(1);
    }
    if (datos.hum !== undefined) {
        document.getElementById("hum").textContent = datos.hum.toFixed(1);
    }
    if (datos.luz !== undefined) {
        document.getElementById("luz").textContent = datos.luz.toFixed(1);
    }
}

// Función para mostrar alertas
function mostrarAlerta(mensaje) {
    const alertaElement = document.getElementById("alerta");
    alertaElement.textContent = mensaje;
    
    if (mensaje === "OK") {
        alertaElement.style.backgroundColor = "#ddffdd";
        alertaElement.style.color = "green";
    } else {
        alertaElement.style.backgroundColor = "#ffdddd";
        alertaElement.style.color = "red";
    }
}

// Callback cuando llega un mensaje
cliente.onMessageArrived = function(mensaje) {
    console.log("Mensaje recibido en topic:", mensaje.destinationName);
    console.log("Contenido:", mensaje.payloadString);
    
    try {
        const datos = JSON.parse(mensaje.payloadString);
        
        if (mensaje.destinationName === "estacion/datos") {
            actualizarDatos(datos);
        } else if (mensaje.destinationName === "estacion/alertas") {
            mostrarAlerta(datos.alerta);
        }
    } catch (e) {
        console.error("Error al procesar mensaje:", e);
    }
};

// Opciones de conexión
const opciones = {
    onSuccess: function() {
        console.log("Conectado al broker MQTT");
        document.getElementById("estado").textContent = "Conectado";
        document.getElementById("estado").style.color = "green";
        
        // Suscribirse a los topics
        cliente.subscribe("estacion/datos", {qos: 0});
        cliente.subscribe("estacion/alertas", {qos: 0});
        
        // Mostrar mensaje inicial
        mostrarAlerta("Esperando datos...");
    },
    onFailure: function(message) {
        console.error("Error de conexión:", message.errorMessage);
        document.getElementById("estado").textContent = "Error de conexión";
        document.getElementById("estado").style.color = "red";
        setTimeout(() => cliente.connect(opciones), 5000); // Reintentar después de 5 segundos
    },
    useSSL: false,  // SSL puede causar problemas con algunos brokers públicos
    reconnect: true,
    mqttVersion: 4  // Versión del protocolo MQTT
};

// Manejar reconexión si se pierde la conexión
cliente.onConnectionLost = function(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.log("Conexión perdida:", responseObject.errorMessage);
        document.getElementById("estado").textContent = "Desconectado";
        document.getElementById("estado").style.color = "orange";
    }
};

// Conectar al broker cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", function() {
    console.log("Iniciando conexión MQTT...");
    document.getElementById("estado").textContent = "Conectando...";
    document.getElementById("estado").style.color = "blue";
    
    // Intentar conexión
    cliente.connect(opciones);
    
    // Mostrar mensaje si hay error de carga
    setTimeout(() => {
        if (document.getElementById("estado").textContent === "Conectando...") {
            document.getElementById("estado").textContent = "Tiempo de espera agotado";
            document.getElementById("estado").style.color = "red";
        }
    }, 10000); // 10 segundos de timeout
});
