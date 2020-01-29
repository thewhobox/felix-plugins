$(document).ready(() => {
    var selects_main = [];

    Object.keys(dpts.main).forEach((index) => {
        selects_main.push('<option value="' + index + '">' + dpts.main[index] + '</option>');
    });
    
    $("#dp_main").html(selects_main.join(""));
    $('#dp_main').formSelect();

    loadSub(1);
});

$("#dp_main").change(() => {
    loadSub($("#dp_main").val());
});

$("#dp_sub").change(() => {
    loadFunc();
});

function loadSub(id) {
    id = parseInt(id);
    var selects_sub = [];
    Object.keys(dpts.sub[id]).forEach((index) => {
        if(index == "default") return;
        selects_sub.push('<option value="' + index + '">' + dpts.sub[id][index].name + '</option>');
    });
    $("#dp_sub").html(selects_sub.join(""));
    $('#dp_sub').formSelect();

    loadFunc();
}

function loadFunc() {
    var main = $("#dp_main").val();
    var sub = $("#dp_sub").val();
    $("#id").val(dpts.sub[main][sub].func || dpts.sub[main].default.func)
    $("#role").val(dpts.sub[main][sub].role || dpts.sub[main].default.role);
}