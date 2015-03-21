!function (e, t) {
    function o(e, o) {
        var n, r = e;
        return r.currentStyle ? n = r.currentStyle[o] : window.getComputedStyle && (n = t.defaultView.getComputedStyle(r, null).getPropertyValue(o)), n
    }

    var n = [], r = null;
    window.addEventListener && document.querySelectorAll && Array.prototype.forEach && window.addEventListener("load", function () {
        n = Array.prototype.slice.call(document.querySelectorAll("li")), r = new Array(n.length);
        var e = t.documentElement;
        e.className = e.className.replace(/\bno-js\b/, "js"), n.forEach(function (t, n) {
            var l = t.querySelector("a");
            r[n] = o(l, "background-color"), l.addEventListener("mouseover", function () {
                var t = r[n];
                t && (e.style.backgroundColor = t, e.className += " chosen")
            }), l.addEventListener("mouseout", function () {
                e.style.backgroundColor = "", e.className = "js"
            })
        })
    }, !1)
}(window, document);

//google analytics
(function (i, s, o, g, r, a, m) {
    i['GoogleAnalyticsObject'] = r;
    i[r] = i[r] || function () {
        (i[r].q = i[r].q || []).push(arguments)
    }, i[r].l = 1 * new Date();
    a = s.createElement(o),
        m = s.getElementsByTagName(o)[0];
    a.async = 1;
    a.src = g;
    m.parentNode.insertBefore(a, m)
})(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');

ga('create', 'UA-52159320-1', 'auto');
ga('send', 'pageview');
