var instanceKey = $("#instance").val();

$(document).ready(() => {
    socket.emit("message", { to: instanceKey, cmd: "getGlobaleDefinition"}, function(result) {
        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.ES6,
            allowNonTsExtensions: true
        });
        
        monaco.languages.typescript.typescriptDefaults.addExtraLib(result, 'globale.d.ts');
    
        scriptId = window.location.pathname.substr(window.location.pathname.lastIndexOf(".")+1);
        loadScript(scriptId);
    });

    socket.on("message", (msg) => {
        console.log("message", msg);
        var data = msg.data
        switch(msg.cmd) {
            case "runningChanged":
                if(data.id !== scriptObject.id) return;
                if(data.value) {
                    $("#btnRun").addClass("disabled");
                    $("#btnStop").removeClass("disabled");
                    alert("Script wurde gestartet.", "Erfolgreich", "success");
                } else {
                    $("#btnRun").removeClass("disabled");
                    $("#btnStop").addClass("disabled");
                    if(data.code == 0 || data.code == null)
                        alert("Script wurde gestoppt.", "Info");
                    else
                        alert("Script wude beendet.<br /><br />Code: " + data.code, "Fehler", "warning");
                }
                break;
        }
    })
});


$(window).bind('keydown', function(event) {
    if (event.ctrlKey || event.metaKey) {
        switch (String.fromCharCode(event.which).toLowerCase()) {
        case 's':
            event.preventDefault();
            $("#btnSave").click();
            break;
        case 'z':
            event.preventDefault();
            $("#btnUndo").click();
            break;
        case 'y':
            event.preventDefault();
            $("#btnRedo").click();
            break;
        }
    }
});

let scriptId;
var initialVersion;
let currentVersion;
let lastVersion;
    
var timeout;
var editor;
var scriptObject = { script: "\n" };
var monacoCreated = false;
var lastSaved;
var firstConnect = true;

var socket = io("http://" + window.location.hostname +":3000");
socket.emit("subscribeMessage", instanceKey + ".fontend");
socket.on("connect", () => {
    if(firstConnect) {
        firstConnect = false;
        return;
    }
    alert("Verbindung wieder hergestellt", "green white-text")
});
socket.on("disconnect", () => alert("Verbindung getrennt.", "red white-text"));


$("#btnNewScript").click(() => {
    if(!$("#btnSave").hasClass("disabled")) {
        if(!confirm("Du hast nicht gespeichert. Alle änderungen gehen verloren.\n\nTrotzdem fortfahren?"))
            return;
    }

    var name = prompt("Name des Scripts");

    socket.emit("message", { to: instanceKey, cmd: "createScript", value: { name: name }}, function(result) {
        var id = result.id.substr(result.id.indexOf(".")+1);
        $("#scriptsList").append('<li><a id="' + id + '" href="#' + id + '"><span class="mif-file-code icon"></span><span class="title">' + result.name + '</span></a></li>')
        loadScript(id);
    });
    return false;
});

$("#btnSave").click(() => {
    var script = editor.getValue();
    lastSaved = currentVersion;
    checkUndo();
    socket.emit("message", { to: instanceKey, cmd: "saveScript", value: { id: scriptId, script: script }}, function(result) {
        alert("Wurde gespeichert", "Speichern", "success");
    });
})

$("#btnDelete").click(() => {
    if(!confirm("Sicher, dass du das Skript unwiederruflich löschen möchtest?"))
            return;

    socket.emit("message", { to: instanceKey, cmd: "deleteScript", value: { id: scriptObject.id }}, function(result) {
        window.location = "/adapters/" + instanceKey + "/scripts";
    });
})

$("#btnRun").click(() => {
    if(!$("#btnSave").hasClass("disabled")) {
        if(!confirm("Du hast nicht gespeichert. Die aktuellen änderungen werden erst nach dem Speichern und neustarten wirksam!\n\nTrotzdem fortfahren?"))
            return;
    }

    socket.emit("message", { to: instanceKey, cmd: "runScript", value: scriptObject.id });
    return false;
});

$("#btnStop").click(() => {
    socket.emit("message", { to: instanceKey, cmd: "stopScript", value: scriptObject.id });
    return false;
});


