// Configuración mejorada del cliente MQTT
const clientId = "webclient_" + Math.random().toString(16).substr(2, 8);
const cliente = new Paho.MQTT.Client(
    "test.mosquitto.org",
    8081,
    clientId
);

// Función para actualizar el estado en la UI
function updateStatus(message, color) {
    const statusElement = document.getElementById("estado");
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.style.color = color;
    }
    console.log("Estado:", message);
}

// Opciones de conexión CORREGIDAS (sin 'reconnect')
const opciones = {
    onSuccess: function() {
        console.log("Conectado al broker MQTT");
        updateStatus("Conectado", "green");
        
        // Suscribirse a los topics
        cliente.subscribe("estacion/datos");
        cliente.subscribe("estacion/alertas");
    },
    onFailure: function(message) {
        console.error("Error de conexión:", message.errorMessage);
        updateStatus("Error de conexión", "red");
        setTimeout(() => cliente.connect(opciones), 5000);
    },
    useSSL: false,
    mqttVersion: 4
};

// Manejo de mensajes recibidos
cliente.onMessageArrived = function(mensaje) {
    console.log("Mensaje recibido:", mensaje.destinationName, mensaje.payloadString);
    
    try {
        const datos = JSON.parse(mensaje.payloadString);
        if (mensaje.destinationName === "estacion/datos") {
            document.getElementById("temp").textContent = datos.temp?.toFixed(1) || "--";
            document.getElementById("hum").textContent = datos.hum?.toFixed(1) || "--";
            document.getElementById("luz").textContent = datos.luz?.toFixed(1) || "--";
        } else if (mensaje.destinationName === "estacion/alertas") {
            document.getElementById("alerta").textContent = datos.alerta || "--";
        }
    } catch (e) {
        console.error("Error procesando mensaje:", e);
    }
};

// Manejo de pérdida de conexión
cliente.onConnectionLost = function(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.log("Conexión perdida:", responseObject.errorMessage);
        updateStatus("Desconectado - Reconectando...", "orange");
        setTimeout(() => cliente.connect(opciones), 5000);
    }
};

// Iniciar conexión cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", function() {
    console.log("Iniciando conexión MQTT...");
    updateStatus("Conectando...", "blue");
    cliente.connect(opciones);
});