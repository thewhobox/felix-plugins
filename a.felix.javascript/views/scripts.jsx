var React = require('react');
var dmanage = require('../../../manager/devicemanage');

class Index extends React.Component {

	constructor(props) {
		super(props);
		this.dmanager = new dmanage(this.props.instance.key, true);
		this.scripts = this.dmanager.getValuesWildcard("script\..*")
	}

	render() {
		return <div>
			<h4>Skripte</h4>
			<button data-target="dialog-add" className="btn modal-trigger">Hinzufügen</button>
			<ul className="collection">
				{this.scripts.map((script, index) =>
					<ScriptItem key={index} item={script} instance={this.props.instance.key} />
				)}
			</ul>
			<div id="dialog-add" className="modal">
                    <div className="modal-content">
                        <h4>Neues Skript</h4>
                        <div className="row">
                            <div className="col s2"><label htmlFor='name'>Name:</label></div>
                            <div className="col s10"><input name='name' type='text' autoComplete='off' required /></div>
                        </div>
                        <div className="row">
                            <div className="col s2"><label htmlFor='type'>Typ:</label></div>
                            <div className="col s10">
								<select name="type">
									<option value="js">Javascript</option>
									<option value="blockly" disabled>Blockly</option>
								</select>
							</div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button className="modal-close btn-flat waves-effect waves-red">Abbrechen</button>
                        <input type="submit" className="btn-flat waves-effect waves-green" value="Hinzufügen" />
                    </div>
            </div>
		</div>
	}
}

class ScriptItem extends React.Component {

	render() {
		let running = this.props.item.isRunning ? <span className="secondary-content">Läuft</span> : "";
		let url = "/adapters/" + this.props.instance + "/edit-js/" + this.props.item.id
		return <a href={url} className="collection-item">
			<span className="title">{this.props.item.name}</span>
			{running}
		</a>
	}
}

module.exports = Index;