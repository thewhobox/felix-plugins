var instanceKey = $("#instance").val();
var firstConnect = true;

var socket = io("http://" + window.location.hostname +":3000");
socket.emit("subscribeMessage", instanceKey + ".fontend");
socket.on("connect", () => {
    if(firstConnect) {
        firstConnect = false;
        console.log("Verbunden")
        return;
    }
    alert("Verbindung wieder hergestellt", "Verbunden", "success")
});
socket.on("disconnect", () => alert("Verbindung getrennt.", "Verbindung", "alert"));


$("input[type=submit]").click(() => {
    socket.emit("message", {to: instanceKey, cmd: "createScript", value: {name: $("input[name=name]").val(), type: $("select[name=type]").val()}}, (scriptId) => {
        window.location = "/adapters/" + instanceKey + "/edit-js/" + scriptId;
    });
});