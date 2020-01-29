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
    if($("#ip").val() !== "0.0.0.0" && $("#ip").val() !== "") {
        $.get("http://" + $("#ip").val() + "/api")
        .done((data, status) => {
            if(status == 200)
                verifyUsername();
            else
                getGateway();
        })
    } else {
        getGateway();
    }
});

function getGateway() {
    $.get("https://dresden-light.appspot.com/discover")
    .done((data) => {
        if(data.length > 0) {
            var ip = data[0].internalipaddress;
            if(data[0].internalport != 80)
                ip = ip + ":" +data[0].internalport;
            $("#ip").val(ip);
            if($("#username").val() == "") {
                alert("Gateway '" + data[0].name + "' wurde gefunden. Es wird nun nach einem Username gefragt.");
                verifyUsername();
            } else {
                alert("Gateway '" + data[0].name + "' wurde gefunden.");
            }
        } else {
            alert("Es konnt kein Gateway gefunden werden.\r\n Stellen Sie sicher, dass Internet verfügbar ist oder geben Sie die IP manuell ein.", "Warnung", "warning");
        }
    })
}

function verifyUsername() {
    $.get("http://" + $("#ip").val() + "/api/" + $("#username").val() + "/config")
    .done((data, status) => {
        if(status == 200)
            alert("Einstellungen wurde erfolgreich konfiguruert.<br>Bitte speichern Sie jetzt.", "Konfiguration", "success");
        else
            getUsername();
    });
}

function getUsername() {
    var url = "http://" + $("#ip").val() + "/api";

    alert("Bitte drücken Sie jetzt den Knopf vom Gateway", "Achtung", "warning");
    
    var intervalStop = false;
    var intervalCount = 0;
    var interval = setInterval(() => {
        intervalCount++;
        if(intervalCount > 30 || intervalStop) {
            if(!intervalStop) alert("Es wurde kein Knopfdruck auf dem Gateway erkannt. Bitte starten Sie die Suche erneut.", "Fehler", "alert");
            clearInterval(interval);
        }
        $.post(url, JSON.stringify({ devicetype: "Felix" }), (data) => {
            $("#username").val(data[0].success.username);
            alert("Einstellungen wurde erfolgreich konfiguruert.<br>Bitte speichern Sie jetzt.", "Konfiguration", "success");
            intervalStop = true;
        }, 'json')
        .fail(function(err) {
            if(!err.responseJSON){
                alert("Es trat ein unbekannter Fehler auf.", "Fehler", "alert");
                intervalStop = true;
                return;
            }
    
            switch(err.responseJSON[0].error.type) {
                case 101:
                    return;
                case 2:
                    alert("Anfrage war ungültig", "Fehler", "alert");
                    intervalStop = true;
                    break;
                default:
                    alert("Es trat ein Fehler auf:\r\n" + err.responseJSON[0].error.description, "Fehler", "alert");
                    intervalStop = true;
                    break;
            }
        });
    }, 1000);
}


