var React = require('react');

class Index extends React.Component {
    render() {
        return <div>
            <nav className="grey" data-role="ribbonmenu">
                <ul className="tabs-holder">
                    <li><a href="#section-standard">Standard</a></li>
                    <li><a href="#section-errors">Fehler (<span id="errorCount">0</span>)</a></li>
                    <li><a href="#section-imex">Im-/Export</a></li>
                    <li><a href="#section-settings">Einstellungen</a></li>
                </ul>
                <div className="content-holder">
                    <div className="section" id="section-standard">
                        <div className="group">
                            <div data-role="buttonsGroup" data-cls-active="active">
                                <button id="btnSave" className="ribbon-button disabled green-text">
                                    <span className="icon">
                                        <i className="material-icons">save</i>
                                    </span>
                                    <span className="caption">Speichern</span>
                                </button>
                                <button id="btnDelete" className="ribbon-button red-text">
                                    <span className="icon">
                                        <i className="material-icons">delete</i>
                                    </span>
                                    <span className="caption">Löschen</span>
                                </button>
                            </div>
                            <span className="title">Aktionen</span>
                        </div>

                        <div className="group">
                            <div data-role="buttonsGroup" data-cls-active="active">
                                <button id="btnRun" className="ribbon-button disabled">
                                    <span className="icon">
                                        <i className="material-icons">play_arrow</i>
                                    </span>
                                    <span className="caption">Starten</span>
                                </button>
                                <button id="btnStop" className="ribbon-button disabled">
                                    <span className="icon">
                                        <i className="material-icons">pause</i>
                                    </span>
                                    <span className="caption">Anhalten</span>
                                </button>
                                <button className="ribbon-button disabled">
                                    <span className="icon">
                                        <i className="material-icons">refresh</i>
                                    </span>
                                    <span className="caption">Neustarten</span>
                                </button>
                            </div>
                            <span className="title">Skript</span>
                        </div>

                        <div className="group">
                            <div data-role="buttonsGroup" data-cls-active="active">
                                <button id="btnUndo" className="ribbon-button disabled blue-text">
                                    <span className="icon">
                                        <i className="material-icons">undo</i>
                                    </span>
                                    <span className="caption">Zurück</span>
                                </button>
                                <button id="btnRedo" className="ribbon-button disabled blue-text">
                                    <span className="icon">
                                        <i className="material-icons">redo</i>
                                    </span>
                                    <span className="caption">Vor</span>
                                </button>
                            </div>
                            <span className="title">Editor</span>
                        </div>
                    </div>


                    <div className="section" id="section-errors">
                        <div className="group">
                            <div id="errorGroupList" className="ribbon-toggle-group">
                            </div>
                            <span className="title">Fehler</span>
                        </div>
                    </div>

                    <div className="section" id="section-imex">
                        <div className="group">
                            <div data-role="buttonsGroup">
                                <button className="ribbon-button">
                                    <span className="icon">
                                        <i className="material-icons">cloud_upload</i>
                                    </span>
                                    <span className="caption">Import</span>
                                </button>
                                <button className="ribbon-button">
                                    <span className="icon">
                                        <i className="material-icons">archive</i>
                                    </span>
                                    <span className="caption">Export</span>
                                </button>
                            </div>
                            <span className="title">Skript</span>
                        </div>
                    </div>


                    <div className="section" id="section-settings">
                        <div className="group flex-column" style={{ width: "220px" }}>
                            <div>
                                <p>hier kann ich auch meine eigenes Ding rein schreiben.</p>
                            </div>
                            <span className="title">Skript</span>
                        </div>
                    </div>


                </div>
            </nav>
            <div id="monaco-container"></div>
        </div>
    }
}

module.exports = Index;