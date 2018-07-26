/**
 * 页面选项卡-pjax版本
 */
(function(win, doc, $) {
    'use strict';
    var tabname = 'pjaxTabs';
    $["kui"][tabname] = {
        '$instance': $(".kui-tree-menu"),
        'storageKey': "kui.pjax.kTabs",
        'relative': 0,
        'init': function() {
            this['bind']();
            this["getPath"]();
        },
        'kSize': function() {
            this["labelWidth"] = this["$label"]["width"]();
            this["view"] = this["$view"]["width"]();
        },
        'bind': function() {
            var _this = this,
                container = ".kui-page", //容器
                sc = $(".kui-ktabs"),
                ct = sc["find"]("ul.con-tabs"),
                li = this['$label'] = ct["find"]('li'),
                cs = this['$view'] = sc["find"](".contabs-scroll");

            this["kSize"](li, cs);

            $(doc)['on']("click", 'a[data-pjax]', function(e) { //pjax
                var a = $(this),
                    reg,
                    text = a['text'](),
                    fragment = a['attr']('data-fragment'),
                    url = a['attr']('href');
                text = text === '' ? a["attr"]('title') : text;
                reg = new RegExp(/^([a-zA-z]+:|#|javascript|www\.)/);
                if (reg["test"](url)) {
                    e['preventDefault']();
                    return;
                }
                if (a['is']("[target=\"_blank\"]")) {
                    _this["buildTag"]({
                        'name': text,
                        'fragment': fragment,
                        'url': a['attr']("href")
                    }, e);
                }

            });

            sc['on']("click.kui.ktabs", "button.pull-left", function() {
                _this["labelPosition"](ct, _this["labelWidth"], "right");
            })['on']("click.kui.ktabs", ".pull-right>.btn-icon", function() {
                var width = ct["width"]();
                _this["labelPosition"](ct, _this["labelWidth"], "left", _this["view"], width);
            })['on']("click.kui.ktabs", 'ul.con-tabs>li', function(e) {
                var target = $(e["target"]),
                    contab = $(this);
                var url = contab['find']('a')['attr']('href'),
                    fragment = contab['find']('a')['attr']('data-fragment');
                if (target['is']('i.fa-close') && contab['is']('.active')) {
                    _this["closeTab"]();
                    e["preventDefault"]();
                } else if (target['is']('i.fa-close')) {
                    contab["remove"]();
                    _this['labelSize']();
                    _this['labelEvent'](ct, "media");
                    e["preventDefault"]();
                } else if (contab['is']('.active')) {
                    e["preventDefault"]();
                } else {
                    contab["siblings"]('li')['removeClass']("active");
                    contab["addClass"]("active");
                    //_this["enable"](contab);
                    e["preventDefault"]();

                    $["pjax"]({
                        'url': url,
                        'fragment': fragment,
                        'changeAddress': true,
                        'container': container,
                        'replace': !![]
                    });
                    $("title")["text"]($["trim"](target['text']()));
                }
            });
            sc['on']('click.kui.ktabs', ".pull-right li.reload-page", function() {
                var url = sc["find"]("ul.con-tabs>li.active>a")["attr"]("href");
                $["pjax"]({
                    'url': url,
                    'changeAddress': true,
                    'container': container,
                    'replace': !![]
                });
            })['on']('click.kui.ktabs', ".pull-right li.close-other", function() {
                sc["find"]("ul.con-tabs>li")["filter"](function() {
                    return !$(this)['is'](".active") && $(this)["index"]() !== 0;
                })["remove"]();
                ct["animate"]({
                    'left': 0
                }, 100);
                _this['btnView']("hide");
            })['on']('click.kui.ktabs', ".pull-right li.close-all", function() {
                var li = sc['find']("ul.con-tabs>li"),
                    url = li['eq'](0)["find"]('a')["attr"]("href"),
                    fragment = li['eq'](0)['find']('a')['attr']('data-fragment');
                li["filter"](function() {
                    return $(this)["index"]() !== 0;
                })["remove"]();
                ct["animate"]({
                    'left': 0
                }, 100);
                _this["btnView"]("hide");
                $["pjax"]({
                    'url': url,
                    'fragment': fragment,
                    'changeAddress': true,
                    'container': container,
                    'replace': !![]
                });
                li['eq'](0)["addClass"]("active");
            });
            $(win)['on']("resize", this["resize"]);
        },
        'resize': function() {
            var sContabs = $(".kui-ktabs"),
                cTabs = sContabs["find"]("ul.con-tabs");
            $["kui"][tabname]['throttle'](function() {
                $["kui"][tabname]["view"] = sContabs["find"](".contabs-scroll")["width"]();
                $["kui"][tabname]["labelEvent"](cTabs, 'media');
            }, 200)();
        },
        'enable': function(e) {
            var url = $['trim'](e["find"]('a')['attr']('href')),
                topId, a = this;
            var findTopId = function() {
                var nTabs = $(".nav-tabs"),
                    li;
                if (a['$instance']["parents"]('div.tab-pane.active')["attr"]('id') !== topId) {
                    li = nTabs["find"]("a[href='" + topId + "']")["parent"]('li');
                    $("a[href='" + topId + "']")["tab"]('show');
                    nTabs['find']('li')["removeClass"]("active");
                    li["addClass"]('active');
                    if (li["parent"]('ul')["hasClass"]('dropdown-menu')) {
                        li['closest'](".dropdown")["addClass"]("active");
                    }
                }
                a["$instance"]['find']("li.has-sub")['removeClass']("open");
                a["$instance"]["find"]('a')["parent"]('li')["removeClass"]("active");
                if (a["$instance"]["find"]("a[href='" + url + "']")["parents"]('li')["hasClass"]("has-sub")) {
                    a["$instance"]["find"]("a[href='" + url + "']")["parents"]('li.has-sub')["addClass"]('open');
                }
            };

            a["$instance"]["find"]('a')['each'](function() {
                var a = $(this);
                if (a["attr"]('href') === url) {
                    //topId = a["parents"](".tab-pane")['attr']('id');
                    //findTopId();  无关联top则注释
                    a["parent"]('li')["addClass"]("active");
                    return ![];
                }
            });
        },
        'getPath': function() {
            var pname = location["pathname"],
                txt = $('.kui-page')["find"]('.kui-title')["text"]();
            if (pname !== $["ctx"] + '/') {
                this['buildTag']({
                    'name': txt,
                    'url': pname
                });
            }
            $(".kui-page")["find"]("title")["remove"]();
        },
        'buildTag': function(btag, _this) {
            var cTabs = $(".con-tabs");
            if (_this && this["checkTags"](btag["url"])) {
                _this["preventDefault"]();
                return;
            }
            btag['name'] = btag['name'] === '' ? "无标题" : btag["name"];
            $("title")["text"]($["trim"](btag["name"]));
            if (cTabs["find"]("a[href='" + btag['url'] + "']")["size"]() > 0) {
                //if(cTabs["find"]('a')['attr']['href']==btag['url']){
                return;
            }
            var fragment = "";
            if (btag['fragment']) {
                fragment = "data-fragment=\"" + btag['fragment'] + "\"";
            }
            cTabs["find"]("li.active")["removeClass"]('active');
            cTabs['append']("<li class=\"active\"><a data-pjax=.kui-page " + fragment + " href=\"" + btag["url"] + "\" title=\"" + btag["name"] + "\" rel=\"contents\"><span>" + btag["name"] + "</span><i class=\"fa fa-close\"></i></a></li>");
            this['labelSize']();
            this["labelEvent"](cTabs, 'media', "add");
        },
        'checkTags': function(ctag) {
            var ctans = $('.con-tabs'),
                a = ctans["find"]("a[href='" + ctag + "']");
            var width = $(".con-tabs")["width"]();
            if (a["size"]() > 0) {
                if (a['closest']('li')["hasClass"]("active")) {
                    this["app"](ctans, a["closest"]('li'), this["labelWidth"], this["view"], width);
                    return !![];
                } else {
                    ctans["find"]("li.active")['removeClass']("active");
                    ctans['find']("a[href='" + ctag + "']")["closest"]('li')["addClass"]("active");
                    this["app"](ctans, a['closest']('li'), this["labelWidth"], this["view"], width);
                    return ![];
                }
            } else {
                return ![];
            }
        },
        'labelSize': function() {
            var size,
                width,
                ctans = $('.con-tabs');
            size = ctans["find"]('li')["size"]();
            width = this["labelWidth"] * size;
            ctans["css"]('width', width);
        },
        'labelEvent': function(value, value2) {
            var width = $(".con-tabs")["width"]();
            if (width > this["view"]) {
                this["labelPosition"](value, this["labelWidth"], "left", this["view"], width, value2);
                this["btnView"]("visible");
            } else {
                this["btnView"]('hide');
            }
            if (this["currentView"] < this["view"] || this['currentContent'] > width) {
                this["labelPosition"](value, this["labelWidth"], "right", this["view"], width, value2);
            }
            this["currentView"] = this["view"];
            this['currentContent'] = width;
        },
        'app': function(ani, o, n, npx, npx2) {
            var left_value = ani["position"]()["left"],
                size1 = o["prevAll"]('li')["size"]() * n,
                size2 = o["nextAll"]('li')["size"]() * n;
            if (-size1 < left_value) {
                if (size1 + left_value < npx) {
                    return ![];
                }
                left_value = -(size1 - npx + n);
            } else {
                if (-left_value < npx2 - size2) {
                    return ![];
                }
                left_value = -(npx2 - size2 - n);
            }
            ani["animate"]({
                'left': left_value
            }, 100);
        },
        'labelPosition': function(lablePostion, size, leftPx, left1, left2, par) {
            var _this = this,
                vLfet = lablePostion['position']()['left'],
                rela = function(n) {
                    var temp = n + size;
                    if (temp > 0) {
                        _this["relative"] = n;
                        return 0;
                    } else {
                        return n;
                    }
                };
            if (leftPx === 'left') {
                if (vLfet <= left1 - left2) {
                    return ![];
                }
                if (typeof par !== "undefined") {
                    vLfet = left1 - left2;
                } else {
                    vLfet = this["relative"] !== 0 ? vLfet - size + this["relative"] : vLfet - size;
                    this["relative"] = 0;
                }
            } else if (leftPx === 'right') {
                if (vLfet === 0) {
                    return ![];
                }
                if (typeof par !== "undefined") {
                    vLfet = left2 <= left1 ? 0 : left1 - left2;
                } else {
                    vLfet = rela(vLfet + size);
                }
            }
            lablePostion['animate']({
                'left': vLfet
            }, 100);
        },
        'throttle': function(e, n) {
            var _e = e,
                number,
                tbool = !![];
            return function() {
                var _arguments = arguments,
                    _this = this;
                if (tbool) {
                    _e["apply"](_this, _arguments);
                    tbool = ![];
                }
                if (number) {
                    return ![];
                }
                number = setTimeout(function() {
                    clearTimeout(number);
                    number = null;
                    _e['apply'](_this, _arguments);
                }, n || 500);
            };
        },
        'closeTab': function() {
            var sc = $(".kui-ktabs"),
                active_li = sc['find']("ul.con-tabs>li.active"),
                fragment, url, title;
            this['$instance']["find"](".active")["removeClass"]("active");
            if (active_li["next"]('li')["size"]() > 0) {
                url = active_li["next"]('li')["find"]('a')['attr']("href");
                title = active_li["next"]('li')["find"]('a')['attr']("title");
                fragment = active_li["next"]('li')["find"]('a')['attr']("data-fragment");
                active_li["next"]('li')['addClass']("active");

            } else {
                url = active_li['prev']('li')["find"]('a')["attr"]('href');
                title = active_li["prev"]('li')["find"]('a')['attr']("title");
                fragment = active_li["prev"]('li')["find"]('a')['attr']("data-fragment");
                active_li['prev']('li')['addClass']('active');

            }
            active_li["remove"]();
            this["labelSize"]();
            this['labelEvent'](sc, "media");
            $['pjax']({
                'url': url,
                'fragment': fragment,
                'changeAddress': true,
                'container': '.kui-page',
                'replace': !![]
            });
            this["$instance"]['find']("a[href='" + url + "']")["parent"]('li')['addClass']('active');
            $("title")["text"]($["trim"](title));
        },
        'btnView': function(display) {
            var sContabs = $(".kui-ktabs"),
                bpl = sContabs['children']("button.pull-left"),
                bicon = sContabs['find'](".pull-right > button.btn-icon");
            if (display === "visible") {
                bpl["removeClass"]('hide');
                bicon['removeClass']("hide");
            } else if (display === 'hide') {
                bpl["addClass"]("hide");
                bicon['addClass']('hide');
            }
        }
    };
}(window, document, jQuery));


/*pjax */
(function($) {
    var pjaxWaiting = {};

    function fnPjax(selector, container, options) {
        var context = this;
        return this.on('click.pjax', selector, function(event) {
            var opts = $.extend({}, optionsFor(container, options)),
                dataPjax = $(this).attr('data-pjax');
            if (!opts.container)
                if (dataPjax === '')
                    opts.container = '.kui-page';
                else
                    opts.container = $(this).attr('data-pjax') || context;
            handleClick(event, opts)
        })
    }

    function handleClick(event, container, options) {
        options = optionsFor(container, options);
        var link = event.currentTarget;
        if ($(link).attr('data-fragment')) {
            options.fragment = $(link).attr('data-fragment');
        }
        if ($(link).attr('data-index')) {
            event.preventDefault();
            return;
        }
        if (link.tagName.toUpperCase() !== 'A')
            throw "$.fn.pjax or $.pjax.click requires an anchor element";
        if (event.which > 1 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
            return;
        if (location.protocol !== link.protocol || location.hostname !== link.hostname)
            return;
        if (link.href.indexOf('#') > -1 && stripHash(link) == stripHash(location))
            return;
        if (event.isDefaultPrevented())
            return;
        var defaults = {
            url: link.href,
            container: $(link).attr('data-pjax'),
            target: link
        };
        var opts = $.extend({}, defaults, options);
        var clickEvent = $.Event('pjax:click');
        $(link).trigger(clickEvent, [opts]);
        pjaxWaiting.link = opts;
        if (pjaxWaiting.script && pjaxWaiting.script.length !== 0) {
            event.preventDefault();
            return
        }
        if (!clickEvent.isDefaultPrevented()) {
            pjax(opts);
            event.preventDefault();
            $(link).trigger('pjax:clicked', [opts])
        }
    }

    function handleSubmit(event, container, options) {
        options = optionsFor(container, options);
        var form = event.currentTarget;
        var $form = $(form);
        if (form.tagName.toUpperCase() !== 'FORM')
            throw "$.pjax.submit requires a form element";
        var defaults = {
            type: ($form.attr('method') || 'GET').toUpperCase(),
            url: $form.attr('action'),
            container: $form.attr('data-pjax'),
            target: form
        };
        if (defaults.type !== 'GET' && window.FormData !== undefined) {
            defaults.data = new FormData(form);
            defaults.processData = false;
            defaults.contentType = false
        } else {
            if ($(form).find(':file').length) {
                return
            }
            defaults.data = $(form).serializeArray()
        }
        pjax($.extend({}, defaults, options));
        event.preventDefault()
    }

    function pjax(options) {
        options = $.extend(true, {}, $.ajaxSettings, pjax.defaults, options);
        if ($.isFunction(options.url)) {
            options.url = options.url()
        }
        var target = options.target;
        var hash = parseURL(options.url).hash;
        var context = options.context = findContainerFor(options.container);
        if (!options.data)
            options.data = {};
        if ($.isArray(options.data)) {
            options.data.push({
                name: '_pjax',
                value: context.selector
            })
        } else {
            options.data._pjax = context.selector
        }

        function fire(type, args, props) {
            if (!props)
                props = {};
            props.relatedTarget = target;
            var event = $.Event(type, props);
            context.trigger(event, args);
            return !event.isDefaultPrevented()
        }
        var timeoutTimer;
        options.beforeSend = function(xhr, settings) {
            if (settings.type !== 'GET') {
                settings.timeout = 0
            }
            xhr.setRequestHeader('X-PJAX', 'true');
            xhr.setRequestHeader('X-PJAX-Container', context.selector);
            if (!fire('pjax:beforeSend', [xhr, settings]))
                return false;
            if (settings.timeout > 0) {
                timeoutTimer = setTimeout(function() {
                    if (fire('pjax:timeout', [xhr, options]))
                        xhr.abort('timeout')
                }, settings.timeout);
                settings.timeout = 0
            }
            var url = parseURL(settings.url);
            if (hash)
                url.hash = hash;
            options.requestUrl = stripInternalParams(url)
        };
        options.complete = function(xhr, textStatus) {
            if (timeoutTimer)
                clearTimeout(timeoutTimer);
            fire('pjax:complete', [xhr, textStatus, options]);
            fire('pjax:end', [xhr, options])
        };
        options.error = function(xhr, textStatus, errorThrown) {
            var container = extractContainer("", xhr, options);
            var allowed = fire('pjax:error', [xhr, textStatus, errorThrown, options]);
            if (options.type == 'GET' && textStatus !== 'abort' && allowed) {
                locationReplace(container.url)
            }
        };
        options.success = function(data, status, xhr) {
            var previousState = pjax.state;
            var currentVersion = (typeof $.pjax.defaults.version === 'function') ? $.pjax.defaults.version() : $.pjax.defaults.version;
            var latestVersion = xhr.getResponseHeader('X-PJAX-Version');
            var container = extractContainer(data, xhr, options);
            var url = parseURL(container.url);
            if (hash) {
                url.hash = hash;
                container.url = url.href
            }
            if (currentVersion && latestVersion && currentVersion !== latestVersion) {
                if (options.changeAddress) {
                    container.url = '/index.html';
                }
                locationReplace(container.url);
                return
            }
            if (!container.contents) {
                if (options.changeAddress) {
                    container.url = '/index.html';
                }
                locationReplace(container.url);
                return
            }
            pjax.state = {
                id: options.id || uniqueId(),
                url: container.url,
                title: container.title,
                container: context.selector,
                fragment: options.fragment,
                timeout: options.timeout
            };
            if (options.push || options.replace) {
                if (options.changeAddress) {
                    container.url = '/index.html';
                }
                window.history.replaceState(pjax.state, container.title, container.url)
            }
            var blurFocus = $.contains(options.container, document.activeElement);
            if (blurFocus) {
                try {
                    document.activeElement.blur()
                } catch (e) {}
            }
            if (container.title)
                document.title = container.title;
            fire('pjax:beforeReplace', [container.contents, options], {
                state: pjax.state,
                previousState: previousState
            });
            context.html(container.contents);
            var autofocusEl = context.find('input[autofocus], textarea[autofocus]').last()[0];
            if (autofocusEl && document.activeElement !== autofocusEl) {
                autofocusEl.focus()
            }
            executeScriptTags(context, container.scripts);
            var scrollTo = options.scrollTo;
            if (hash) {
                var name = decodeURIComponent(hash.slice(1));
                var target = document.getElementById(name) || document.getElementsByName(name)[0];
                if (target)
                    scrollTo = $(target).offset().top
            }
            if (typeof scrollTo == 'number')
                $(window).scrollTop(scrollTo);
            fire('pjax:success', [data, status, xhr, options])
        };
        if (!pjax.state) {
            pjax.state = {
                id: uniqueId(),
                url: window.location.href,
                title: document.title,
                container: context.selector,
                fragment: options.fragment,
                timeout: options.timeout
            };
            window.history.replaceState(pjax.state, document.title)
        }
        abortXHR(pjax.xhr);
        pjax.options = options;
        var xhr = pjax.xhr = $.ajax(options);
        if (xhr.readyState > 0) {
            if (options.push && !options.replace) {
                cachePush(pjax.state.id, cloneContents(context));
                if (options.changeAddress) { //是否修改地址
                    options.requestUrl = '/index.html';
                }
                window.history.pushState(null, "", options.requestUrl)
            }
            fire('pjax:start', [xhr, options]);
            fire('pjax:send', [xhr, options])
        }
        return pjax.xhr
    }

    function pjaxReload(container, options) {
        var defaults = {
            url: window.location.href,
            push: false,
            replace: true,
            scrollTo: false
        };
        return pjax($.extend(defaults, optionsFor(container, options)))
    }

    function locationReplace(url) {
        window.history.replaceState(null, "", pjax.state.url);
        window.location.replace(url)
    }
    var initialPop = true;
    var initialURL = window.location.href;
    var initialState = window.history.state;
    if (initialState && initialState.container) {
        pjax.state = initialState
    }
    if ('state' in window.history) {
        initialPop = false
    }

    function onPjaxPopstate(event) {
        if (!initialPop) {
            abortXHR(pjax.xhr)
        }
        var previousState = pjax.state;
        var state = event.state;
        var direction;
        if (state && state.container) {
            if (initialPop && initialURL == state.url)
                return;
            if (previousState) {
                if (previousState.id === state.id)
                    return;
                direction = previousState.id < state.id ? 'forward' : 'back'
            }
            var cache = cacheMapping[state.id] || [];
            var container = $(cache[0] || state.container),
                contents = cache[1];
            if (container.length) {
                if (previousState) {
                    cachePop(direction, previousState.id, cloneContents(container))
                }
                var popstateEvent = $.Event('pjax:popstate', {
                    state: state,
                    direction: direction
                });
                container.trigger(popstateEvent);
                var options = {
                    id: state.id,
                    url: state.url,
                    container: container,
                    push: false,
                    fragment: state.fragment,
                    timeout: state.timeout,
                    scrollTo: false
                };
                if (contents) {
                    container.trigger('pjax:start', [null, options]);
                    pjax.state = state;
                    if (state.title)
                        document.title = state.title;
                    var beforeReplaceEvent = $.Event('pjax:beforeReplace', {
                        state: state,
                        previousState: previousState
                    });
                    container.trigger(beforeReplaceEvent, [contents, options]);
                    container.html(contents);
                    container.trigger('pjax:end', [null, options])
                } else {
                    pjax(options)
                }
                container[0].offsetHeight
            } else {
                locationReplace(location.href)
            }
        }
        initialPop = false
    }

    function fallbackPjax(options) {
        var url = $.isFunction(options.url) ? options.url() : options.url,
            method = options.type ? options.type.toUpperCase() : 'GET';
        var form = $('<form>', {
            method: method === 'GET' ? 'GET' : 'POST',
            action: url,
            style: 'display:none'
        });
        if (method !== 'GET' && method !== 'POST') {
            form.append($('<input>', {
                type: 'hidden',
                name: '_method',
                value: method.toLowerCase()
            }))
        }
        var data = options.data;
        if (typeof data === 'string') {
            $.each(data.split('&'), function(index, value) {
                var pair = value.split('=');
                form.append($('<input>', {
                    type: 'hidden',
                    name: pair[0],
                    value: pair[1]
                }))
            })
        } else if ($.isArray(data)) {
            $.each(data, function(index, value) {
                form.append($('<input>', {
                    type: 'hidden',
                    name: value.name,
                    value: value.value
                }))
            })
        } else if (typeof data === 'object') {
            var key;
            for (key in data)
                form.append($('<input>', {
                    type: 'hidden',
                    name: key,
                    value: data[key]
                }))
        }
        $(document.body).append(form);
        form.submit()
    }

    function abortXHR(xhr) {
        if (xhr && xhr.readyState < 4) {
            xhr.onreadystatechange = $.noop;
            xhr.abort()
        }
    }

    function uniqueId() {
        return (new Date).getTime()
    }

    function cloneContents(container) {
        var cloned = container.clone();
        cloned.find('script').each(function() {
            if (!this.src)
                jQuery._data(this, 'globalEval', false)
        });
        return [container.selector, cloned.contents()]
    }

    function stripInternalParams(url) {
        url.search = url.search.replace(/([?&])(_pjax|_)=[^&]*/g, '');
        return url.href.replace(/\?($|#)/, '$1')
    }

    function parseURL(url) {
        var a = document.createElement('a');
        a.href = url;
        return a
    }

    function stripHash(location) {
        return location.href.replace(/#.*/, '')
    }

    function optionsFor(container, options) {
        if (container && options)
            options.container = container;
        else if ($.isPlainObject(container))
            options = container;
        else
        if (null != options.changeAddress) {
            var changeAddress = options.changeAddress;
            options = {
                changeAddress: changeAddress,
                container: container
            };
        } else {
            options = {
                container: container
            };
        }
        if (options.container)
            options.container = findContainerFor(options.container);
        return options
    }

    function findContainerFor(container) {
        container = $(container);
        if (!container.length) {
            throw "no pjax container for " + container.selector
        } else if (container.selector !== '' && container.context === document) {
            return container
        } else if (container.attr('id')) {
            return $('#' + container.attr('id'))
        } else {
            throw "cant get selector for pjax container!"
        }
    }

    function findAll(elems, selector) {
        return elems.filter(selector).add(elems.find(selector))
    }

    function parseHTML(html) {
        return $.parseHTML(html, document, true)
    }

    function extractContainer(data, xhr, options) {
        var obj = {},
            fullDocument = /<html/i.test(data);
        var serverUrl = xhr.getResponseHeader('X-PJAX-URL');
        obj.url = serverUrl ? stripInternalParams(parseURL(serverUrl)) : options.requestUrl;
        if (fullDocument) {
            var $head = $(parseHTML(data.match(/<head[^>]*>([\s\S.]*)<\/head>/i)[0]));
            var $body = $(parseHTML(data.match(/<body[^>]*>([\s\S.]*)<\/body>/i)[0]))
        } else {
            var $head = $body = $(parseHTML(data))
        }
        if ($body.length === 0)
            return obj;
        obj.title = findAll($head, 'title').first().text();
        if (options.fragment) {
            if (options.fragment === 'body') {
                var $fragment = $body
            } else {
                var $fragment = findAll($body, options.fragment).first()
            }
            if ($fragment.length) {
                obj.contents = options.fragment === 'body' ? $fragment : $fragment.contents();
                if (!obj.title)
                    obj.title = $fragment.attr('title') || $fragment.data('title')
            }
        } else if (!fullDocument) {
            obj.contents = $body
        }
        if (obj.contents) {
            obj.contents = obj.contents.not(function() {
                return $(this).is('title')
            });
            obj.contents = obj.contents.not(function() {
                return $(this).is('meta')
            });
            obj.contents.find('title').remove();
            obj.contents.find('meta').remove();
            //解决js缓存问题
            //obj.scripts = findAll(obj.contents, 'script[src]').remove();
            //obj.contents = obj.contents.not(obj.scripts)
        }
        if (obj.title)
            obj.title = $.trim(obj.title);
        return obj
    }

    function executeScriptTags(e, scripts) {
        pjaxWaiting.link = '';
        if (!scripts)
            return;
        var existingScripts = $('script[src]');
        pjaxWaiting.script = Array.isArray(scripts) ? scripts : scripts.toArray();
        scriptLoad(existingScripts, scripts);
        var timer = setInterval(function() {
            if (pjaxWaiting.script.length === 0) {
                clearInterval(timer);
                $.Event('pjax:callback');
                $(e).trigger('pjax:callback');
                if (pjaxWaiting.link !== '') {
                    pjax(pjaxWaiting.link)
                }
            }
        }, 5);
    }

    function scriptLoad(e, scripts) {
        var fn = arguments.callee;
        if (scripts.length === 0)
            return;
        $.each(scripts, function(i, n) {
            var $item = $(n),
                src = $item.prop('src'),
                deps = $item.data('deps');
            if (deps) {
                var waitLo = waitLoad(deps, pjaxWaiting.script);
                var len = scripts.length;
                if (waitLo !== 0) {
                    setTimeout(function() {
                        for (var v = 0; v < len; v++) {
                            if (scripts[0] === '')
                                scripts.splice(0, 1)
                        }
                        fn(e, scripts)
                    }, 5);
                    return false
                } else {
                    scripts.splice(i, 1, '')
                }
            } else {
                scripts.splice(i, 1, '')
            }
            var script = document.createElement('script');
            script.src = src;
            if (script.readyState) {
                script.onreadystatechange = function() {
                    if (script.readyState == "loaded" || script.readyState == "complete") {
                        script.onreadystatechange = null;
                        for (var f = 0; f < pjaxWaiting.script.length; f++) {
                            if (pjaxWaiting.script[f].src === this.src)
                                pjaxWaiting.script.splice(f, 1)
                        }
                    }
                }
            } else {
                script.onload = function() {
                    for (var f = 0; f < pjaxWaiting.script.length; f++) {
                        if (pjaxWaiting.script[f].src === this.src)
                            pjaxWaiting.script.splice(f, 1)
                    }
                }
            }
            document.head.appendChild(script)
        })
    }

    function waitLoad(deps, wait) {
        deps = deps.split(',');
        var unload = [];
        for (var i = 0; i < deps.length; i++) {
            for (var n = 0; n < wait.length; n++) {
                if (deps[i] === $(wait[n]).data('name'))
                    unload.push('wait')
            }
        }
        return unload.length
    }
    var cacheMapping = {};
    var cacheForwardStack = [];
    var cacheBackStack = [];

    function cachePush(id, value) {
        cacheMapping[id] = value;
        cacheBackStack.push(id);
        trimCacheStack(cacheForwardStack, 0);
        trimCacheStack(cacheBackStack, pjax.defaults.maxCacheLength)
    }

    function cachePop(direction, id, value) {
        var pushStack,
            popStack;
        cacheMapping[id] = value;
        if (direction === 'forward') {
            pushStack = cacheBackStack;
            popStack = cacheForwardStack
        } else {
            pushStack = cacheForwardStack;
            popStack = cacheBackStack
        }
        pushStack.push(id);
        if (id = popStack.pop())
            delete cacheMapping[id];
        trimCacheStack(pushStack, pjax.defaults.maxCacheLength)
    }

    function trimCacheStack(stack, length) {
        while (stack.length > length)
            delete cacheMapping[stack.shift()]
    }

    function findVersion() {
        return $('meta').filter(function() {
            var name = $(this).attr('http-equiv');
            return name && name.toUpperCase() === 'X-PJAX-VERSION'
        }).attr('content')
    }

    function enable() {
        $.fn.pjax = fnPjax;
        $.pjax = pjax;
        $.pjax.enable = $.noop;
        $.pjax.disable = disable;
        $.pjax.click = handleClick;
        $.pjax.submit = handleSubmit;
        $.pjax.reload = pjaxReload;
        $.pjax.defaults = {
            timeout: 650,
            push: true,
            replace: false,
            type: 'GET',
            dataType: 'html',
            scrollTo: 0,
            maxCacheLength: 20,
            version: findVersion
        };
        $(window).on('popstate.pjax', onPjaxPopstate)
    }

    function disable() {
        $.fn.pjax = function() {
            return this
        };
        $.pjax = fallbackPjax;
        $.pjax.enable = enable;
        $.pjax.disable = $.noop;
        $.pjax.click = $.noop;
        $.pjax.submit = $.noop;
        $.pjax.reload = function() {
            window.location.reload()
        };
        $(window).off('popstate.pjax', onPjaxPopstate)
    }
    if ($.inArray('state', $.event.props) < 0)
        $.event.props.push('state');
    $.support.pjax = window.history && window.history.pushState && window.history.replaceState && !navigator.userAgent.match(/((iPod|iPhone|iPad).+\bOS\s+[1-4]\D|WebApps\/.+CFNetwork)/);
    $.support.pjax ? enable() : disable()
})(jQuery);