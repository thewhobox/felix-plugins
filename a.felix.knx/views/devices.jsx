const React = require("react");
var dmanage = require('./../../../manager/devicemanage');

class Devices extends React.Component {
	constructor(props) {
		super(props);
		this.devices = new dmanage(props.instance.key, true);

		if(props.method == "post") {

			let parent = props.req.body.path.substr(0, props.req.body.path.lastIndexOf("."));
			let key = props.req.body.path;


			if(props.req.body.type == "device") {
				this.devices.addDevice({ id: key, name: props.req.body.name, channel: parent });
			} else {
				this.devices.createChannel({ id: key, name: props.req.body.name, parent });
			}
		}
	}


	render() {

		this.devices = this.devices.getAllDevices();

		return <div>
			<button data-target="modal_add" data-type="device" className="btn modal-trigger"><i className="material-icons left">add</i> Gerät</button>
			<button data-target="modal_add" data-type="room" className="btn modal-trigger"><i className="material-icons left">add</i> Raum</button>
			<ul className="collection">
				{this.devices.map((device, index) =>
					<DeviceItem key={index} item={device} instance={this.props.instance.key} />
				)}
			</ul>
			<div id="modal_add" className="modal">
				<form className='need-validation' id='formadd' method='post'>
					<input type="hidden" name="type" />
					<div className="modal-content">
						<h4 data-type="device">Gerät hinzufügen</h4>
						<h4 data-type="room">Raum hinzufügen</h4>
						<small data-type="room">Nur unter Datenpunkte sichtbar</small>
						<div className="row">
							<div className="col s2"><label htmlFor='name'>Name:</label></div>
							<div className="col s10"><input id="name" name='name' type='text' autoComplete='off' required /></div>
						</div>
						<div className="row">
							<div className="col s2"><label htmlFor='path'>Pfad:</label></div>
							<div className="col s10"><input id="path" name='path' type='text' autoComplete='off' required /></div>
						</div>
					</div>
					<div className="modal-footer">
                        <a className="modal-close btn-flat waves-effect waves-red">Abbrechen</a>
                        <input type="submit" className="btn-flat waves-effect waves-green" value="Hinzufügen" />
					</div>
				</form>
			</div>
		</div>;
	}
}

class DeviceItem extends React.Component {

	render() {
		let running = this.props.item.isRunning ? <span className="secondary-content">Läuft</span> : "";
		let url = "/adapters/" + this.props.instance + "/device/" + this.props.item.id
		return <a href={url} className="collection-item">
			<span className="title">{this.props.item.name}</span>
			{running}
		</a>
	}
}

module.exports = Devices;