function initMonaco() {
    editor = monaco.editor.create(document.getElementById('monaco-container'), {
        value: scriptObject.script,
        language: 'typescript'
    });

    editor.model.onDidChangeContent((event) => {
        checkUndo();
        clearTimeout(timeout);
        timeout = setTimeout(checkErrors, 2000);
    });

    setTimeout(checkErrors, 2000);


    initialVersion = editor.getModel().getAlternativeVersionId();
	currentVersion = initialVersion;
    lastVersion = initialVersion;
    lastSaved = initialVersion;

    $("#btnUndo").click(() => {
        editor.trigger('aaaa', 'undo', 'aaaa');
		editor.focus();
    });

    $("#btnRedo").click(() => {
        editor.trigger('aaaa', 'redo', 'aaaa');
		editor.focus();
    });
}

function loadScript(id) {
    socket.emit("message", { to: instanceKey, cmd: "getScript", value: id}, function(result) {
        if(result == null) {
            alert("Skript konnte nicht gefunden werden.", "Fehler", "alert");
            return;
        }

        scriptObject = result;
        if(!monacoCreated) {
            monacoCreated = true;
            initMonaco();
        } else {
            editor.setValue(result.script);
            lastSaved = currentVersion;
            resetUndo();
        }

        if(result.isRunning) {
            $("#btnRun").addClass("disabled");
            $("#btnStop").removeClass("disabled");
        } else {
            $("#btnRun").removeClass("disabled");
            $("#btnStop").addClass("disabled");
        }
    });
}

function checkErrors() {
    var list = monaco.editor.getModelMarkers({});
    var errcount = $("#errorCount");
    errcount.html(list.length);

    if(list.length > 0) {
        errcount.parent().parent().addClass("bg-red fg-white");
        $("#errorGroupList").html("");

        list.forEach((item) => {
            $("#errorGroupList").append('<button data-line="' + item.startLineNumber + '" data-col="' + item.startColumn + '" class="ribbon-icon-button"><span class="icon"><span class="mif-list"></span></span><span class="caption">Line: ' + item.startLineNumber + ' - ' + item.message + '</span></button>')
        })
        $("#errorGroupList").css("width", "calc(100% - 15px)");
        $("#errorGroupList button").click((e) => {
            var target = $(e.currentTarget);
            editor.revealLineInCenter($(e.currentTarget).data("line"));
            editor.setPosition({column: target.data("col"), lineNumber: target.data("line")});
            editor.focus();
        });
    } else {
        errcount.parent().parent().removeClass("bg-red fg-white");
        $("#errorGroupList").html("");
    }
}

function resetUndo() {
    initialVersion = currentVersion;
    lastVersion = currentVersion;
    checkUndo();
}

function checkUndo() {
    const versionId = editor.getModel().getAlternativeVersionId();
    if (versionId < currentVersion) {
        enableRedoButton();
        if (versionId === initialVersion) {
            disableUndoButton();
        }
    } else {
        if (versionId <= lastVersion) {
            if (versionId == lastVersion) {
                disableRedoButton();
                disableUndoButton();
            } else {
                enableUndoButton();
            }
        } else { // adding new change, disable redo when adding new changes
            disableRedoButton();
            if (currentVersion > lastVersion) {
                lastVersion = currentVersion;
            }
            enableUndoButton();
        }
    }

    if(lastSaved == versionId)
    {
        $("#btnSave").addClass("disabled");
        $("#btnSave").removeClass("fg-green");
    } else {
        $("#btnSave").removeClass("disabled");
        $("#btnSave").addClass("fg-green");
    }


    currentVersion = versionId;
}


function disableUndoButton() {
    $("#btnUndo").addClass("disabled");
    $("#btnUndo").removeClass("fg-blue");
}

function disableRedoButton() {
    $("#btnRedo").addClass("disabled");
    $("#btnRedo").removeClass("fg-blue");
}

function enableUndoButton() {
    $("#btnUndo").removeClass("disabled");
    $("#btnUndo").addClass("fg-blue");
}

function enableRedoButton() {
    $("#btnRedo").removeClass("disabled");
    $("#btnRedo").addClass("fg-blue");
}

//

//<button class="ribbon-icon-button"><span class="icon"><span class="mif-list"></span></span><span class="caption">Line: 22 - Missing semikolon</span></button>