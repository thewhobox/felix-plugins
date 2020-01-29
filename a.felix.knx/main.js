let knx = require('knx');
let connection;
let dpts = {};

let intervalDateString;

//https://bitbucket.org/ekarak/knx.js

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
    if(connection != null) {
        connection.Disconnect();
    }
    clearInterval(intervalDateString);
}

function changed(data) {
    if (data.ack)
    return;

    dpts[data.id].write(data.value);

    adapter.setState(data.id, data.value, true);
}

function tryConnect() {
    adapter.setState("connection", false, true);
    let connectedsuccess = false;

    connection = knx.Connection({
        ipAddr: adapter.settings.ip
    });

    connection.on("connected", () => {
        adapter.log.debug("Connected");
        connectedsuccess = true;
        adapter.setState("connection", true, true);
        loadDPTs();
        startSettings2();
    });
    // connection.on("disconnected", () => {
    //     adapter.log.error("disconnected....");
    // });

    connection.on("GroupValue_Write", knx_event);

    setTimeout(() => {
        if(!connectedsuccess) {
            adapter.log.debug("No connection after timeout. Retry");
            //tryConnect();
        }
    }, 15000);
}

function knx_event(source, dest, value) {
    adapter.log.debug(new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') + " **** KNX: " +
            "src: " + source + ", dest: " + dest + ", value: " + value);
}

function startSettings2() {
    let settings = adapter.getValue("more.settings");

    if(settings.dateStringIntervall > 0) {
        intervalDateString = setInterval(() => {
            let date = new Date(Date.now()).toLocaleDateString("de-DE", { year: 'numeric', month: 'long', day: 'numeric' });
            connection.write(settings.dateStringGA, date, "DPT16.001");
        }, settings.dateStringIntervall * 1000);
    }
}

function loadDPTs() {
    var states = adapter.getAllStates();
    adapter.log.info(JSON.stringify(states))

    states.forEach((state) => {
        if(state.id == "connection") return;

        let dpt = new knx.Datapoint({ga: state.group, dpt: state.dpt}, connection);
        dpt.on("change", (oldVal, newVal) => {
            adapter.setState(state.id, newVal, true);
        });
        dpt.read((source, value) => {
            adapter.log.debug("Init value " + state.group + ": " + value);
            adapter.setState(state.id, value, true);
        });
        dpts[state.id] = dpt;
    })
}

module.exports = startAdapter;