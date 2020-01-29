$("#name").keyup(() => {
    var key = $("#name").val().toLowerCase();

    key = key.replace(/ /g, "_");
    key = key.replace(/\./g, "-");

    $("#path").val(key);
});

$(".modal-trigger").click((e) => {
    var ele = $(e.currentTarget);
    $("input[name=type]").val(ele.data("type"));

    $(".modal-content h4, .modal-content small").hide();

    $(".modal-content h4[data-type=" + ele.data("type") + "]").show();
    $(".modal-content small[data-type=" + ele.data("type") + "]").show();
})