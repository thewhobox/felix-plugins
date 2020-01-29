const W3CWebSocket = require('websocket').w3cwebsocket;
var request = require("request-promise-native");
let connection;

function startAdapter(base) {
    adapter = base;
    base.subscribe("*");
    base.onStateChanged(changed);
    base.onStop(stop);

    tryConnect();
    adapter.addState("connection", "Verbindung", "boolean", "connection", 1, false);
    return base;
}

function stop() {
    if(connection)
        connection.close();
    connection = null;
}

async function changed(data) {
    if (data.ack || data.id.indexOf(".command.") == -1)
        return;

    var dId = data.id.substr(0, data.id.indexOf("."));

    var headers = { 'Content-Type': 'application/json' };
    var prefix = adapter.settings.isSSL ? "https://" : "http://";
    var baseuri = prefix + adapter.settings.address + "/Sessions/" + dId;

    switch (data.state) {
        case 'togglePlay':
            await request.post({
                uri: baseuri + "/Playing/PlayPause?api_key=" + adapter.settings.apikey,
                headers: headers
            }).catch((e) => adapter.log.error("Fail: ", e));
            break;
        case 'play':
            await request.post({
                uri: baseuri + "/Playing/Unpause?api_key=" + adapter.settings.apikey,
                headers: headers
            }).catch((e) => adapter.log.error("Fail: ", e));
            break;

        case 'pause':
            await request.post({
                uri: baseuri + "/Playing/Pause?api_key=" + adapter.settings.apikey,
                headers: headers
            }).catch((e) => adapter.log.error("Fail: ", e));
            break;

        case 'mute':
            await request.post({
                uri: baseuri + "/Command/Mute?api_key=" + adapter.settings.apikey,
                headers: headers
            }).catch((e) => adapter.log.error("Fail: ", e));
            break;

        case 'unmute':
            await request.post({
                uri: baseuri + "/Command/Unmute?api_key=" + adapter.settings.apikey,
                headers: headers
            }).catch((e) => adapter.log.error("Fail: ", e));
            break;

        case 'toggleMute':
            await request.post({
                uri: baseuri + "/Command/ToggleMute?api_key=" + adapter.settings.apikey,
                headers: headers
            }).catch((e) => adapter.log.error("Fail: ", e));
            break;

        case 'message':
            await request.post({
                uri: baseuri + "/Message?api_key=" + adapter.settings.apikey,
                body: '{"Header":"Test", "Text":"' + data.value + '", "TimeoutMs":"5000" }',
                headers: headers
            })
                .then(() => adapter.setState(data.id, data.value, true))
                .catch((e) => adapter.log.error("Fail: ", e));
            break;


        case 'dialog':
            var jsonbody = '';
            if (data.value.indexOf('|') !== -1) {
                var paras = data.value.split('|');
                jsonbody = '{"Header":"' + paras[0] + '", "Text":"' + paras[1] + '" }';
            } else {
                jsonbody = '{"Header":"Felix", "Text":"' + data.value + '" }';
            }

            await request.post({
                uri: baseuri + "/Message?api_key=" + adapter.settings.apikey,
                body: jsonbody,
                headers: headers
            })
                .then(() => adapter.setState(data.id, data.value, true))
                .catch((e) => adapter.log.error("Fail: ", e));
            break;


        case 'goHome':
            await request.post(baseuri + "/Command/GoHome?api_key=" + adapter.settings.apikey, {}
            ).catch((e) => adapter.log.error("Fail: ", e.statusCode));
            break;

        case 'goToSearch':
            await request.post(baseuri + "/Command/GoToSearch?api_key=" + adapter.settings.apikey, {}
            ).catch((e) => adapter.log.error("Fail: ", e.statusCode));
            break;

        case 'back':
            await request.post(baseuri + "/Command/Back?api_key=" + adapter.settings.apikey, {}
            ).catch((e) => adapter.log.error("Fail: ", e.statusCode));
            break;

        case 'volume':
            await request.post({
                uri: baseuri + "/Command/SetVolume?api_key=" + adapter.settings.apikey,
                body: JSON.stringify(JSON.parse('{ "Arguments":{ "Volume": ' + data.value + ' } }')),
                headers: headers
            }).catch((e) => adapter.log.error("Fail: ", e.statusCode));
            break;

        default:
            adapter.log.error("Not supported command: " + data.state + " | " + data.id);
            break;
    }
}

function tryConnect() {
    try {
        var prefix = adapter.settings.isSSL ? "wss" : "ws";
        connection = new W3CWebSocket(prefix + '://' + adapter.settings.address + '?api_key=' + adapter.settings.apikey + '&deviceId=00001'); //8306e66875c54b4c816fed315c3cd2e6
        connection.onopen = webOpen;
        connection.onerror = webError;
        connection.onmessage = webMessage;

        if (adapter.settings.apikey == "")
            adapter.log.warn("Es wurde kein API-Key angegeben. Daten werden empfangen, aber keine steuerung möglich.");
    } catch (e) {
        adapter.setState("connection", false, true);
        adapter.log.warn("Verbindung konnte nicht hergestellt werden. Nächster Versuch in 1 Minute: \"" + e.message + "\"");
        setTimeout(tryConnect, 60000);
    }
}

