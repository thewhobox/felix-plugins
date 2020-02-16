var request = require("request-promise-native");
const W3CWebSocket = require('websocket').w3cwebsocket;
const fs = require('fs');
var helper = require("./views/searchhelper");

let connection;
let adapter;
let connectTO;
let speechLightConf;
let doIteration = 0;


function startAdapter(base) {
    adapter = base;
    base.subscribe("*");
    base.onStateChanged(changed);
    base.onStop(stop);
    base.onSpeechChanged(speechChanged);
    base.onMessage(message);

    adapter.addState("connection", "Verbindung", "boolean", "connection", 1, false);


    if (adapter.settings.ip == "") {
        adapter.log.error("Es wurde keine IP angegeben. Adapter wird beendet.");
        setTimeout(() => adapter.exit(), 2000);
        return base;
    }

    speechLightConf = JSON.parse(fs.readFileSync(__dirname + "/speechlight.json").toString());

    tryConnect();
    return base;
}


function stop() {
    if (connection)
        connection.close();
    connection = null;
    speechLightConf = null;
    clearTimeout(connectTO);
    adapter.setState("connection", false, true);
}


function message(cmd, data, cb) {
    adapter.log.info(cmd)

    switch (cmd) {
        case "saveDevices":
            data.forEach(item => {
                helper(item, adapter.dmanager);
            });
            cb();
            break;
    }
}


async function tryConnect() {
    var res = await request.get("http://" + adapter.settings.ip + "/api/" + adapter.settings.username + "/config")
        .catch((e) => adapter.log.error("Gateway nicht erreichbar unter '" + adapter.settings.ip + "'"));

    if (typeof res !== "string") {
        //connectTO = setTimeout(tryConnect, 60000); //Todo wieder entkommentieren
        return;
    }
    res = JSON.parse(res);

    if (res.websocketport) {
        connection = new W3CWebSocket('ws://' + adapter.settings.ip + ':' + res.websocketport); //8306e66875c54b4c816fed315c3cd2e6
        adapter.log.debug('ws://' + adapter.settings.ip + ':' + res.websocketport);
        connection.onopen = webOpen;
        connection.onerror = webError;
        connection.onmessage = webMessage;
    } else {
        adapter.log.error("Kein Port in config. Es kann kein Websocket erstellt werden.")
    }
}


function webOpen() {
    adapter.setState("connection", true, true);
    adapter.log.info("Mit Deconz verbunden");
}

function webError(err) {
    adapter.setState("connection", false, true);
    adapter.log.error("Verbindung konnte nicht hergestellt werden. Nächster Versuch in 1 Minute.");
    adapter.log.debug(JSON.stringify(err));
    connectTO = setTimeout(tryConnect, 60000);
}

function webMessage(message) {
    var data = JSON.parse(message.data);


    if (data.e !== "changed")
        return;

    let id = data.id;
    if (parseInt(id) < 10)
        id = "0" + id;

    switch (data.r) {
        case "lights":
            id = "Light." + id;
            handleLightChange(id, data.state);
            break;

        case "groups":
            id = "Group." + id;
            handleGroupChange(id, data.state);
            break;

        case "sensors":
            //console.log(data);
            id = "Sensor." + id;
            handleSensorChange(id, data.state);
            break;
    }
}

function handleLightChange(id, data) {
    Object.keys(data).forEach((key) => {
        let stateid = id + "." + key;
        //let state = adapter.getState(stateid);

        switch (key) {
            case "hue":
                adapter.setState(stateid, Math.round(data[key] * 0.00549325), true);
                break;
            case "sat":
            case "bri":
                adapter.setState(stateid, Math.round(data[key] / 2.55), true);
                break;
            case "ct":
                adapter.setState(stateid, Math.round((data[key] + 1.22) / 0.077111), true);
                break;
            case "on":
                adapter.setState(stateid, data[key], true);
                break;
        }
    });
}

function handleGroupChange(id, data) {

}

function handleSensorChange(id, data) {
    let ignore = ["lastupdated", "flag"]

    adapter.log.debug(id + ": " + JSON.stringify(data))

    for (var statename in data) {
        if (ignore.indexOf(statename) != -1) continue;

        adapter.setState(id + "." + statename, data[statename], true);
    }
}


