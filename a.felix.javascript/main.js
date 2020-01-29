const { fork } = require("child_process");
const fs = require("fs");

var adapter;
var scriptsList = {};

function startAdapter(base) {
    adapter = base;
    base.subscribe("*");
    base.onStateChanged(changed);
    base.onMessage(message);

    setTimeout(loadAutostartScripts, 2000);

    var scripts = adapter.database.getValues({});
    scripts.forEach((item) => {
        item.isRunning = false;
        adapter.database.setValue(item.id, item);
    });

    return base;
}

function loadAutostartScripts() {
    var scripts = adapter.database.getValues({ autostart: true });
    scripts.forEach((item) => runScript(item.id, null));
}

function message(cmd, data, callback) {
    switch(cmd) {
        case "getGlobaleDefinition":
            var globale = fs.readFileSync(adapter.basedir + "/globale.d.ts").toString();
            callback(globale);
            break;
        case "createScript":
			var id = getFreeId();
			var script = { script: "\n", name: data.name, id: "script." + id, type: data.type};
            adapter.database.setValue(script.id, script);
            callback(script.id);
            break;
        case "saveScript":
            data.id = data.id.substr(data.id.indexOf(".")+1);
            adapter.database.setValue("script." + data.id, {script: data.script});
            callback(true);
            break;
        case "deleteScript":
            adapter.database.deleteValue(data.id);
            callback(true);
            break;
        case "getScript":
            var script = adapter.database.getValue("script." + data);
            callback(script);
            break;
        case "runScript":
            runScript(data, callback);
            break;
        case "stopScript":
            stopScript(data, callback);
            break;
        // default:
        //     adapter.log.error("Command '" + cmd + "' wird nicht unterstützt");
        //     adapter.log.error("Data: ", data);
        //     break;
    }
}

async function changed(data) {
    if(data.ack)
        return;

    var id = data.id.substr(data.id.indexOf(".")+1);
    id = id.substr(0, id.lastIndexOf("."));
    if(id.indexOf('0') == 0)
        id = id.substr(1);
    var type = data.id.substr(0, data.id.indexOf("."));
}

function runScript(id, cb) {
    let script = adapter.database.getValue(id);
    if(script.isRunning){
        adapter.sendMessage(adapter.instance + ".fontend", "runningChanged", { id: id, value: true });
        adapter.database.setValue(id, { isRunning: true, autostart: true })
        return;
    }

    adapter.database.setValue(id, { isRunning: true, autostart: true })
    adapter.sendMessage(adapter.instance + ".fontend", "runningChanged", { id: id, value: true });


    var worker = fork(__dirname + "/scriptRunner.js", { silent: true });

    worker.errors = "";
    
    setTimeout(() => {
        worker.send({ cmd: "script", script: script });
    }, 1000);


    worker.stdout.on("data", (data) => {
        adapter.log.info("ALT: Script " + script.name + ": " + data.toString());
    });
    
    worker.stderr.on("data", (data) => {
        var data = data.toString();
        if(data.indexOf("Debugger listening") !== -1) return;
        if(data.indexOf("https://nodejs.org") !== -1) return;
        if(data.indexOf("inspector") !== -1) return;

        worker.errors = worker.errors + data;
    })
    

    worker.on("message", (data) => {
        switch(data.type) {
            case "log":
                adapter.log.info("Script " + script.name + ": " + data.data);
                break;
        }
    })

    
    worker.on("exit", (code) => {
        if(code == null) {
            adapter.log.info("Skript " + script.name + " wurde beendet.");
        } else {
            adapter.log.info("Skript " + script.name + " wurde mit Code " + code + " beendet.");
        }

        if(worker.errors !== "")
            adapter.log.error(worker.errors);

        adapter.sendMessage(adapter.instance + ".fontend", "runningChanged", { id: id, value: false, code: code });
        adapter.database.setValue(id, { isRunning: false })

        delete scriptsList[script.id];
    })

    scriptsList[script.id] = worker;
}

function stopScript(id, cb) {
    var script = adapter.database.getValue(id);
    if(!script.isRunning){
        adapter.sendMessage(adapter.instance + ".fontend", "runningChanged", { id: id, value: false });
        adapter.database.setValue(id, { isRunning: false, autostart: false })
        return;
    }

    if(scriptsList[script.id])
        scriptsList[script.id].kill()
    else {
        adapter.sendMessage(adapter.instance + ".fontend", "runningChanged", { id: id, value: false });
        adapter.database.setValue(id, { isRunning: false, autostart: false })
    }
}

function getFreeId() {
    var x = 0;
    while(true) {
        if(adapter.database.idExists("script." + x) == false)
            return x;
        x++;
        if(x > 100)
            return -1;
    }
}


module.exports = startAdapter;