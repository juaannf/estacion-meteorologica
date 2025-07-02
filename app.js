// Configuración del cliente MQTT
const cliente = new Paho.MQTT.Client(
    "test.mosquitto.org",  // Broker
    8080,                  // Puerto WebSocket
    "webclient_" + Math.random().toString(16).substr(2, 8)  // ID único
);

// Función para actualizar la interfaz
function actualizarDatos(datos) {
    if (datos.temp !== undefined) document.getElementById("temp").textContent = datos.temp;
    if (datos.hum !== undefined) document.getElementById("hum").textContent = datos.hum;
    if (datos.luz !== undefined) document.getElementById("luz").textContent = datos.luz;
    if (datos.alerta !== undefined) document.getElementById("alerta").textContent = datos.alerta;
}

// Callback cuando llega un mensaje
cliente.onMessageArrived = function(mensaje) {
    try {
        const datos = JSON.parse(mensaje.payloadString);
        console.log("Datos recibidos:", datos);
        actualizarDatos(datos);
    } catch (e) {
        console.error("Error al procesar mensaje:", e);
    }
};

// Opciones de conexión
const opciones = {
    onSuccess: function() {
        console.log("Conectado al broker MQTT");
        cliente.subscribe("estacion/datos");
        cliente.subscribe("estacion/alertas");
        
        // Mostrar estado de conexión
        document.getElementById("alerta").textContent = "Conectado";
        document.getElementById("alerta").style.color = "green";
    },
    onFailure: function(message) {
        console.error("Error de conexión:", message.errorMessage);
        document.getElementById("alerta").textContent = "Error de conexión";
        document.getElementById("alerta").style.color = "red";
        setTimeout(() => cliente.connect(opciones), 5000); // Reintentar después de 5 segundos
    },
    useSSL: true,
    reconnect: true
};

// Manejar reconexión si se pierde la conexión
cliente.onConnectionLost = function(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.log("Conexión perdida:", responseObject.errorMessage);
        document.getElementById("alerta").textContent = "Reconectando...";
        document.getElementById("alerta").style.color = "orange";
    }
};

// Conectar al broker cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", function() {
    console.log("Iniciando conexión MQTT...");
    cliente.connect(opciones);
});
