const LGTV = require("lgtv2");
const fs = require("fs");

var adapter;
let connection;
let timeout;
let pollInterval;
let setOnPoll = false;

function startAdapter(base) {
    adapter = base;
    base.subscribe("*");
    base.onStateChanged(changed);
    //base.onMessage(message);
    base.onStop(stop);

    initCreate();

    pollInterval = setInterval(pollInfo, adapter.settings.pollTime || 10000);
    
    return base;
}

function stop() {
    clearInterval(pollInterval);
    clearTimeout(timeout);
    if(connection)  connection.close();
    connection = null;
    adapter = null;
}

function changed(data) {
    if(data.ack)
        return;

    let ip = adapter.settings.ip;

    switch(data.state) {
        case "popup":
            sendCommand(ip, "ssap://system.notifications/createToast", {message: data.value}, (err, res) => {
                if(!err) adapter.setState(data.id, data.value, true);
            });
            break;

        case "app":
            sendCommand(ip, "ssap://system.launcher/launch", {id: data.value}, (err, res) => {
                if(!err) adapter.setState(data.id, data.value, true);
            });
            break;

        case "turnoff":
            sendCommand(ip, "ssap://system/turnOff", {message: true}, (err, res) => {
                if(!err) adapter.setState(data.id, data.value, true);
            });
            break;

        case "volume":
            sendCommand(ip, "ssap://audio/setVolume", {volume: parseInt(data.value)}, (err, res) => {
                if(!err) adapter.setState(data.id, data.value, true);
            });
            break;

        default:
            adapter.log.warn("Kommando " + data.state + " wird nicht unterstützt.")
    }
}

function initCreate() {
    adapter.addState("on", "TV an", "boolean", "connection", 1, "");
    adapter.addState("popup", "Popup anzeigen", "string", "message", 2, "");
    adapter.addState("app", "Aktuelle App", "string", "string", 3, "");
    adapter.addState("app_name", "Aktuelle App", "string", "string", 1, "");
    adapter.addState("channelId", "Aktueller Kanal", "string", "string", 3, "");
    adapter.addState("channelName", "Aktueller Kanal", "string", "string", 1, "");
    adapter.addState("volume", "Lautstärke", "number", "number", 3, 0);
    adapter.addState("launchPoints", "Launch Points", "array", "array", 1, []);
    
    adapter.addState("turnoff", "TV ausschalten", "button", "button", 0, "");
}

function sendCommand(ip, cmd, options, cb) {
    clearTimeout(timeout);

    if(connection == undefined)
        connectDevice(ip, () =>
            connection.request(cmd, options, cb)
        );
    else
        connection.request(cmd, options, cb)

    timeout = setTimeout(() => {
        if(connection == undefined) return;
        connection.disconnect();
        delete connection;
    }, 60000);
}

function connectDevice(ip, cb) {
    var keysett = adapter.database.getValue("tv-key");

    let lgtvobj = new LGTV({
		url: 		'ws://' + ip + ':3000',
		timeout: 	3000,
        reconnect: 	false,
        saveKey: function(key) { adapter.database.setValue("tv-key", { key: key }) },
		clientKey: 	keysett == null ? "":keysett.key
    });
    
	lgtvobj.on('prompt', function ()
	{
		adapter.log.debug('Waiting for pairing confirmation on WebOS TV ' + adapter.config.ip);
	});

	lgtvobj.on('error', function (error)
	{
        delete connections;
		//console.log('Error on connecting or sending command to WebOS TV: ' + error);
	});
	lgtvobj.on('close', function (error)
	{
        delete connections;
		//console.log('Connection closed: ' + error);
	});

	lgtvobj.on('connect', function (error, response)
	{
        connection = lgtvobj;
        cb(ip);
    });
}

function pollInfo() {
    let ip = adapter.settings.ip;

    sendCommand(ip, 'ssap://com.webos.applicationManager/getForegroundAppInfo', null, (err, resp) => {
        if(err) { 
            //console.log("Error: ", item, err);
            adapter.setState("on", false, true);
            return; 
        }

        adapter.setState("app", resp.appId, true);
        adapter.setState("app_name", resp.appId, true);
        adapter.setState("on", true, true);
    });

    if(adapter.getState("on").value == false) {
        if(setOnPoll) {
            setInterval(pollInfo, adapter.settings.pollTime || 10000);
        }
        setOnPoll = false;
    } else {
        if(!setOnPoll) {
            setInterval(pollInfo, 2000);
        }
        setOnPoll = true;
    }

    sendCommand(ip, 'ssap://tv/getCurrentChannel', null, (err, resp) => {
        if(err) return;

        if(resp.returnValue) {
            adapter.setState("channelId", resp.channelId, true);
            adapter.setState("channelName", resp.channelName, true);
        } else {
            adapter.setState("channelId", "", true);
            adapter.setState("channelName", "", true);
        }
    });

    sendCommand(ip, 'ssap://audio/getVolume', null, (err, resp) => {
        if(err) return;
        adapter.setState("volume", resp.volume, true);
    });

    sendCommand(ip, 'ssap://com.webos.applicationManager/listLaunchPoints', null, (err, resp) => {
        if(err) return;
        var points = [];
        var res = {};

        resp.launchPoints.forEach((point) => {
            points.push({ id: point.id, title: point.title});
        });

        var sorted = points.sort((a, b) => (a.title.toLowerCase() > b.title.toLowerCase()) ? 1 : -1);
        sorted.forEach((item) => res[item.id] = item.title);

        adapter.setStatesList("app", res);
        adapter.setState("launchPoints", sorted, true);
    });
}


module.exports = startAdapter