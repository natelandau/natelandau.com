WebFontConfig = {
    google: { families: ["Lato:300,400,400i,700,900", "Vollkorn:400,400i,700,700i"] },
    // other options and settings
    timeout: 3000,
    // loading: function() {},
    active: function () {
        sessionStorage.fonts = true;
    },
    // inactive: function() {},
    // fontloading: function(familyName, fvd) {},
    // fontactive: function(familyName, fvd) {},
    // fontinactive: function(familyName, fvd) {}
};
(function () {
    var wf = document.createElement("script");
    wf.src =
        ("https:" == document.location.protocol ? "https" : "http") +
        "://ajax.googleapis.com/ajax/libs/webfont/1.6.16/webfont.js";
    wf.type = "text/javascript";
    wf.async = "true";
    var s = document.getElementsByTagName("script")[0];
    s.parentNode.insertBefore(wf, s);
})();
