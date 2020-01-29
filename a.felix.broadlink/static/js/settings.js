var settings = null;
var searchCount = 0;
var finCount = 0;
var notsaved = false;

$(document).ready(() => {
    if($("#settings").length != 0)
        settings = JSON.parse($("#settings").val());
});

$(window).bind("beforeunload" , () => {
    if(notsaved) {
        return "Du hast deine Einstellungen noch nicht gespeichert. Trotzdem verlassen?";
    }
});

$("input").change(() => {
    notsaved = true;
});

$("form[id=settings]").submit((event) => {
    notsaved = false;
    
});

$("#getGateway").click(() => {
    alert("Geräte werden nun gesucht...");
    socket.emit("message", {to: "broadlink.0", cmd: "browse"}, devicefound);
});

function devicefound(device) {
    console.log("found: ", device);
    $("input[name=ip]").val(device.host.address);
    alert("Gerät wurde gefunden.", "Fertig", "success")
}

var socket = io(window.location.origin +":3000");

socket.on("connect", () => {
    console.log("Verbunden...");
})

socket.on('error', (err) => {
    console.log("Error", err);
});