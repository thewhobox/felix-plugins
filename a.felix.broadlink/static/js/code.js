let timeleft = 30;
let countdown;
let codeFound = false;
let gotName = false;
let instanceKey = $("#instance").val();


$("#searchNow").click(() => {
    codeFound = false;
    alert("Drücke nun den Knopf auf der Fernbedienung");
    $("[data-type=status]").html("Suche...");
    socket.emit("message", {to: instanceKey, cmd: "learnCode"}, foundCode);
    timeleft = 31;
    updateCountdown();
    countdown = setInterval(updateCountdown, 1000);
});

$("#name").keyup(() => {
    gotName = false;
    var key = $("#name").val().toLowerCase();

    if(key == "") return;

    key = key.replace(/ /g, "_");
    key = key.replace(/\./g, "-");

    $("[data-type=key]").html(key);
    gotName = true;
    checkSave();
});

$("#save").click(() => {
    socket.emit("message", {to: instanceKey, cmd: "saveCode", value: {
        data: $("[data-type=data]").html(),
        name: $("#name").val()
    }}, addedCode);
});

function addedCode(resp) {
    console.log("resp: ", resp);

    if(resp === true) {
        alert("Code wurde hinzugefügt", "Erfolgreich", "success");
        $("#name").val("");
        $("[data-type=data]").html("");
        $("[data-type=status]").html("Gespeichert");
    } else {
        $("[data-type=status]").html("Fehler");
    }
}

function checkSave() {
    if(!codeFound || !gotName) {
        $("#save").addClass("disabled");
    } else {
        $("#save").removeClass("disabled");
    }
}

function foundCode(data) {
    clearInterval(countdown);
    console.log("found", data);
    if(data == -1) {
        $("[data-type=status]").html("Beendet");
        return;
    } else {
        $("[data-type=status]").html("Erfolgreich");
        $("[data-type=data]").html(data);
        codeFound = true;
        checkSave();
    }
}

function updateCountdown() {
    timeleft--;
    $("[data-type=countdown]").html(timeleft + " s");
    if(timeleft <= 0) {
        clearInterval(countdown);
        $("[data-type=status]").html("Beendet");
        alert("Es wurde kein Knopfdruck festgestellt.", "red white-text")
    }
}


var socket = io(window.location.origin +":3000");

socket.on("connect", () => {
    console.log("Verbunden...");
})

socket.on('error', (err) => {
    console.log("Error", err);
});