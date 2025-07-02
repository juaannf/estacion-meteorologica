
const cliente = new Paho.MQTT.Client("test.mosquitto.org",8080,"webclient");
cliente.onMessageArrived=mensaje=>{
    const datos=JSON.parse(mensaje.payloadString);
    document.getElementById("temp").textContent=datos.temp||"-";
    document.getElementById("hum").textContent=datos.hum||"-";
    document.getElementById("luz").textContent=datos.luz||"-";
    document.getElementById("alerta").textContent=datos.alerta||"-";

};
cliente.connect({
    onSuccess:() =>{
        cliente.subscribe("estacion/datos")
        cliente.subscribe("estacion/alertas")
    },
useSSL:true})
