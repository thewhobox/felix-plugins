function Init(item, dmanager) {
    var channelName = item.id.substr(0, item.id.lastIndexOf("."));

    var device = {
      channel: channelName,
      id: item.id,
      name: item.name
    }
    dmanager.addDevice(device);

    if(item.type == "Sensor")
        addSensor(item, dmanager);
    else
        addLightGroup(item, dmanager);
}

function addSensor(item, dmanager) {
    var ignore = ["group", "on", "reachable", "configured"];
    var writebale = ["duration", "tholddark", "tholdoffset"];
    var confcount = 0;

    for(var config in item.config) {
        if(ignore.indexOf(config) == -1)
            confcount++;
    }

    if(confcount > 0) {
        dmanager.createChannel({
            "id": item.id + ".config",
            "name": "",
            "parent": item.id
        });

        for(var config in item.config) {
            if(ignore.indexOf(config) != -1)
                continue;
            
            dmanager.addState({
                "id": item.id + ".config." + config,
                type: typeof item.config[config],
                value: item.config[config],
                role: "any",
                read: true,
                write: writebale.indexOf(config) != -1,
                ack: true
            });
        }
    }

    for(var statename in item.state) {
        if(statename == "lastupdated") continue;

        dmanager.addState({
            "id": item.id + "." + statename,
            type: typeof item.state[statename],
            value: item.state[statename],
            role: "any",
            read: true,
            write: false,
            ack: true
        });
    }

    
}


function addLightGroup(item, dmanager) {
    dmanager.addState({
      "id": item.id + ".transition",
      name: "Transition time",
      type: "number",
      value: 1,
      role: "time.s",
      read: false,
      write: true,
      multiplier: 10,
      ack: true
    });

    dmanager.addState({
      "id": item.id + ".command",
      name: "Send a command as json",
      type: "object",
      value: {},
      role: "text.json",
      read: false,
      write: true
    });

    if(item.supports.indexOf("switch") !== -1){
      dmanager.addState({
        "id": item.id + ".on",
        name: "On / Off",
        type: "boolean",
        value: false,
        role: "onoff",
        read: true,
        write: true
      });
    }

    if(item.supports.indexOf("dim") !== -1){
      dmanager.addState({
        "id": item.id + ".bri",
        name: "Brightness",
        type: "number",
        value: 0,
        role: "number.percent",
        read: true,
        write: true,
        min: 0,
        max: 100,
        multiplier: 2.55
      });
    }

    if(item.supports.indexOf("temp") !== -1){
      dmanager.addState({
        "id": item.id + ".ct",
        name: "Light temperature",
        type: "number",
        value: 0,
        role: "light.temp",
        read: true,
        write: true,
        min: 2000,
        max: 6500,
        linearM: 0.077111,
        linearN: -1.22
      });
    }

    if(item.supports.indexOf("color") !== -1){
      dmanager.addState({
        "id": item.id + ".hue",
        name: "Light Color",
        type: "number",
        value: 0,
        role: "light.hue",
        read: true,
        write: true,
        min: 0,
        max: 360,
        divider: 0.00549325
      });
      dmanager.addState({
        "id": item.id + ".sat",
        name: "Light Saturation",
        type: "number",
        value: 0,
        role: "light.sat",
        read: true,
        write: true,
        min: 0,
        max: 100,
        multiplier: 2.55
      });
    }
}



module.exports = Init;