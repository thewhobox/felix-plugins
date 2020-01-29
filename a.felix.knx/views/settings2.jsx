const React = require("react");
var dmanage = require('./../../../manager/devicemanage');

class Device extends React.Component {
    constructor(props) {
        super(props);
        this.devices = new dmanage(props.instance.key, true);

        this.settings = this.devices.getValue("more.settings")

        if (props.method == "post") {
            this.settings = { 
                dateStringInterval: props.req.body.dateStringInterval, 
                dateStringGA: props.req.body.dateStringGA };
            this.devices.setValue("more.settings", this.settings);
        }

        if(this.settings == undefined) {
            this.settings = { dateStringInterval: 10, dateStringGA: "2/0/3" };
            this.devices.setValue("more.settings", this.settings);
        }
    }

    render() {
        return <div>
            <h3>Erweiterte Funktionen</h3>

            <form id="settings" method="POST" style={{ width: '600px' }}>
                <div className="row">
                    <div className="col s4">
                        <label htmlFor="dateStringInterval">Datum als String<br />Intervall</label>
                    </div>
                    <div className="col s8">
                        <input id="dateStringInterval" name="dateStringInterval" type="number" defaultValue={this.settings.dateStringInterval} placeholder="0" />
                        <div className="helper-text">Angabe in Sekunden</div>
                    </div>
                </div>

                <div className="row">
                    <div className="col s4">
                        <label htmlFor="dateStringGA">Datum als String<br />Gruppenadresse</label>
                    </div>
                    <div className="col s8">
                        <input id="dateStringGA" name="dateStringGA" type="text" defaultValue={this.settings.dateStringGA} placeholder="1/0/9" />
                        <div className="helper-text">Gruppenadresse für das Datum als String</div>
                    </div>
                </div>

                <div>
                    <button type="submit" className="btn success">Speichern</button>
                </div>
            </form>
        </div>
    }
}

module.exports = Device;