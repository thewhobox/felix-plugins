const React = require('react');

class Index extends React.Component {

	constructor(props) {
		super(props);
		this.manager = require('./../../../manager/manage');
		this.instance = this.props.instance;

	}

	render() {
		return <div style={{width: "600px"}}>
			<a id="searchNow" className="btn-flat">Suchen</a>
			<a id="save" className="btn-flat green-text disabled">Speichern</a>

			<div className="row">
				<div className="col s2"><label>Name:</label></div>
				<div className="col s10">
					<input id="name" type="text" />
					<div><small data-type="key" className="text-muted"></small></div>
				</div>
			</div>
			<div className="row">
				<div className="col s2"><label>Status:</label></div>
				<div className="col s10"><p data-type="status">Beendet</p></div>
			</div>
			<div className="row">
				<div className="col s2"><label>Zeit:</label></div>
				<div className="col s10"><p data-type="countdown">0 s</p></div>
			</div>
			<div className="row">
				<div className="col s2"><label>Data:</label></div>
				<div className="col s10"><p data-type="data"></p></div>
			</div>
		</div>
	}
}

module.exports = Index;