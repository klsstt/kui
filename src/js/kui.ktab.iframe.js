/**
 * 页面选项卡 Iframe 版本
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
            this["tabSize"]();  // 修复：初始化时设置 .con-tabs 的宽度
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
                    // 修复：调用 _checkTabs 代替直接操作 DOM，确保滚动位置正确
                    var url = contab["find"]('a')['attr']("href");
                    _this["_checkTabs"](ct, url);
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
            $(obj).on("click", "a[data-iframe]", function(event) {
                console.log('[DEBUG] data-iframe 点击事件触发！', this);
                var a = $(this),
                    reg = new RegExp(/^([a-zA-Z]+:|#|javascript|www\.)/),
                    url = a.attr("href"),
                    title = $.trim(a.text()) || $.trim(a.attr("title")),
                    id = a.data("iframe") || '.kui-main',
                    target = a.is("[target=\"_blank\"]"),
                    ct = $(".con-tabs"),
                    n = url.indexOf('#'),
                    url2 = n > 0 ? url.substring(0, n) : url;

                console.log('[DEBUG] url:', url, 'target:', target, 'id:', id);

                if (reg.test(url)) {
                    event.preventDefault();
                    return;
                }

                if (target && id === '.kui-main') {
                    console.log('[DEBUG] 准备创建 tab');
                    if (_this._checkTabs(ct, url2)) {
                        event.preventDefault();
                        return;
                    }

                    _this.tabType = true;
                    _this.buildTab({
                        name: title,
                        url: url
                    });

                    if (!_this.$instance.find(a).length) {
                        _this.enable(a.parent());
                    }
                } else if (!target) {
                    $(id).find("iframe.active").attr('src', url);
                }

                event.preventDefault();
            });
        },
        '_checkoutTab': function(e) {
            var content = this["$content"],
                tag = e['attr']("target"),
                title = $["trim"](e["attr"]('title')),
                url = e["attr"]("href"),
                chi = content["children"]('iframe[name="' + tag + '"]');
            $('title')["text"](title);
            if (!chi || chi["length"] === 0) {
                // 如果目标 iframe 不存在，则创建一个新的
                this["buildIframe"](url);
                chi = content["children"]('iframe[name="' + tag + '"]');
            }
            // 修改 history.replaceState 的调用，避免刷新时出现 403 错误
            // if (!this["tabType"]) {
            //     win["history"]['replaceState'](null, '', '?action=' + url);
            // }
            // 修改每个 iframe 的 src 属性，避免刷新时出现 403 错误
            chi["attr"]("src", url);
            content["children"]('.active')["removeClass"]("active");
            chi["addClass"]("active");
            this["iframeEvents"](chi);
            this["_updateSetting"]('checked', tag);
            this["tabType"] = ![];
        },        '_defaultTab': function() {
            var a = $('.kui-ktabs')['find']("li:first > a"),
                data;
            if (!a || a.length === 0) {
                a = $('#ktab').find('a:first');
            }
            data = this["settings"] = $['kui']['store']["get"](this["storageKey"]);
            if (data === null) {
                data = $['extend'](!![], {}, {
                    'iframe-0': {
                        'url': a["attr"]('href') || 'home.html',
                        'name': a["text"]() || '首页'
                    },
                    'checked': a["attr"]('target') || 'iframe-0',
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
        'enable': function(temp) {
            var _this = this;
            this["$content"]['on']('click', 'a', function() {
                var a = $(this),
                    reg, url = a['attr']("href"),
                    title = $["trim"](a["text"]()) || $["trim"](a["attr"]('title')),
                    id = a['data']("iframe") || '.kui-main',
                    target = a['is']("[target=\"_blank\"]");
                reg = new RegExp(/^([a-zA-Z]+:|#|javascript|www\.)/);
                if (reg["test"](url)) {
                    return;
                }
                if (target || id) {  // 只要 target 或 data-iframe 属性就处理标签
                    // 修复：移除 history.replaceState 调用，避免刷新时出现 403 错误
                    // win["history"]["replaceState"](null, '', '?action=' + url);
                    _this['tabType'] = !![];
                    // 先检查是否已存在 URL 的标签，如果存在则切换，不存在则创建
                    var ct = $(".con-tabs"),
                        n = url.indexOf('#'),
                        url2 = n > 0 ? url.substring(0, n) : url;
                    if (!_this["_checkTabs"](ct, url2)) {
                        // 标签不存在，创建新标签
                        _this["buildTab"]({
                            'name': title,
                            'url': url
                        });
                    }
                    if (!_this["$instance"]["find"](a)["length"]) {
                        _this["enable"](a["parent"]());
                    }
                } else if (!target) {
                    $(id)["find"]("iframe.active")['attr']('src', url);
                }
                temp["preventDefault"]();
            });
        },
        'buildTab': function(e) {
            console.log('[DEBUG buildTab] 开始创建 tab:', e);
            var ct = $(".con-tabs"),
                check, arr = {},
                id, url = e["url"],
                n = url["indexOf"]('#'),
                url2 = n > 0 ? url["substring"](0, n) : url;
            console.log('[DEBUG buildTab] url:', url, 'url2:', url2);
            
            if (this["_checkTabs"](ct, url2)) {
                console.log('[DEBUG buildTab] _checkTabs 返回 true，tab 已存在，取消创建');
                return;
            }
            console.log('[DEBUG buildTab] _checkTabs 返回 false，继续创建');
            
            id = ++this['tabId'];
            check = "iframe-" + id;
            console.log('[DEBUG buildTab] tabId:', id, 'iframe name:', check);
            
            ct["find"]("li.active")["removeClass"]("active");
            ct["append"]('<li class=\"active\" ><a href=\"' + url2 + "\" target=\"" + check + "\" title=\"" + e["name"] + '' +
                "\" rel=\"contents\"><span>" + e["name"] + '</span><i class=\"fa' + " fa-close\">" + "</i></a></li>");
            console.log('[DEBUG buildTab] tab HTML 已插入');
            
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
            console.log('[DEBUG buildTab] tabSize 调用完成');
            
            // 修复：确保新创建的标签在可见区域
            var view = this["view"],
                twidth = this["tabWidth"],
                li = ct["find"]("li.active"),
                temp2 = li['prevAll']('li')["size"]() * twidth;

            console.log('[DEBUG buildTab] view:', view, 'twidth:', twidth, 'prevAll count:', li['prevAll']('li').size(), 'temp2:', temp2);

            // 计算新标签的位置，确保它在可见区域内
            if (temp2 >= view) {
                // 如果标签在右边超出可见区域，滚动到标签位置
                ct["css"]({
                    'left': -(temp2 - view + twidth)
                });
            } else {
                // 否则保持在起始位置
                ct["css"]({
                    'left': 0
                });
            }
            this['tabType'] = ![];
        },
        '_checkTabs': function(e, url) {
            var temp1, temp2, temp3, width, view = this["view"],
                twidth = this["tabWidth"],
                li = e["find"]("a[href=\"" + url + '\"]')["closest"]('li');

            // 如果标签不存在，返回 false
            if (li["size"]() <= 0) {
                return ![];
            }

            // 移除所有 active 类，给当前标签添加 active 类
            e["find"]("li.active")["removeClass"]("active");
            li['addClass']("active");

            // 调用 _checkoutTab 更新 iframe
            this["_checkoutTab"](li["find"]('a'));

            // 修复：获取容器当前的实际 left 值，而不是 position().left
            temp1 = parseFloat(e.css('left')) || 0;
            width = e['width']();
            temp2 = li['prevAll']('li')["size"]() * twidth;
            temp3 = li["nextAll"]('li')["size"]() * twidth;

            // 修复：始终计算并设置正确的位置，不提前返回
            if (temp2 < -temp1) {
                // 标签在可见区域左边，需要向右滚动
                temp1 = -temp2;
            } else if (temp2 + twidth > -temp1 + view) {
                // 标签在可见区域右边，需要向左滚动
                temp1 = -(temp2 + twidth - view);
            }

            // 修复：使 css() 代替 animate() 避免渲染延迟
            e["css"]({
                'left': temp1
            });

            return !![];
        },
        'buildIframe': function(e) {
            var content = this['$content'],
                iframe = "iframe-" + this["tabId"],
                temp;
            content["children"](".active")["removeClass"]("active");
            content["append"]("<iframe src=\"" + e + "\" frameborder=\"0\" name=\"" + iframe + "\" class=\"page-frame animation-fade active\"></iframe>");
            temp = content["find"]('iframe[name="' + iframe + '"]');
            this["iframeEvents"](temp);
        },
        'tabSize': function() {
            var width, ct = $('.con-tabs'),
                size = ct["find"]('li')["size"]();
            // 修复：重新计算 tabWidth，确保使用最新的标签宽度
            if (size > 0) {
                this["tabWidth"] = ct["find"]('li').first()["width"]();
                width = this["tabWidth"] * size;
                ct["css"]("width", width);
            }
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
            // 修复：使 css() 代替 animate() 避免渲染延迟
            e["css"]({
                'left': left
            });
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

