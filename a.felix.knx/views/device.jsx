const React = require("react");
var dmanage = require('./../../../manager/devicemanage');
const dpts = require("../static/js/dpts");

class Device extends React.Component {
    constructor(props) {
        super(props);

        this.dmanager = new dmanage(props.instance.key, true);
        this.device = this.dmanager.getDeviceById(props.req.params.id);

        if(props.method == "post") {
            var dp_sub = props.req.body.dp_sub;
            if(dp_sub != "0") {
                for(var i = dp_sub.length; i < 3; i++) dp_sub = "0" + dp_sub;
                dp_sub = "." + dp_sub;
            } else {
                dp_sub = "";
            }

            var dpt = "DPT" + props.req.body.dp_main + dp_sub;
            var state = {
                id: this.device.id + "." + props.req.body.id,
                name: props.req.body.name, 
                role: props.req.body.role,
                read: true,
                write: true,
                value: false,
                adapter: props.instance.key,
                ack: true,
                group: props.req.body.group,
                status: props.req.body.status,
                dpt
            }

            if(dpts.sub[props.req.body.dp_main][props.req.body.dp_sub].type != undefined){
                state.type = dpts.sub[props.req.body.dp_main][props.req.body.dp_sub];
            } else {
                state.type = dpts.sub[props.req.body.dp_main].default.type;
            }
//TODO send to main to use it instantly
            this.dmanager.addState(state);
        }
    }

    render() {
        var functions = this.dmanager.getStatesByDevice(this.device.id);
        
        return <div>
                <h3>Gerät {this.device.name}</h3>
                <button data-target="modal_add" data-type="device" className="btn modal-trigger"><i className="material-icons left">add</i> Funktion</button>
                <ul className="collection">
                    {functions.map((item, index) =>
                        <FuncItem key={index} item={item} />
                    )}
                </ul>


                <div id="modal_add" className="modal" style={{maxHeight: "85%"}}>
                    <form className='need-validation' id='formadd' method='post'>
                        <input type="hidden" name="type" />
                        <div className="modal-content">
                            <h4>Funktion hinzufügen</h4>
                            <div className="row">
                                <div className="col s2"><label htmlFor='dp_main'>Funktion:</label></div>
                                <div className="col s10">
                                    <select id="dp_main" name="dp_main"></select>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s2"><label htmlFor='dp_sub'>Funktion:</label></div>
                                <div className="col s10">
                                    <select id="dp_sub" name="dp_sub"></select>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col s2"><label htmlFor='id'>Id:</label></div>
                                <div className="col s10"><input id="id" name='id' type='text' autoComplete='off' required /></div>
                            </div>
                            <div className="row">
                                <div className="col s2"><label htmlFor='role'>Funktion:</label></div>
                                <div className="col s10"><input id="role" name='role' type='text' autoComplete='off' placeholder="onoff / light.brightness" required /></div>
                            </div>
                            <div className="row">
                                <div className="col s2"><label htmlFor='name'>Name:</label></div>
                                <div className="col s10"><input id="name" name='name' type='text' autoComplete='off' /></div>
                            </div>
                            <div className="row">
                                <div className="col s2"><label htmlFor='group'>Gruppenadresse:</label></div>
                                <div className="col s10"><input id="group" name='group' type='text' autoComplete='off' placeholder="1/0/2" required /></div>
                            </div>
                            <div className="row">
                                <div className="col s2"><label htmlFor='state'>Statusadresse:</label></div>
                                <div className="col s10"><input id="status" name='status' type='text' autoComplete='off' placeholder="1/0/3" />
                                <div><span className="help-text">Leer lassen, wenn keine Statusadresse vorhanden.</span></div></div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <a className="modal-close btn-flat waves-effect waves-red">Abbrechen</a>
                            <input type="submit" className="btn-flat waves-effect waves-green" value="Hinzufügen" />
                        </div>
                    </form>
                </div>
            </div>
    }
}

class FuncItem extends React.Component {
    render() {
        return <li className="collection-item">{this.props.item.name != "" ? this.props.item.name:this.props.item.id.substr(this.props.item.id.lastIndexOf(".")+1)}</li>
    }
}

module.exports = Device;