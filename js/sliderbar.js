/* 2018-12-4 22:52:49 | 版权所有 火星科技 http://marsgis.cn  【联系我们QQ：516584683，微信：marsgis】 */
var containExample = !1
  , sideBarIconConfig = sideBarIconConfig || {};
function initSideBar() {
    var e = $("ul#sidebar-menu");
    for (var i in exampleConfig)
        e.append(createSideBarMenuItem(i, exampleConfig[i], !1))
}
function sidebarScrollFix() {
    $("ul#sidebar-menu>li").hover(function(e) {
        if ($("body").hasClass("sidebar-collapse")) {
            $(this).children("a").children(".sidebar-title-bar").css({
                top: $(this).offset().top - $(window).scrollTop() + "px",
                width: "233px"
            });
            var i = $(this).offset().top - $(window).scrollTop()
              , a = $(".sidebar-menu").height() - i
              , n = $(this).height() + $(this).children("ul").height();
            a <= n && $(".sidebar-menu").css({
                height: n + $(window).height() + "px"
            });
            var t = i + $(this).height();
            $(this).children("ul").css({
                top: t + "px"
            });
            var r = $(this).children("ul")
              , s = Math.abs($(window).height() - i - $(this).height())
              , l = r.height();
            s < l && (r.css({
                height: l
            }),
            r.addClass("scroll-list"))
        }
    }, function(e) {
        $("body").hasClass("sidebar-collapse") && ($(this).children("ul").removeClass("scroll-list"),
        $(this).children("ul").css({
            height: "auto"
        }))
    }),
    $(".main-sidebar").on("scroll", function(e) {
        e.stopPropagation()
    }),
    $(window).on("resize", function() {
        $(".sidebar-menu").css({
            height: "100%"
        })
    })
}
function createSideBarMenuItem(e, i, a) {
    if (i) {
        containExample = a;
        var n = $("<li id='iclient_" + e + "' class='treeview '></li>");
        return i.content ? (createSideBarMenuTitle(e, i.name, !0).appendTo(n),
        createSideBarSecondMenu(i.content, e).appendTo(n)) : createSideBarMenuTitle(e, i.name, !1).appendTo(n),
        n
    }
}
function createSideBarSecondMenu(e, i) {
    var a = $("<ul class='treeview-menu second-menu '></ul>");
    for (var n in e) {
        var t = $("<li class='menuTitle ' id='" + n + "' ></li>");
        t.appendTo(a);
        var r = e[n];
        containExample && r.content ? (createSideBarMenuSecondTitle(i + "-" + n, r.name, !0).appendTo(t),
        createSideBarThirdMenu(r.content).appendTo(t)) : createSideBarMenuSecondTitle(i + "-" + n, r.name, !1).appendTo(t)
    }
    return a
}
function fileName2Id(e) {
    return (e || "").replace(".html", "")
}
function id2FileName(e) {
    return e + ".html"
}
function createSideBarThirdMenu(e) {
    for (var i = $("<ul class='treeview-menu third-menu'></ul>"), a = e && e.length ? e.length : 0, n = 0; n < a; n++) {
        var t = e[n]
          , r = fileName2Id(t.fileName)
          , s = $("<li class='menuTitle' id='" + r + "' ></li>");
        s.appendTo(i),
        "" != r && t.name && createSideBarMenuThirdTitle(r, t.name, !1).appendTo(s)
    }
    return i
}
function createSideBarMenuTitle(e, i, a) {
    var n = ""
      , t = sideBarIconConfig[e = e || ""];
    t && (n = "<i class='fa " + t + " iconName'></i>");
    var r = "";
    r = -1 != location.href.indexOf("editor.html") ? "../docs/examples.html#" + e : "#" + e;
    var s = $("<a  href='" + r + "' >" + n + "<span class='firstMenuTitle'>" + i + "</span></a>");
    return a && s.append(createCollapsedIcon()),
    s
}
function createSideBarMenuSecondTitle(e, i, a) {
    var n = ""
      , t = sideBarIconConfig[e = e || ""];
    t && (n = "<i class='fa " + t + "'></i>");
    var r = "";
    r = -1 != location.href.indexOf("editor.html") ? "../docs/examples.html#" + e : "#" + e;
    var s = $("<a href='" + r + "' id='" + e + "-" + e + "'>" + n + "<span class='secondMenuTitle'>" + i + "</span></a>");
    return a && s.append(createCollapsedIcon()),
    s
}
function createSideBarMenuThirdTitle(e, i, a) {
    var n = ""
      , t = sideBarIconConfig[e = e || ""];
    t && (n = "<i class='fa " + t + "'></i>");
    var r = $("<a href='#' id='" + e + "'>" + n + "<span class='thirdMenuTitle'>" + i + "</span></a>");
    return a && r.append(createCollapsedIcon()),
    r
}
function createCollapsedIcon() {
    return $("<span class='pull-right-container'> <i class='fa fa-angle-left pull-right'></i> </span>")
}
function selectMenu(e, i) {
    var a = _getTarget(e, i);
    1 !== i && (_selectTarget(a.parent().parent().parent().parent()),
    _selectTarget(a.parent().parent()),
    _selectTarget(a.parent()),
    _selectTarget(a.find("ul")))
}
function _getTarget(e, i) {
    var a;
    return i ? (1 === i && ($("section#sidebar li.active").removeClass("active"),
    (a = $("section#sidebar li#iclient_" + e)).children("ul").show()),
    2 === i && ($("section#sidebar li.active ul.active li").removeClass("active"),
    a = $("section#sidebar li.treeview").children("ul").children("li#" + e))) : ($("section#sidebar #ul").addClass("active"),
    $("section#sidebar li.active").removeClass("active"),
    a = $("section#sidebar li#" + e)),
    a && a.addClass("active"),
    a
}
function _selectTarget(e) {
    if (e && !(e.length < 1)) {
        var i = e.attr("class");
        i && -1 < i.indexOf("treeview-menu") && -1 === i.indexOf("menu-open") && (e.addClass("menu-open"),
        e.css("display", "block")),
        i && -1 < i.indexOf("treeview") && e.addClass("active")
    }
}
