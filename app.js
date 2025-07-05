
const cliente=new Paho.MQTT.Client("wss://test.mosquitto.org:8081/mqtt", "webcliente");

cliente.onMessageArrived=mensaje => {
    try {
    const datos=JSON.parse(mensaje.payloadString);
    if (datos.temp!==undefined) {
        document.getElementById("temp").textContent=datos.temp;
        document.getElementById("hum").textContent=datos.hum;
        document.getElementById("luz").textContent=datos.luz;
    }
    if (datos.alerta!==undefined) {
        document.getElementById("alerta").textContent=datos.alerta;
    }
}catch(error){}
};
cliente.connect({
    useSSL: true,
    onSuccess: () => {
        cliente.subscribe("estacion/datos");
        cliente.subscribe("estacion/alertas");
    }
});