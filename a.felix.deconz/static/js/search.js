var settings = null;
var searchCount = 0;
var finCount = 0;
var notsaved = false;

$(document).ready(() => {
    if ($("#settings").length != 0)
        settings = JSON.parse($("#settings").val());

    alert("Hallo");
});


$("#save").click(() => {
    var devices = [];
    var url = window.location.href;

    $("table tbody input[type=checkbox]:checked").each((index, item) => {
        if (!item.checked)
            return;

        var topele = $(item).parent().parent().parent();
        console.log(topele);
        var json = topele.attr("data-json");
        console.log(decodeURI(json));
        var data = JSON.parse(decodeURI(json));
        data.name = $("span[data-type=name]", topele).html();
        data.supports = data.supports.arr;
        data.numbId = data.id;
        if (data.id < 10)
            data.id = "0" + data.id;
        data.id = data.type + "." + data.id;

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

    $.post({
        url: url,
        data: JSON.stringify(devices),
        contentType: "application/json; charset=utf-8"
    })
        .done((data) => {
            alert("Fertig");
        });

});

$("#searchNow").click(() => {
    if (settings.username == "") {
        alert("Bitte gib in den Einstellungen erst einen Username ein.", "red white-text");
        return;
    }

    if (!settings.checkgroup && !settings.checklight && !settings.checksensor) {
        alert("Bitte wähle mindestens ein Gerät aus (Gruppe, Leuchte oder Sensor)", "red white-text");
        return;
    }
    $("#devicesG tbody").html("");
    $("#devicesL tbody").html("");
    $("#devicesS tbody").html("");

    var url = "";

    if (settings.checkgroup) {
        searchCount++;
        url = "http://" + settings.ip + "/api/" + settings.username + "/groups";
        console.log(url);

       
        $.ajax(url)
            .done((dataG) => {
                url = "http://" + settings.ip + "/api/" + settings.username + "/lights";
                $.ajax(url)
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
                        reloadActionClicks();
                    });


            })
            .fail((err, code, x) => {
                alert("Es trat ein Fehler auf 2", "red white-text");
            });
    }

    if (settings.checklight) {
        searchCount++;
        url = "http://" + settings.ip + "/api/" + settings.username + "/lights";

        $.ajax(url)
            .done((data) => {
                $.each(data, (index, item) => {
                    item.id = index;
                    item.supports = getSupports(item, "L");
                    item.type = "Light";
                    addLightOrGroup(item);
                });
            })
            .fail((err) => {
                alert("Es trat ein Fehler auf 3", "red white-text");
            })
            .always(() => {
                finCount++;
                reloadActionClicks();
            });
    }

    if (settings.checksensor) {
        searchCount++;
        url = "http://" + settings.ip + "/api/" + settings.username + "/sensors";

        $.ajax(url)
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
                reloadActionClicks();
            });
    }
});


function reloadActionClicks() {
    if (finCount != searchCount)
        return;

    $("a[data-type=info]").click((ele, b, c) => {
        var data = JSON.parse(decodeURI($(ele.target).parent().parent().attr("data-json")));

        $("#modal_info .modal-content h4 span").html(data.name);
        $("#modal_info .modal-content p").html(JSON.stringify(data, null, 4));

        var instance = M.Modal.getInstance($("#modal_info")[0]);
        instance.open();
    });

    $("a[data-type=rename]").click((ele, b, c) => {
        var data = JSON.parse(decodeURI($(ele.target).parent().parent().attr("data-json")));
        var newName = encodeURI(prompt("Bitte gib den neuen Namen ein:", data.name));
        if (newName == "null")
            return;
        if (newName.indexOf("%") != -1) {
            alert("Es sind keine Sonderzeichen erlaubt!", "red white-text");
            return;
        }
        var topele = $(ele.target).parent().parent();
        $("td[data-type=name]", topele).html(encodeURI(newName));
    });
}

var actionButtons = "<a data-type='rename' class='btn-flat'>Umbenennen</a>" +
    "<a data-type='info' class='btn-flat blue-text'>Info</a>";
    //"<a data-type='edit' class='btn-flat orange-text'>Bearbeiten</a>";

function addLightOrGroup(item, type = "L") {
    var check = item.supports.text == "Nicht unterstützt" ? "disabled" : "checked";
    var classx = item.supports.text == "Nicht unterstützt" ? "notsupported" : "";
    console.log("x",item);
    console.log(encodeURI(JSON.stringify(item)));
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
                if (item.state.colormode == "ct")
                    supports.push("temp");
                else
                    supports.push("color");
            } else {
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