async function changed(data) {
    if (data.ack)
        return;

    var id = data.id.substr(data.id.indexOf(".") + 1);
    id = id.substr(0, id.indexOf("."));
    if (id.indexOf('0') == 0)
        id = id.substr(1);
    var type = data.id.substr(0, data.id.indexOf("."));
    var apiurl = "http://" + adapter.settings.ip + "/api/" + adapter.settings.username + "/";

    if (type == "Group")
        apiurl = apiurl + "groups/" + id + "/action"
    if (type == "Light")
        apiurl = apiurl + "lights/" + id + "/state"
    if (type == "Sensor") {
        apiurl = apiurl + "sensors/" + id + "/config"

        var toset = {};
        toset[data.state] = data.value;

        await setState(apiurl, toset, data)
            .catch((e) => adapter.log.error("Fail: ", e.statusCode));

        return;
    }




    switch (data.state) {
        case "hue":
            await setState(apiurl, { hue: Math.round(data.value / 0.00549325) }, data)
                .catch((e) => adapter.log.error("Fail: ", e.statusCode));
            break;

        case "on":
            await setState(apiurl, { on: data.value }, data)
                .catch((e) => adapter.log.error("Fail: ", e.statusCode));
            break;

        case "sat":
        case "bri":
            var tosetval = Math.round(data.value * 2.55);
            var toset = {};
            toset.on = tosetval > 0;
            toset[data.state] = tosetval;
            await setState(apiurl, toset, data)
                .catch((e) => adapter.log.error("Fail: ", e.statusCode));
            break;

        case "ct":
            var toset = Math.round((data.value * 0.077111) - 1.22);
            await setState(apiurl, { on: true, ct: toset }, data)
                .catch((e) => adapter.log.error("Fail: ", e.statusCode));
            break;

        case "command":
            if (typeof (data.value) == "string") data.value = JSON.parse(data.value);
            await setState(apiurl, data.value, data)
                .then(() => {
                    adapter.setState(data.id, data.value, true);
                })
                .catch((e) => adapter.log.error("Fail: ", e.statusCode));
            break;

        case "transition":
            adapter.setState(data.id, data.value, true);
            break;
    }
}

function setState(apiurl, states, data) {
    if (states.hasOwnProperty("transitiontime") == false && data != undefined) {
        var transstate = adapter.getState(data.parent + ".transition");
        if (transstate != undefined)
            states.transitiontime = transstate.value * transstate.multiplier;
    }
    return request.put({
        url: apiurl,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(states)
    })
}






async function speechChanged(state, siteId) {
    // adapter.log.debug("Speech Changed to state: " + state);
    // adapter.log.debug("Speech Changed in room: " + siteId);
    doIteration++;



    let apiurl = "http://" + adapter.settings.ip + "/api/" + adapter.settings.username + "/";
    let devices = adapter.dmanager.getDevicesByFilter({ useSpeechlight: true });

    // adapter.log.debug("Geräte für Licht:");
    // adapter.log.debug(JSON.stringify(devices));

    if (state == "stop") {
        devices.forEach((device) => {
            let id = parseInt(device.id.substr(device.id.indexOf(".") + 1));
            let url = "";
            if (device.channel == "Group")
                url = apiurl + "groups/" + id + "/action";
            if (device.channel == "Light")
                url = apiurl + "lights/" + id + "/state";

            setState(url, { on: false });
        });
        return;
    }


    if (speechLightConf[state] && speechLightConf[state].single) {
        for (let i = 0; i < speechLightConf[state].single.length; i++) {
            let action = speechLightConf[state].single[i];

            if (action.type == "command") {
                devices.forEach((device) => {
                    let id = parseInt(device.id.substr(device.id.indexOf(".") + 1));
                    let url = "";
                    if (device.channel == "Group")
                        url = apiurl + "groups/" + id + "/action";
                    if (device.channel == "Light")
                        url = apiurl + "lights/" + id + "/state";

                    setState(url, action.command);
                });
                if (action.wait)
                    await sleep(action.command.transitiontime * 100);
            } else if (action.type == "wait") {
                await sleep(action.time);
            } else {
                adapter.log.error("Unbekannter Aktionstyp: " + action.type)
            }
        }
    }

    if (speechLightConf[state] && speechLightConf[state].loop) {
        let startedIteration = doIteration;
        while (startedIteration == doIteration) {
            for (let i = 0; i < speechLightConf[state].loop.length; i++) {
                let action = speechLightConf[state].loop[i];

                if (action.type == "command") {
                    devices.forEach((device) => {
                        let id = parseInt(device.id.substr(device.id.indexOf(".") + 1));
                        let url = "";
                        if (device.channel == "Group")
                            url = apiurl + "groups/" + id + "/action";
                        if (device.channel == "Light")
                            url = apiurl + "lights/" + id + "/state";

                        setState(url, action.command);
                    });
                    if (action.wait)
                        await sleep(action.command.transitiontime * 100);
                } else if (action.type == "wait") {
                    await sleep(action.time);
                } else {
                    adapter.log.error("Unbekannter Aktionstyp: " + action.type)
                }
            }
        }

    }

}

async function sleep(time) {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(), time);
    });
}

module.exports = startAdapter;