const { NodeVM } = require("vm2");
const io = require("socket.io-client");
const conn = io("http://localhost:3000");

const fs = require("fs");
var dmanager;
var subscribed = false;
var changelisteners = [];

fs.realpath("", (a,b) => {
    dmanager = require(b + "/manager/devicemanage");
    dmanager = new dmanager("javascript");
});

conn.on("stateChanged", (state) => {
    changelisteners.forEach((item) => {
        let condition;
        if(item.condition.indexOf("+ack") !== -1) {
            if(!state.ack) return;
            condition = item.condition.substr(0, item.condition.indexOf("+ack"))
        } else {
            condition = item.condition;
        }

        switch(condition) {
            case "ack":
                if(!state.ack)
                    return;
                break;

            case "ne":
                if(state.value == state.oldValue)
                    return;
                break;

            case "true":
                if(state.value !== true)
                    return;
                break;

            case "false":
                if(state.value !== false)
                    return;
                break;

            case "any":
            default:
                break;
        }

        if(item.listeners instanceof RegExp) {
            if(item.listeners.test(state.key))
                item.callback(state);
        } else {
            var flagFound = false;
            item.listeners.forEach((item) => {
                if(item == state.key)
                    flagFound = true;
            });
            if(flagFound)
                item.callback(state);
        }
    });
});


var sandbox = {
    console: {
        log: function(...args) {
            process.send({ type: "log", data: args.join("")});
        }
    },
    setState: function(id, value, ack) {
        var instance = id.substr(id.indexOf(".")+1);
        instance = instance.substr(0, instance.indexOf("."));
        var adapter = id.substr(0, id.indexOf(".")+1) + instance;
        var state = id.substr(adapter.length+1);
        
        conn.emit("message", { to: adapter, cmd: "setForeignState", value: { id: state, value: value, ack: ack }});
        //conn.emit("setState", {key: id, value: value, ack: ack});
    },
    createState: function(key, name, type, role, readwrite, initValue = "", states = null) {
        var state = {
            id: key, name: name, type: type,  role: role, read: false, write: false, value: initValue, parent: "", ack: true
        }

        if(states !== null) {
            state.states = states;
        }

        switch(readwrite) {
            case 1:
                state.read = true;
                break;
            case 2:
                state.write = true;
                break;
            case 3:
                state.read = true;
                state.write = true;
                break;
        }

        dmanager.addState(state);
    },
    getState: function(id, cb = null) {
        var instance = id.substr(id.indexOf(".")+1);
        instance = instance.substr(0, instance.indexOf("."));
        var adapter = id.substr(0, id.indexOf(".")+1) + instance;
        var state = id.substr(adapter.length+1);
        
        if(cb === null) {
            return new Promise((resolve, reject) => {
                conn.emit("message", { to : adapter, cmd: "getForeignState", value: state }, (stateret) => {
                    resolve(stateret);
                });
            });
        } else {
            conn.emit("message", { to : adapter, cmd: "getForeignState", value: state }, (stateret) => {
                cb(stateret);
            });
        }
    },
    on: function (listener, cond, callback) {
        if(!subscribed) {
            subscribed = true;
            conn.emit("subscribe", ".*");
        }

        if(typeof(listener) === "string") {
            listener = [listener];
        }

        changelisteners.push({ listeners: listener, condition: cond, callback: callback });
    }
}



const vm = new NodeVM({
    sandbox: sandbox,
    require: {
        external: true,
        root: "./"
    }
});

process.on("message", (data) => {
    var cmd = data.cmd
    var script = data.script

    switch(cmd) {
        case "script":
            process.send({ type: "log", data: "Started!"});
            vm.run(script.script, "scriptRunning.js");
            break;
    }
})