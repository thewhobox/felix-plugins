var React = require('react');
var dmanage = require('../../../../manager/devicemanage');

class Index extends React.Component {

  constructor(props) {
    super(props);
    this.manager = require('../../../../manager/manage');
    this.devices = new dmanage("deconz", true);
    this.adapter = this.manager.getByKey("adapters", "deconz");
    this.statusCode = 200;

    if(props.method == "post") {
      this.props.req.body.forEach(item => {
        var channelName = item.id.substr(0, item.id.lastIndexOf("."));

        var device = {
          channel: channelName,
          id: item.id,
          name: item.name
        }
        this.devices.addDevice(device);
        device.supports = item.supports;

        this.devices.addState({
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

        this.devices.addState({
          "id": item.id + ".command",
          name: "Send a command as json",
          type: "string",
          value: "",
          role: "text.json",
          read: false,
          write: true
        });

        if(device.supports.indexOf("switch") !== -1){
          this.devices.addState({
            "id": item.id + ".on",
            name: "On / Off",
            type: "boolean",
            value: false,
            role: "light.on",
            read: true,
            write: true
          });
        }

        if(device.supports.indexOf("dim") !== -1){
          this.devices.addState({
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

        if(device.supports.indexOf("temp") !== -1){
          this.devices.addState({
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

        if(device.supports.indexOf("color") !== -1){
          this.devices.addState({
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
          this.devices.addState({
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
      });
    }
  }

  render() {
    if(this.props.method == "post") {
      return this.statusCode;
    }

    var groups = [];

    if(this.adapter.settings.checklight)
      groups.push({id: "devicesL", title: "Leuchten"});
    if(this.adapter.settings.checkgroup)
      groups.push({id: "devicesG", title: "Gruppen"});
    if(this.adapter.settings.checksensor)
      groups.push({id: "devicesS", title: "Sensoren"});

    return <div>
      <a id="searchNow" className="button">Suchen</a>
      <a id="save" className="button success">Speichern</a>

      {groups.map((val, index) => 
          <GroupItem item={val} key={index} />
      )}
    </div>
  }
}

class GroupItem extends React.Component {

  render() {
    return (<div>
      <h3>{this.props.item.title}</h3>
        <table id={this.props.item.id} className="table striped">
          <thead>
            <tr>
              <th style={{width: "30px"}}></th>
              <th>Name</th>
              <th style={{width: "20%"}}>Aktionen</th>
              <th style={{width: "20%"}}>Unterstützt</th>
            </tr>
          </thead>
          <tbody>
            <tr><td></td><td>Bitte führe erst eine Suche durch.</td><td></td><td></td></tr>
          </tbody>
        </table></div>
    )
  }
}

module.exports = Index;