function webOpen() {
    if(connection == undefined || connection.readyState !== 1) {
        adapter.log.error("Verbindung konnte nicht hergestellt werden. (readyState) Nächster Versuch in 1 Minute.");
        if(connection) connection.close();
        connection = null;
        setTimeout(tryConnect, 60000);
        return;
    }
    adapter.setState("connection", true, true);
    adapter.log.info("Verbunden");
    connection.send('{"MessageType":"SessionsStart", "Data": "10000,10000"}');
}

function webError(err) {
    adapter.setState("connection", false, true);
    adapter.log.error("Verbindung konnte nicht hergestellt werden. Nächster Versuch in 1 Minute.");
    setTimeout(tryConnect, 60000);
}

function webMessage(message) {
    adapter.setState("connection", true, true);
    var data = JSON.parse(message.data);
    for (var i = 0; i < data.Data.length; i++) {
        var d = data.Data[i];

        if (adapter.settings.deviceIds.indexOf(d.Id) == -1) {
            if (d.Capabilities.PlayableMediaTypes.length == 0 && d.Capabilities.SupportedCommands.length == 0)
                continue;

            createDevice(d);

            adapter.setState(d.Id + ".info.userName", d.UserName, true);
            adapter.setState(d.Id + ".info.deviceName", d.DeviceName, true);

            if (d.Capabilities.DeviceProfile == undefined) continue;

            if (typeof d.NowPlayingItem !== 'undefined') {
                var endDate = new Date(Date.now() + ((d.NowPlayingItem.RunTimeTicks - d.PlayState.PositionTicks) / 10000));
                var endString = endDate.getHours() + ":" + (endDate.getMinutes() < 10 ? "0" + endDate.getMinutes() : endDate.getMinutes());

                var npi = d.NowPlayingItem;
                adapter.setState(d.Id + ".media.endtime", endString, true);
                adapter.setState(d.Id + ".media.title", npi.Name, true);
                adapter.setState(d.Id + ".media.description", npi.Overview, true);
                adapter.setState(d.Id + ".media.type", npi.Type, true);

                var prefix = adapter.settings.isSSL ? "https://" : "http://";
                var baseuri = prefix + adapter.settings.address + "/Items/";

                switch (npi.Type) {
                    case "Episode":
                        adapter.setState(d.Id + ".posters.main", baseuri + npi.SeriesId + "/Images/Primary", true);
                        adapter.setState(d.Id + ".posters.season", baseuri + npi.SeasonId + "/Images/Primary", true);
                        adapter.setState(d.Id + ".posters.episode", baseuri + npi.Id + "/Images/Primary", true);
                        break;

                    case "Movie":
                        adapter.setState(d.Id + ".posters.main", baseuri + npi.Id + "/Images/Primary", true);
                        adapter.setState(d.Id + ".posters.season", "", true);
                        adapter.setState(d.Id + ".posters.episode", "", true);
                        break;

                    default:
                        adapter.setState(d.Id + ".posters.main", "", true);
                        adapter.setState(d.Id + ".posters.season", "", true);
                        adapter.setState(d.Id + ".posters.episode", "", true);
                        break;
                }

                if (typeof npi.SeasonName !== 'undefined') {
                    adapter.setState(d.Id + ".media.seasonName", npi.SeasonName, true);
                    adapter.setState(d.Id + ".media.seriesName", npi.SeriesName, true);
                } else {
                    adapter.setState(d.Id + ".media.seasonName", "", true);
                    adapter.setState(d.Id + ".media.seriesName", "", true);
                }

                if (typeof d.PlayState.MediaSourceId !== 'undefined') {
                    if (d.PlayState.IsPaused)
                        changeState(d.Id, "paused");
                    else
                        changeState(d.Id, "playing");
                } else {
                    changeState(d.Id, "paused");
                }
                adapter.setState(d.Id + ".media.isMuted", d.PlayState.IsMuted, true);
            } else {
                adapter.setState(d.Id + ".media.title", "", true);
                adapter.setState(d.Id + ".media.description", "", true);
                adapter.setState(d.Id + ".media.seasonName", "", true);
                adapter.setState(d.Id + ".media.seriesName", "", true);
                adapter.setState(d.Id + ".media.type", "none", true);
                adapter.setState(d.Id + ".media.endtime", "", true);
                adapter.setState(d.Id + ".posters.main", "", true);
                adapter.setState(d.Id + ".posters.season", "", true);
                adapter.setState(d.Id + ".posters.episode", "", true);
                changeState(d.Id, "idle");
            }
        } else {
            //console.log("skipped");
        }
    }
    firstcreate = true;
}

