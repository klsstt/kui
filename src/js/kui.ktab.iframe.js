/**
 * 页面选项卡-Iframe版本
 */
(function(win, doc, $) {
    'use strict';

    var tabname = 'iframeTabs';
    $["kui"][tabname] = {
        '$instance': $(".kui-tree-menu"),
        '$content': $(".kui-main"),
        'storageKey': "kui.iframe.kTabs",
        'tabId': 0,
        'relative': 0,
        'tabTimeout': 30,
        'init': function() {
            this["bind"]();
            this['_defaultTab']();
        },
        'bind': function() {
            var _this = this,
                sc = $('.kui-ktabs'),
                ct = sc["find"]("ul.con-tabs");
            this["tabWidth"] = ct["find"]('li')["width"]();
            this["view"] = sc['find']('.contabs-scroll')["width"]();
            this["ifameTabs"]();

            sc['on']("click.kui.ktabs", "button.pull-left",
                function() {
                    _this["tabPosition"](ct, _this["tabWidth"], 'right');
                })['on']("click.kui.ktabs", ".pull-right>.btn-icon", function() {
                var width = ct["width"]();
                _this["tabPosition"](ct, _this["tabWidth"], "left", _this["view"], width);
            })['on']('click.kui.ktabs', "ul.con-tabs>li", function(e) {
                var target = $(e["target"]),
                    contab = $(this);
                if (target['is']("i.fa-close")) {
                    _this['closeTab'](contab);
                } else if (!contab['is'](".active")) {
                    contab["siblings"]('li')["removeClass"]("active");
                    contab["addClass"]("active");
                    _this["_checkoutTab"](contab["find"]('a'));
                    _this['enable'](contab);
                }
                e['preventDefault']();
            });
            sc['on']("click.kui.ktabs", ".pull-right li.reload-page", function() {
                var a = sc['find']("ul.con-tabs>li.active>a"),
                    url = a["attr"]("href");
                _this["$content"]["children"]("[src=\"" + url + '\"]')['attr']("src", url);
            })['on']("click.kui.ktabs", ".pull-right li.close-other", function() {
                var li = sc['find']("ul.con-tabs>li");
                li['each'](function() {
                    var li_temp = $(this),
                        tag;
                    if (!li_temp['is'](".active") && li_temp['index']() !== 0) {
                        tag = li_temp["find"]('a')["attr"]("target");
                        li_temp["remove"]();
                        _this["$content"]["children"]("[name=\"" + tag + '\"]')['remove']();
                        _this["_updateSetting"](tag);
                    }
                });
                ct["animate"]({
                    'left': 0
                }, 100);
                _this["btnView"]("hide");
            })['on']("click.kui.ktabs", '.pull-right li.close-all', function() {
                var li = sc["find"]("ul.con-tabs>li"),
                    eq = li['eq'](0);
                li['each'](function() {
                    var li_temp = $(this),
                        tag;
                    if (li_temp['index']() !== 0x0) {
                        tag = li_temp['find']('a')["attr"]("target");
                        li_temp["remove"]();
                        _this["_updateSetting"](tag);
                    }
                });
                ct["animate"]({
                    'left': 0
                }, 100);
                _this['btnView']('hide');
                eq["addClass"]("active");
                _this["enable"](li['eq'](0));
                _this['_checkoutTab'](eq['find']('a'));
                _this["$content"]['children'](':not(:first)')["remove"]();
                _this["tabSize"]();
            });
            $(doc)['on']("click", '#outLogin', function() {
                $['kui']['store']["remove"](_this["storageKey"]);
            });
            $(win)['on']("resize", this["resize"]);
        },
        'iframeEvents': function(e) {
            var _this = this,
                tempf = function(obj) {
                    $("#admui-siteStyle", obj)['load'](function() {
                        _this["iframeTheme"]();
                    });
                };
            e['load'](function() {
                var cd = _this["iframeDocument"] = this['contentDocument']; //this['$content']["document"]();
                $(cd)['on']('click', function() {
                    /* if (Breakpoints['is']('xs') && $("body")["hasClass"]("site-menubar-open")) {
                        $["site"]['menubar']["hide"]();
                        _this["_hideNavbar"]();
                    } */
                    $("[data-toggle=\"dropdown\"]")["parent"]()["removeClass"]("open");
                });
                tempf(cd);
            });
        },
        'ifameTabs': function(e) {
            var _this = this,
                obj = e === undefined ? doc : e;
            $(obj)['on']("click", "a[data-iframe]", function(temp) {
                var a = $(this),
                    reg, url = a['attr']("href"),
                    title = $["trim"](a["text"]()) || $["trim"](a["attr"]('title')),
                    id = a['data']("iframe") || '.kui-main',
                    target = a['is']("[target=\"_blank\"]");
                reg = new RegExp(/^([a-zA-z]+:|#|javascript|www\.)/);
                if (reg["test"](url)) {
                    return;
                }
                if (target && id === '.kui-main') {
                    win["history"]["replaceState"](null, '', '?action=' + url);
                    _this['tabType'] = !![];
                    _this["buildTab"]({
                        'name': title,
                        'url': url
                    });
                    if (!_this["$instance"]["find"](a)["length"]) {
                        _this["enable"](a["parent"]());
                    }
                } else if (!target) {
                    $(id)["find"]("iframe.active")['attr']('src', url);
                }
                temp["preventDefault"]();
            });
        },
        '_checkoutTab': function(e) {
            var content = this["$content"],
                tag = e['attr']("target"),
                title = $["trim"](e["attr"]('title')),
                url = e["attr"]("href"),
                chi = content["children"]("iframe[name=\"" + tag + '\"]');
            $('title')["text"](title);
            if (!this["tabType"]) {
                win["history"]['replaceState'](null, '', '?action=' + url);
            }
            if (!chi["attr"]("src")) {
                chi["attr"]("src", url);
            }
            content["children"]('.active')["removeClass"]("active");
            chi["addClass"]("active");
            this["iframeEvents"](chi);
            this["_updateSetting"]('checked', tag);
            this["tabType"] = ![];
        },
        '_defaultTab': function() {
            var a = $('.kui-ktabs')['find']("li:first > a"),
                data;
            data = this["settings"] = $['kui']['store']["get"](this["storageKey"]);
            if (data === null) {
                data = $['extend'](!![], {}, {
                    'iframe-0': {
                        'url': a["attr"]('href'),
                        'name': a["text"]()
                    },
                    'checked': a["attr"]('target'),
                    'tabId': this["tabId"]
                });
                this["_updateSetting"](data);
            } else {
                this["tabId"] = 0;
            }
        },
        '_updateSetting': function(e, p) {
            var skey = $['kui']['store']['get'](this['storageKey']);
            skey = skey ? skey : {};
            if (typeof e === "object") {
                $["extend"](!![], skey, e);
            } else if (!p) {
                delete skey[e];
            } else {
                skey[e] = p;
            }
            $['kui']['store']["set"](this["storageKey"], skey, this['tabTimeout']);
        },
        'resize': function() {
            var ctabs = $["kui"][tabname],
                sc = $(".kui-ktabs"),
                ct = sc["find"]("ul.con-tabs");
            ctabs["_throttle"](function() {
                ctabs["view"] = sc["find"](".contabs-scroll")["width"]();
                ctabs['tabEvent'](ct, 'media');
            }, 200)();
        },
        'enable': function(e) {
            var instance = this["$instance"],
                url = $["trim"](e['find']('a')['attr']("href")),
                n = url['indexOf']('#'),
                url2 = n > 0 ? url["substring"](0, n) : url,
                fa = instance["find"]("a[href=\"" + url2 + '\"]'),
                hs, size, open, open2, id, id2;
            if (fa["length"] === 0) {
                //$['kui']["menu"]["refresh"](); //刷新菜单
                return;
            }
            id = $['trim'](instance["closest"]("div.tab-pane.active")["attr"]('id'));
            id2 = $['trim'](fa["closest"]('div.tab-pane')["attr"]('id'));
            if (id !== id2) {
                $("#admui-navbar a[href=\"#" + id2 + '\"]')["tab"]("show");
            }
            size = fa["closest"]('li')["siblings"]('li.open');
            hs = fa["parents"]('li.has-sub');
            open = fa['closest']('li.has-sub')["siblings"]("li.open");
            open2 = instance["find"]("li.open");
            instance["find"]("li.active")['trigger']("deactive.site.menu");
            fa["closest"]('li')['trigger']('active.site.menu');
            if (size["length"]) {
                size["trigger"]("close.site.menu");
            }
            if (!fa['closest']("li.has-sub")["hasClass"]("open")) {
                if (open["length"]) {
                    open["trigger"]("close.site.menu");
                }
                if (open2['length']) {
                    open2["not"](hs)["trigger"]("close.site.menu");
                }
                hs["trigger"]("open.site.menu");
            }
        },
        'buildTab': function(e) {
            var ct = $(".con-tabs"),
                check, arr = {},
                id, url = e["url"],
                n = url["indexOf"]('#'),
                url2 = n > 0 ? url["substring"](0, n) : url;
            if (this["_checkTabs"](ct, url2)) {
                return;
            }
            id = ++this['tabId'];
            check = "iframe-" + id;
            ct["find"]("li.active")["removeClass"]("active");
            ct["append"]('<li class=\"active\" ><a href=\"' + url2 + "\" target=\"" + check + "\" title=\"" + e["name"] + '' +
                "\" rel=\"contents\"><span>" + e["name"] + '</span><i class=\"fa' + " fa-close\">" + "</i></a></li>");
            arr[check] = {
                'url': url2,
                'name': e["name"]
            };
            $["extend"](arr, {
                'checked': check,
                'tabId': id
            });
            this["_updateSetting"](arr);
            e["name"] = e['name'] === '' ? "无标题" : e["name"];
            $("title")["text"]($["trim"](e["name"]));
            this["buildIframe"](url);
            this['tabSize']();
            this["tabEvent"](ct, "media");
            this['tabType'] = ![];
        },
        '_checkTabs': function(e, url) {
            var temp1, temp2, temp3, width, view = this["view"],
                twidth = this["tabWidth"],
                li = e["find"]("a[href=\"" + url + '\"]')["closest"]('li');
            if (li["hasClass"]("active")) {
                return !![];
            }
            if (li["size"]() <= 0) {
                return ![];
            }
            e["find"]("li.active")["removeClass"]("active");
            li['addClass']("active");
            this["_checkoutTab"](li["find"]('a'));
            temp1 = e["position"]()["left"];
            width = e['width']();
            temp2 = li['prevAll']('li')["size"]() * twidth;
            temp3 = li["nextAll"]('li')["size"]() * twidth;
            if (-temp2 < temp1) {
                if (temp2 + temp1 < view) {
                    return !![];
                }
                temp1 = -(temp2 - view + twidth);
            } else {
                if (-temp1 < width - temp3) {
                    return !![];
                }
                temp1 = -(width - temp3 - twidth);
            }
            e["animate"]({
                'left': temp1
            }, 100);
            return !![];
        },
        'buildIframe': function(e) {
            var content = this['$content'],
                iframe = "iframe-" + this["tabId"],
                temp;
            content["children"](".active")["removeClass"]("active");
            content["append"]("<iframe src=\"" + e + "\" frameborder=\"0\" name=\"" + iframe + "\" class=\"page-frame animation-fade active\"></iframe>");
            temp = content["find"]("iframe[name=\"" + iframe + '\"]');
            this["iframeEvents"](temp);
        },
        'tabSize': function() {
            var width, ct = $('.con-tabs'),
                size = ct["find"]('li')["size"]();
            width = this["tabWidth"] * size;
            ct["css"]("width", width);
        },
        'tabEvent': function(e, o) {
            var width = $('.con-tabs')["width"](),
                view = this["view"],
                twidth = this["tabWidth"];
            if (width > this["view"]) {
                this["tabPosition"](e, twidth, "left", view, width, o);
                this["btnView"]("visible");
            } else {
                this['btnView']('hide');
            }
            if (this["currentView"] < view || this['currentContent'] > width) {
                this["tabPosition"](e, twidth, "right", view, width, o);
            }
            this["currentView"] = view;
            this["currentContent"] = width;
        },
        'tabPosition': function(e, tw, left, view, width, o) {
            var _this = this,
                left = e["position"]()["left"],
                width_ = function(temp) {
                    var width = temp + tw;
                    if (width > 0) {
                        _this['relative'] = temp;
                        return 0;
                    } else {
                        return temp;
                    }
                };
            if (left === "left") {
                if (left <= view - width) {
                    return ![];
                }
                if (typeof o !== "undefined") {
                    left = view - width;
                } else {
                    left = this["relative"] !== 0 ? left - tw + this["relative"] : left - tw;
                    this["relative"] = 0;
                }
            } else if (left === 'right') {
                if (left === 0) {
                    return ![];
                }
                if (typeof o !== "undefined") {
                    left = width <= view ? 0 : view - width;
                } else {
                    left = width_(left + tw);
                }
            }
            e["animate"]({
                'left': left
            }, 100);
        },
        '_throttle': function(e, o) {
            var _this = e,
                bool, bool2 = !![];
            return function() {
                var arg = arguments,
                    _th = this;
                if (bool2) {
                    _this["apply"](_th, arg);
                    bool2 = ![];
                }
                if (bool) {
                    return ![];
                }
                bool = setTimeout(function() {
                    clearTimeout(bool);
                    bool = null;
                    _this['apply'](_th, arg);
                }, o || 500);
            };
        },
        'closeTab': function(e) {
            var target = e["children"]('a')['attr']("target"),
                bool = '',
                li = e['next']('li'),
                content = this['$content'];
            if (e['is']('.active')) {
                if (li['size']() > 0) {
                    bool = li;
                } else {
                    bool = e["prev"]('li');
                }
                bool["addClass"]("active");
                this["enable"](bool);
                this['_checkoutTab'](bool['find']('a'));
            }
            e["remove"]();
            content["children"]("[name=\"" + target + '\"]')["remove"]();
            this["_updateSetting"](target);
            this["tabSize"]();
            this["tabEvent"]($(".con-tabs"), "media");
        },
        'btnView': function(e) {
            var sc = $(".kui-ktabs"),
                pl = sc['children']("button.pull-left"),
                icon = sc["find"](".pull-right > button.btn-icon");
            if (e === "visible") {
                pl['removeClass']("hide");
                icon["removeClass"]("hide");
            } else if (e === 'hide') {
                pl["addClass"]("hide");
                icon["addClass"]("hide");
            }
        }
    };
}(window, document, jQuery));