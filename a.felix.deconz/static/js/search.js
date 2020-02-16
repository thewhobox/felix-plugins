var instanceKey = $("#instance").val();
var socket = io("http://" + window.location.hostname +":3000");
var settings = null;
var searchCount = 0;
var finCount = 0;
var notsaved = false;

$(document).ready(() => {
    if ($("#settings").length != 0)
        settings = JSON.parse($("#settings").val());
});


$("#save").click(() => {
    var devices = [];
    var url = window.location.href;

    $("table tbody input[type=checkbox]:checked").each((index, item) => {
        if (!item.checked)
            return;

        var topele = $(item).parent().parent().parent();
        var json = topele.attr("data-json");
        var data = JSON.parse(decodeURI(json));
        data.name = $("span[data-type=name]", topele).html();
        data.supports = data.supports.arr;
        data.numbId = data.id;
        if (data.id < 10)
            data.id = "0" + data.id;
        data.id = data.type + "." + data.id;
        data.hasColor = data.hascolor;

        if (data.type != "Sensor") {
            delete data.config,
                delete data.state;
        }

        delete data.devicemembership;
        delete data.etag;
        delete data.action;
        delete data.lights;
        delete data.manufacturername;
        delete data.modelid;
        delete data.uniqueid;
        delete data.swversion;
        delete data.hascolor;

        devices.push(data);
    });

    socket.emit("message", { to: instanceKey, cmd: "saveDevices", value: devices}, function(result) {
        alert("Geräte wurden gespeichert.")
    }); 
});

$("a[data-group=devicesL").click(() => {
    if (!checkSettings()) return;
    searchLights();
});

$("a[data-group=devicesG").click(() => {
    if (!checkSettings()) return;
    searchGroups();
});

$("a[data-group=devicesS").click(() => {
    if (!checkSettings()) return;
    searchSensors();
});

$("#searchNow").click(() => {
    if (!checkSettings()) return;
    searchLights();
    searchGroups();
    searchSensors();
});

function checkSettings() {
    if (settings.username == "") {
        alert("Bitte gib in den Einstellungen erst einen Username ein.", "red white-text");
        return false;
    }

    return true;
}

