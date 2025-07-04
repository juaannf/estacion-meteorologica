// Conexión al broker MQTT sobre WebSocket seguro (puerto 8081)
const cliente = new Paho.MQTT.Client("wss://test.mosquitto.org:8081/mqtt", "webclient");

// Función que se ejecuta al recibir un mensaje
cliente.onMessageArrived = mensaje => {
    try {
        const datos = JSON.parse(mensaje.payloadString);

        // Si el mensaje tiene temperatura, humedad y luz
        if (datos.temp !== undefined) {
            document.getElementById("temp").textContent = datos.temp;
            document.getElementById("hum").textContent = datos.hum;
            document.getElementById("luz").textContent = datos.luz;
        }

        // Si el mensaje tiene una alerta
        if (datos.alerta !== undefined) {
            document.getElementById("alerta").textContent = datos.alerta;
        }

    } catch (e) {
        console.error("Error al procesar mensaje:", e);
    }
};

// Conexión al broker
cliente.connect({
    useSSL: true,
    onSuccess: () => {
        console.log("Conectado a MQTT por WebSocket");
        cliente.subscribe("estacion/datos");
        cliente.subscribe("estacion/alertas");
    },
    onFailure: err => {
        console.error("Error de conexión MQTT:", err.errorMessage);
    }
});