jQuery(document).ready(function ($) {
    // Archive Toggle
    $("#archive-list").hide();
    $(".archive-toggle").click(function () {
        //$("#searchform,#nav-list,#widget-drawer").slideUp();
        $("#archive-list").slideToggle();
        $(".fa-folder").toggleClass("fa-folder-open");

        return false;
    });

    // feed Toggle
    $("#feed-list").hide();
    $(".feed-toggle").click(function () {
        //$("#searchform,#nav-list,#widget-drawer").slideUp();
        $("#feed-list").slideToggle();

        return false;
    });
});