function searchLights() {
    $("#devicesL tbody").html("");



    /*let xdata = {"1":{"etag":"6569fde455b9a6e02f57e112a038fd93","hascolor":false,"manufacturername":"Philips","modelid":"LWB010","name":"Decke","state":{"alert":"none","bri":254,"on":true,"reachable":true},"swversion":"1.46.13_r26312","type":"Dimmable light","uniqueid":"00:17:88:01:03:0d:a7:cf-0b"},"2":{"ctmax":454,"ctmin":250,"etag":"06ce59f95366265519c2c3d0bc5632e4","hascolor":true,"manufacturername":"IKEA of Sweden","modelid":"TRADFRI bulb GU10 WS 400lm","name":"Flur L","state":{"alert":"none","bri":254,"colormode":"ct","ct":370,"on":true,"reachable":false},"swversion":"1.2.217","type":"Color temperature light","uniqueid":"90:fd:9f:ff:fe:78:c8:6a-01"},"3":{"ctmax":454,"ctmin":153,"etag":"065a6f983ac0d845270a1100c49ef505","hascolor":true,"manufacturername":"Philips","modelid":"LTW013","name":"Arbeit L","state":{"alert":"none","bri":254,"colormode":"ct","ct":366,"on":false,"reachable":true},"swversion":"1.46.13_r26312","type":"Color temperature light","uniqueid":"00:17:88:01:02:f0:e8:3c-0b"},"4":{"ctmax":454,"ctmin":153,"etag":"065a6f983ac0d845270a1100c49ef505","hascolor":true,"manufacturername":"Philips","modelid":"LTW013","name":"Arbeit R","state":{"alert":"none","bri":254,"colormode":"ct","ct":366,"on":false,"reachable":true},"swversion":"1.46.13_r26312","type":"Color temperature light","uniqueid":"00:17:88:01:02:f0:e7:c8-0b"},"5":{"ctmax":500,"ctmin":153,"etag":"06ce59f95366265519c2c3d0bc5632e4","hascolor":true,"manufacturername":"dresden elektronik","modelid":"FLS-PP3","name":"Hintergrund","powerup":7,"state":{"alert":"none","bri":178,"colormode":"hs","ct":500,"effect":"none","hue":5376,"on":false,"reachable":true,"sat":208,"xy":[0.5372,0.3762]},"swversion":"0214.201000EB","type":"Extended color light","uniqueid":"00:21:2e:ff:ff:02:7f:4e-0a"},"6":{"etag":"06ce59f95366265519c2c3d0bc5632e4","hascolor":false,"manufacturername":"dresden elektronik","modelid":"FLS-PP3 White","name":"Light 6","powerup":7,"state":{"alert":"none","bri":178,"on":false,"reachable":true},"swversion":"0214.201000EB","type":"Dimmable light","uniqueid":"00:21:2e:ff:ff:02:7f:4e-0b"},"7":{"ctmax":454,"ctmin":153,"etag":"06ce59f95366265519c2c3d0bc5632e4","hascolor":true,"manufacturername":"Philips","modelid":"LTW013","name":"Küche R","state":{"alert":"none","bri":254,"colormode":"ct","ct":366,"on":false,"reachable":true},"swversion":"1.46.13_r26312","type":"Color temperature light","uniqueid":"00:17:88:01:03:ae:13:b9-0b"},"8":{"ctmax":454,"ctmin":153,"etag":"06ce59f95366265519c2c3d0bc5632e4","hascolor":true,"manufacturername":"Philips","modelid":"LTW013","name":"Küche L","state":{"alert":"none","bri":254,"colormode":"ct","ct":366,"on":false,"reachable":true},"swversion":"1.46.13_r26312","type":"Color temperature light","uniqueid":"00:17:88:01:03:ae:13:7b-0b"},"9":{"ctmax":454,"ctmin":250,"etag":"06ce59f95366265519c2c3d0bc5632e4","hascolor":true,"manufacturername":"IKEA of Sweden","modelid":"TRADFRI bulb GU10 WS 400lm","name":"Flur R","state":{"alert":"none","bri":233,"colormode":"ct","ct":370,"on":true,"reachable":false},"swversion":"1.2.217","type":"Color temperature light","uniqueid":"90:fd:9f:ff:fe:83:63:bf-01"}}

    $.each(xdata, (index, item) => {
        item.id = index;
        item.supports = getSupports(item, "L");
        item.type = "Light";
        addLightOrGroup(item);
    });
*/

    $.ajax("http://" + settings.ip + "/api/" + settings.username + "/lights")
        .done((data) => {
            $.each(data, (index, item) => {
                item.id = index;
                item.supports = getSupports(item, "L");
                item.type = "Light";
                addLightOrGroup(item);
            });
        })
        .fail((err) => {
            alert("Es trat ein Fehler auf 3\r\n", "red white-text");
            console.log("http://" + settings.ip + "/api/" + settings.username + "/lights");
            console.log(err);
        })
        .always(() => {
            reloadActionClicks("L");
        });
}

function searchGroups() {
    $("#devicesG tbody").html("");

    $.ajax("http://" + settings.ip + "/api/" + settings.username + "/groups")
        .done((dataG) => {
            $.ajax("http://" + settings.ip + "/api/" + settings.username + "/lights")
                .done((dataL) => {
                    $.each(dataG, (index, item) => {
                        let regex = new RegExp("helper[0-9]+ for group [0-9]+");
                        if (regex.test(item.name)) return;
                        var supp = [];

                        $.each(item.lights, (index, item2) => {
                            var supports = getSupports(dataL[item2], "L");
                            if (supports.text == "Nicht unterstützt") return;

                            $.each(supports.arr, (index, itemSup) => {
                                if (supp.indexOf(itemSup) == -1) supp.push(itemSup);
                            });
                        });
                        if (supp.length == 0) item.supports = { arr: supp, text: "Nicht unterstützt" }
                        else item.supports = { arr: supp, text: supp.join(", ") };

                        item.type = "Group";
                        addLightOrGroup(item, "G");
                    });
                })
                .fail((err) => {
                    alert("Es trat ein Fehler auf 1", "red white-text");
                })
                .always(() => {
                    finCount++;
                    reloadActionClicks("G");
                });


        })
        .fail((err, code, x) => {
            alert("Es trat ein Fehler auf 2", "red white-text");
        });
}

