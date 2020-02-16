const React = require('react');
var dmanage = require('./../../../manager/devicemanage');

class Index extends React.Component {

	constructor(props) {
		super(props);
		this.manager = require('./../../../manager/manage');
		this.instance = this.props.instance;
		this.devices = new dmanage(this.instance.key, true);
		this.statusCode = 200;
	}

	render() {
		if (this.props.method == "post") {
			return this.statusCode;
		}

		var groups = [];

		groups.push({ id: "devicesL", title: "Leuchten" });
		groups.push({ id: "devicesG", title: "Gruppen" });
		groups.push({ id: "devicesS", title: "Sensoren" });

		return <div>
			<a id="searchNow" className="btn-flat">Suchen</a>
			<a id="save" className="btn-flat green-text">Speichern</a>

			{groups.map((val, index) =>
				<GroupItem item={val} key={index} />
			)}
		</div>
	}
}

class GroupItem extends React.Component {

	render() {
		return (<div>
			<h3>
				{this.props.item.title}
				<a style={{marginLeft: "10px"}} className="btn-floating red" data-group={this.props.item.id}><i className="material-icons">search</i></a>
			</h3>
			
			<table id={this.props.item.id} className="table striped">
				<thead>
					<tr>
						<th>Name</th>
						<th style={{ width: "20%" }}>Aktionen</th>
						<th style={{ width: "20%" }}>Unterstützt</th>
					</tr>
				</thead>
				<tbody>
					<tr><td></td><td>Bitte führe erst eine Suche durch.</td><td></td><td></td></tr>
				</tbody>
			</table>

			<div id="modal_info" className="modal modal-fixed-footer">
				<div className="modal-content">
					<h4>Info zu: <span></span></h4>
					<p style={{whiteSpace: "pre"}}></p>
				</div>
				<div className="modal-footer">
					<a href="#!" className="modal-close waves-effect waves-green btn-flat">Schließen</a>
				</div>
			</div>
		</div>
		)
	}
}

module.exports = Index;