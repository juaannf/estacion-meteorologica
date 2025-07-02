
const cliente = new Paho.MQTT.Client("test.mosquitto.org",8080,"webclient");
cliente.onMessageArrived=mensaje=>{
    const datos=JSON.parse(mensaje.strings);
    document.getElementById("temp").text=datos.temp||"-";
    document.getElementById("hum").text=datos.hum||"-";
    document.getElementById("luz").text=datos.luz||"-";
    document.getElementById("alerta").text=datos.alerta||"-";

};
cliente.connect({
    onSuccess:() =>{
        cliente.subscribe("estacion/datos")
        cliente.subscribe("estacion/alertas")
    },
useSSL:true})