var laststates = {};
var timeoutstarted = {};
var timeoutplays = {};
var timeoutstates = {};

function changeState(id, state) {
    if (laststates[id] == state)
        return;

    if (state == "playing") {
        clearTimeout(timeoutplays[id]);
        timeoutstarted[id] = false;
        adapter.setState(id + ".media.state", state, true);
    } else {
        timeoutstates[id] = state;
        if (!timeoutstarted[id]) {
            timeoutstarted[id] = true;
            timeoutplays[id] = setTimeout(function () {
                adapter.setState(id + ".media.state", timeoutstates[id], true);
                timeoutstarted[id] = false;
            }, adapter.settings.timeout);
        }
    }

    laststates[id] = state;
}

function createDevice(item) {
    if (adapter.deviceExists(item.Id))
        return;

    adapter.createDevice(item.Id, item.DeviceName);
    adapter.createChannel(item.Id + ".info");
    adapter.createChannel(item.Id + ".posters");


    if (item.Capabilities.PlayableMediaTypes.length > 0) {
        adapter.createChannel(item.Id + ".media");
        adapter.addState(item.Id + ".media.state", "State des Klientens", "string", "media.state", 1, "idle", { "idle": "Leerlauf", "paused": "Pause", "playing": "Play" });
        adapter.addState(item.Id + ".media.isMuted", "Ist Stumm geschaltet", "boolean", "media.mute", 1, false);
        adapter.addState(item.Id + ".media.title", "Titel", "string", "media.title", 1, "");
        adapter.addState(item.Id + ".media.seriesName", "Name der Serie", "string", "media.title", 1, "");
        adapter.addState(item.Id + ".media.seasonName", "Name der Staffel", "string", "media.season", 1, "");
        adapter.addState(item.Id + ".media.type", "Typ", "string", "media.type", 1, "none");
        adapter.addState(item.Id + ".media.description", "Beschreibung", "string", "media.desc", 1, "");
        adapter.addState(item.Id + ".media.endtime", "Endzeit", "string", "media.endtime", 1, "");

        adapter.addState(item.Id + ".posters.main", "Poster", "string", "media.poster", 1, "");
        adapter.addState(item.Id + ".posters.season", "Poster Staffel", "string", "media.poster", 1, "");
        adapter.addState(item.Id + ".posters.episode", "Poster Episode", "string", "media.poster", 1, "");
    }

    adapter.addState(item.Id + ".info.deviceName", "Gerätename", "string", "device.name", 1, "");
    adapter.addState(item.Id + ".info.userName", "Angemeldeter Benutzer", "string", "user", 1, "");
    adapter.addState(item.Id + ".info.supportedCommands", "Unterstütze Befehle", "string", "", 1, "");

    if (!item.SupportsRemoteControl)
        return;


    adapter.createChannel(item.Id + ".command");

    adapter.addState(item.Id + ".command.pause", "Pause", "button", "button", 2, "");
    adapter.addState(item.Id + ".command.play", "Play", "button", "button", 2, "");
    adapter.addState(item.Id + ".command.togglePlay", "Play umschalten", "button", "button", 2, "");

    adapter.setState(item.Id + ".info.supportedCommands", item.SupportedCommands.join(","), true);

    for (var i = 0; i < item.SupportedCommands.length; i++) {
        switch (item.SupportedCommands[i]) {
            case "DisplayMessage":
                adapter.addState(item.Id + ".command.message", "Nachricht", "string", "message", 2, "");
                adapter.addState(item.Id + ".command.dialog", "Nachricht als Dialog", "string", "message", 2, "");
                break;

            case "GoHome":
                adapter.addState(item.Id + ".command.goHome", "Zur Startseite", "button", "button", 2, "");
                break;

            case "SetVolume":
                adapter.addState(item.Id + ".command.volume", "Lautstärke", "number", "media.volume", 2, "");
                break;

            case "GoToSearch":
                adapter.addState(item.Id + ".command.goToSearch", "Zur Suche", "button", "button", 2, "");
                break;

            case "Back":
                adapter.addState(item.Id + ".command.goBack", "Zurück", "button", "button", 2, "");
                break;

            case "Mute":
                adapter.addState(item.Id + ".command.mute", "Stummschalten", "button", "button", 2, "");
                break;

            case "UnMute":
                adapter.addState(item.Id + ".command.unmute", "Stumm deaktiveren", "button", "button", 2, "");
                break;

            case "ToggleMute":
                adapter.addState(item.Id + ".command.toggleMute", "Stumm umschalten", "button", "button", 2, "");
                break;
        }
    }
}


module.exports = startAdapter;