function searchSensors() {
    $("#devicesS tbody").html("");

    $.ajax("http://" + settings.ip + "/api/" + settings.username + "/sensors")
        .done((data) => {
            $.each(data, (index, item) => {
                if (item.name.indexOf("CLIP-Sensor TOOGLE") !== -1)
                    return;

                item.id = index;
                item.supports = getSupports(item, "S");
                item.type = "Sensor";
                addLightOrGroup(item, "S");
            });
            reloadActionClicks();
        })
        .fail((err) => {
            alert("Es trat ein Fehler auf 4", "red white-text");
        })
        .always(() => {
            finCount++;
            reloadActionClicks("S");
        });
    

}
    
function reloadActionClicks(type) {
    $("tbody a").off();

    $("#devices" + type + " a[data-type=info]").click((ele, b, c) => {
        var data = JSON.parse(decodeURI($(ele.target).parent().parent().attr("data-json")));

        $("#modal_info .modal-content h4 span").html(data.name);
        $("#modal_info .modal-content p").html(JSON.stringify(data, null, 4));

        var instance = M.Modal.getInstance($("#modal_info")[0]);
        instance.open();
    });

    $("#devices" + type + " a[data-type=rename]").click((ele, b, c) => {
        var data = JSON.parse(decodeURI($(ele.target).parent().parent().attr("data-json")));
        var newName = encodeURI(prompt("Bitte gib den neuen Namen ein:", data.name));
        if (newName == "null")
            return;
        if (newName.indexOf("%") != -1) {
            alert("Es sind keine Sonderzeichen erlaubt!", "red white-text");
            return;
        }
        var topele = $(ele.target).parent().parent();
        $("#devices" + type + " td[data-type=name]", topele).html(encodeURI(newName));
    });
}

var actionButtons = "<a data-type='rename' class='btn-flat'>Umbenennen</a>" +
    "<a data-type='info' class='btn-flat blue-text'>Info</a>";
    //"<a data-type='edit' class='btn-flat orange-text'>Bearbeiten</a>";

function addLightOrGroup(item, type = "L") {
    var check = item.supports.text == "Nicht unterstützt" ? "disabled" : "checked";
    var classx = item.supports.text == "Nicht unterstützt" ? "notsupported" : "";
    $("#devices" + type + " tbody").append("<tr id='" + item.id + "' data-json='" + encodeURI(JSON.stringify(item)) + "' class='" + classx + "'><td><label class='input-field'><input type='checkbox' " + check + " /><span class='black-text' data-type='name'>" + item.name + "</span></label></td><td>" + actionButtons + "</td><td>" + item.supports.text + "</td></tr>");
}

function getSupports(item, type) {
    let sup2img = {
        "switch": "power_settings_new", 
        "dim": "network_cell",
        "color": "color_lens",
        "temp": "invert_colors",
        "lowbatt": "battery_full",
        "lux": "brightness_medium",
        "day/night": "wb_sunny"}
    var supports = new Array();

    switch (type) {
        case "L":
            if (item.hascolor) {
                if (item.state.hasOwnProperty("hue"))
                    supports.push("color");
                else
                    supports.push("empty");
                if (item.state.hasOwnProperty("ct"))
                    supports.push("temp");
                else
                    supports.push("empty");
            } else {
                supports.push("empty");
                supports.push("empty");
            }

            if (item.state.hasOwnProperty("on"))
                supports.push("switch");
            else
                supports.push("empty");

            if (item.state.hasOwnProperty("bri"))
                supports.push("dim");
            else
                supports.push("empty");
            break;

        case "G":
            // todo, check every light to get all supported states
            break;

        case "S":
            if (item.manufacturername == "Phoscon")
                return { arr: supports, text: "Nicht unterstützt" };

            if (item.state.hasOwnProperty("buttonevent") || item.state.hasOwnProperty("presence"))
                supports.push("switch");
            else
                supports.push("empty");

            if (item.state.hasOwnProperty("lux"))
                supports.push("lux");
            else
                supports.push("empty");

            if (item.state.hasOwnProperty("daylight"))
                supports.push("day/night");
            else
                supports.push("empty");

            if (item.state.hasOwnProperty("lowbattery"))
                supports.push("lowbatt");
            else
                supports.push("empty");

            break;
        default:
            return { arr: supports, text: "Nicht unterstützt" };
    }

    if (supports.length == 0)
        return { arr: supports, text: "Nicht unterstützt" }

    let text = "";
    supports.forEach((item) => {
        if(item == "empty")
            text = text + '<i class="material-icons empty"></i>';
        else
            text = text + '<i class="material-icons">' + sup2img[item] + "</i>";
    })
    
    return { arr: supports, text };
}