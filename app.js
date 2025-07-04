const clientId = "webclient_" + Math.random().toString(16).substr(2, 8);
const brokers = [
    { host: "wss://test.mosquitto.org", port: 8081, ssl: true },
    { host: "wss://broker.emqx.io", port: 8084, ssl: true }
];

let currentBroker = 0;
const cliente = new Paho.MQTT.Client(
    brokers[currentBroker].host,
    brokers[currentBroker].port,
    clientId
);

function updateStatus(message, color) {
    const statusElement = document.getElementById("estado");
    statusElement.textContent = message;
    statusElement.style.color = color;
    console.log("Estado:", message);
}

function tryNextBroker() {
    currentBroker = (currentBroker + 1) % brokers.length;
    console.log("Probando broker alternativo:", brokers[currentBroker].host);
    updateStatus(`Probando conexión con ${brokers[currentBroker].host}...`, "blue");
    
    cliente.host = brokers[currentBroker].host;
    cliente.port = brokers[currentBroker].port;
    
    setTimeout(() => cliente.connect(opciones), 1000);
}

const opciones = {
    onSuccess: function() {
        console.log("Conectado a", brokers[currentBroker].host);
        updateStatus(`Conectado a ${brokers[currentBroker].host}`, "green");
        cliente.subscribe("estacion/datos");
        cliente.subscribe("estacion/alertas");
    },
    onFailure: function(message) {
        console.error("Error de conexión:", message.errorMessage);
        updateStatus("Error de conexión", "red");
        tryNextBroker();
    },
    useSSL: true,
    mqttVersion: 4
};

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

cliente.onConnectionLost = function(response) {
    console.warn("Conexión perdida:", response.errorMessage);
    updateStatus("Desconectado", "orange");
    tryNextBroker();
};

document.addEventListener("DOMContentLoaded", function() {
    updateStatus("Conectando...", "blue");
    console.log("Iniciando conexión MQTT...");
    cliente.connect(opciones);
});