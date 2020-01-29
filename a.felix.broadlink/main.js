const broadlink = require("./lib/broadlink"); // https://gitlab.com/zyrorl/broadlink/
const base64 = require("base64-js");


let adapter;
let currentDevice;


function startAdapter(base) {
    adapter = base;
    base.subscribe("*");
    base.onMessage(message);
    base.onStop(stop);
    base.onStateChanged(changed);

    adapter.addState("connection", "Verbindung", "boolean", "connection", 1, false);

    if (adapter.settings.ip == "") {
        adapter.log.error("Es wurde keine IP angegeben. Adapter wird beendet.");
        setTimeout(() => adapter.exit(), 2000);
        return base;
    }

    broadlink.on("deviceReady", (device) => {
        if (adapter.settings.ip == device.host.address) {
            currentDevice = device;
            currentDevice.on('state', checkState);
            createInitStates(device);
        }
    })
    broadlink.discover(adapter.log);

    return base;
}

function message(cmd, data, callback) {
    switch (cmd) {
        case "saveCode":
            adapter.log.debug("Saving: " + JSON.stringify(data));
            var key = data.name.toLowerCase();
            key = key.replace(/ /, "_");
            key = key.replace(/\./, "-");
            adapter.addState("codes." + key, data.name, "button", "button", 2, null, null, { code: data.data });
            callback(true);
            break;

        case "learnCode":
            learnCode(callback);
            break;

        case "browse":
            broadlink.on("deviceReady", (device) => {
                adapter.log.debug("found device " + JSON.stringify(device))

                if (adapter.settings.ip == device.host.address) {
                    callback(device);
                    currentDevice = device;
                    currentDevice.on('state', checkState);
                    createInitStates(device);
                }
            })
            broadlink.discover();
            adapter.log.debug("now browsing")
            break;
    }
}

function checkState(state) {
    if(state == undefined) return;

    if(state.status.temperatur != undefined) {
        adapter.log.debug("temp " + JSON.stringify(state));
        adapter.setState("temperatur", parseInt(state.status.temperatur), true);
    } else {
        adapter.log.debug("state " + JSON.stringify(state));
    }
}



function learnCode(cb) {
    if(currentDevice == undefined) {
        adapter.log.error("Nicht mit Gerät verbunden!");
        cb(-1);
        return;
    }

    currentDevice.checkTemperature();

    adapter.log.debug("Starting learn Code");
    var timer = setInterval(function () {
		//adapter.log.debug("IR-Learning-Mode - check data...");
		currentDevice.checkData();
    }, 1000); //change back to 1000

    var leaveLearningMode = (function () {
		if (leaveTimer) {
			leaveTimer = null;
		}

		clearInterval(timer);
    });
    
    currentDevice.once("data", (data) => {

        var hex = base64.fromByteArray(data);
        leaveLearningMode();
        adapter.log.debug("Code found");
        cb(hex);
    });
    currentDevice.enterLearning();
	leaveTimer = setTimeout(leaveLearningMode, 30000); // change back to 30000
}


function stop() {
    if (currentDevice)
        currentDevice.closeConnection();
    adapter = null;
    currentDevice = null;
}

async function changed(data) {
    if (data.ack)
        return;

    if(data.parent == "codes") {
        currentDevice.sendData(base64.toByteArray(data.code));
    }
}

function createInitStates(device) {
    adapter.setState("connection", true, true);

    switch (device.type) {
        case "A1":
            adapter.addState("sensor", "Sensor", "string", "string", 1);
        case "RM2":
            adapter.addState("temperature", "Temperatur", "number", "temperatur", 1, 0);
            adapter.createChannel("codes", "Codes");
            break;

        case "MP1":
            adapter.addState("power1", "Power", "boolean", "switch", 3, false);
            adapter.addState("power2", "Power", "boolean", "switch", 3, false);
            adapter.addState("power3", "Power", "boolean", "switch", 3, false);
            adapter.addState("power4", "Power", "boolean", "switch", 3, false);
            break;

        case "SP1":
            adapter.addState("power", "Power", "boolean", "switch", 1, false);
            break;
    
        case "SP2":
            adapter.addState("power", "Power", "boolean", "switch", 3, false);
            break;
    }
}


module.exports = startAdapter;