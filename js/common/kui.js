/**** 
 * Module:jquery
 * Explain:拓展jquery
 * Last Modify:kangbolei 20171121
 *****/
(function($, window) {
    'use strict';

    /* Check jquery */
    if (typeof($) === 'undefined') throw new Error('KUI requires jQuery');

    // KUI shared object
    if (!$.kui) $.kui = function(obj) {
        if ($.isPlainObject(obj)) {
            $.extend($.kui, obj);
        }
    };

    var lastUuidAmend = 0;
    $.kui({
        uuid: function() {
            return (new Date()).getTime() * 1000 + (lastUuidAmend++) % 1000;
        },

        callEvent: function(func, event, proxy) {
            if ($.isFunction(func)) {
                if (proxy !== undefined) {
                    func = $.proxy(func, proxy);
                }
                var result = func(event);
                if (event) event.result = result;
                return !(result !== undefined && (!result));
            }
            return 1;
        },

        clientLang: function() {
            var lang;
            var config = window.config;
            if (typeof(config) != 'undefined' && config.clientLang) {
                lang = config.clientLang;
            }
            if (!lang) {
                var hl = $('html').attr('lang');
                lang = hl ? hl : (navigator.userLanguage || navigator.userLanguage || 'zh_cn');
            }
            return lang.replace('-', '_').toLowerCase();
        },

        strCode: function(str) {
            var code = 0;
            if (str && str.length) {
                for (var i = 0; i < str.length; ++i) {
                    code += i * str.charCodeAt(i);
                }
            }
            return code;
        }
    });

    $.fn.callEvent = function(name, event, model) {
        var $this = $(this);
        var dotIndex = name.indexOf('.kui.');
        var shortName = dotIndex < 0 ? name : name.substring(0, dotIndex);
        var e = $.Event(shortName, event);

        if ((model === undefined) && dotIndex > 0) {
            model = $this.data(name.substring(dotIndex + 1));
        }

        if (model && model.options) {
            var func = model.options[shortName];
            if ($.isFunction(func)) {
                $.kui.callEvent(func, e, model);
            }
        }
        $this.trigger(e);
        return e;
    };
}(jQuery, window));

/**** 
 * Module:Tree列表，导航
 * Explain:树形结构
 * Last Modify:kangbolei 20171122
 *****/
(function($) {
    'use strict';

    var name = 'kui.tree'; // modal name
    var globalId = 0;

    // The tree modal class
    var Tree = function(element, options) {
        this.name = name;
        this.$ = $(element);

        this.getOptions(options);
        this._init();
    };

    var DETAULT_ACTIONS = {
        sort: {
            template: '<a class="sort-handler" href="javascript:;"><i class="icon icon-move"></i></a>'
        },
        add: {
            template: '<a href="javascript:;"><i class="icon icon-plus"></i></a>'
        },
        edit: {
            template: '<a href="javascript:;"><i class="icon icon-pencil"></i></a>'
        },
        "delete": {
            template: '<a href="javascript:;"><i class="icon icon-trash"></i></a>'
        }
    };

    function formatActions(actions, parentActions) {
        if (actions === false) return actions;
        if (!actions) return parentActions;

        if (actions === true) {
            actions = { add: true, "delete": true, edit: true, sort: true };
        } else if (typeof actions === 'string') {
            actions = actions.split(',');
        }
        var _actions;
        if ($.isArray(actions)) {
            _actions = {};
            $.each(actions, function(idx, action) {
                if ($.isPlainObject(action)) {
                    _actions[action.action] = action;
                } else {
                    _actions[action] = true;
                }
            });
            actions = _actions;
        }
        if ($.isPlainObject(actions)) {
            _actions = {};
            $.each(actions, function(name, action) {
                if (action) {
                    _actions[name] = $.extend({ type: name }, DETAULT_ACTIONS[name], $.isPlainObject(action) ? action : null);
                } else {
                    _actions[name] = false;
                }
            });
            actions = _actions;
        }
        return parentActions ? $.extend(true, {}, parentActions, actions) : actions;
    }

    function createActionEle(action, name, template) {
        name = name || action.type;
        return $(template || action.template).addClass('tree-action').attr($.extend({ 'data-type': name, title: action.title || '' }, action.attr)).data('action', action);
    }

    // default options
    Tree.DEFAULTS = {
        animate: null,
        initialState: 'normal', // 'normal' | 'preserve' | 'expand' | 'collapse',
        toggleTemplate: '<i class="list-toggle fa"></i>',
        // sortable: false, //
    };

    Tree.prototype.add = function(rootEle, items, expand, disabledAnimate, notStore) {
        var $e = $(rootEle),
            $ul, options = this.options;
        if ($e.is('li')) {
            $ul = $e.children('ul');
            if (!$ul.length) {
                $ul = $('<ul/>');
                $e.append($ul);
                this._initList($ul, $e);
            }
        } else {
            $ul = $e;
        }

        if ($ul) {
            var that = this;
            if (!$.isArray(items)) {
                items = [items];
            }
            $.each(items, function(idx, item) {
                var $li = $('<li/>').data(item).appendTo($ul);
                if (item.id !== undefined) $li.attr('data-id', item.id);
                var $wrapper = options.itemWrapper ? $(options.itemWrapper === true ? '<div class="tree-item-wrapper"/>' : options.itemWrapper).appendTo($li) : $li;
                if (item.html) {
                    $wrapper.html(item.html)
                } else if ($.isFunction(that.options.itemCreator)) {
                    var itemContent = that.options.itemCreator($li, item);
                    if (itemContent !== true && itemContent !== false) $wrapper.html(itemContent);
                } else if (item.url) {
                    $wrapper.append($('<a/>', { href: item.url }).text(item.title || item.name));
                } else {
                    $wrapper.append($('<span/>').text(item.title || item.name));
                }
                that._initItem($li, item.idx || idx, $ul, item);
                if (item.children && item.children.length) {
                    that.add($li, item.children);
                }
            });
            this._initList($ul);
            if (expand && !$ul.hasClass('tree')) {
                that.expand($ul.parent('li'), disabledAnimate, notStore);
            }
        }
    };

    Tree.prototype.reload = function(data) {
        var that = this;

        if (data) {
            that.$.empty();
            that.add(that.$, data);
        }

        if (that.isPreserve) {
            if (that.store.time) {
                that.$.find('li:not(.tree-action-item)').each(function() {
                    var $li = $(this);
                    that[that.store[$li.data('id')] ? 'expand' : 'collapse']($li, true, true);
                });
            }
        }
    };

    Tree.prototype._initList = function($list, $parentItem, idx, data) {
        var that = this;
        if (!$list.hasClass('tree')) {
            $parentItem = ($parentItem || $list.closest('li')).addClass('has-list');
            if (!$parentItem.find('.list-toggle').length) {
                $parentItem.prepend(this.options.toggleTemplate);
            }
            idx = idx || $parentItem.data('idx');
        } else {
            idx = 0;
            $parentItem = null;
        }
        var $children = $list.attr('data-idx', idx || 0).children('li:not(.tree-action-item)').each(function(index) {
            that._initItem($(this), index + 1, $list);
        });
        if ($children.length === 1 && !$children.find('ul').length) {
            $children.addClass('tree-single-item');
        }
        data = data || ($parentItem ? $parentItem.data() : null);
        var actions = formatActions(data ? data.actions : null, this.actions);
        if (actions) {
            if (actions.add && actions.add.templateInList !== false) {
                var $actionItem = $list.children('li.tree-action-item');
                if (!$actionItem.length) {
                    $('<li class="tree-action-item"/>').append(createActionEle(actions.add, 'add', actions.add.templateInList)).appendTo($list);
                } else {
                    $actionItem.detach().appendTo($list);
                }
            }
            if (actions.sort) {
                $list.sortable($.extend({
                    dragCssClass: 'tree-drag-holder',
                    trigger: '.sort-handler',
                    selector: 'li:not(.tree-action-item)',
                    finish: function(e) {
                        that.callEvent('action', { action: actions.sort, $list: $list, target: e.target, item: data });
                    }
                }, actions.sort.options, $.isPlainObject(this.options.sortable) ? this.options.sortable : null));
            }
        }
        if ($parentItem && ($parentItem.hasClass('open') || (data && data.open))) {
            $parentItem.addClass('open in');
        }
    };

    Tree.prototype._initItem = function($item, idx, $parentList, data) {
        if (idx === undefined) {
            var $pre = $item.prev('li');
            idx = $pre.length ? ($pre.data('idx') + 1) : 1;
        }
        $parentList = $parentList || $item.closest('ul');
        $item.attr('data-idx', idx).removeClass('tree-single-item');
        if (!$item.data('id')) {
            var id = idx;
            if (!$parentList.hasClass('tree')) {
                id = $parentList.parent('li').data('id') + '-' + id;
            }
            $item.attr('data-id', id);
        }
        data = data || $item.data();
        var actions = formatActions(data.actions, this.actions);
        if (actions) {
            var $actions = $item.find('.tree-actions');
            if (!$actions.length) {
                $actions = $('<div class="tree-actions"/>').appendTo(this.options.itemWrapper ? $item.find('.tree-item-wrapper') : $item);
                $.each(actions, function(actionName, action) {
                    if (action) $actions.append(createActionEle(action, actionName));
                });
            }
        }

        var $children = $item.children('ul');
        if ($children.length) {
            this._initList($children, $item, idx, data);
        }
    };

    Tree.prototype._init = function() {
        var options = this.options,
            that = this;
        this.actions = formatActions(options.actions);

        this.$.addClass('tree');
        if (options.animate) this.$.addClass('tree-animate');

        this._initList(this.$);

        var initialState = options.initialState;
        var isPreserveEnable = $.kui && $.kui.store && $.kui.store.enable;
        if (isPreserveEnable) {
            this.selector = name + '::' + (options.name || '') + '#' + (this.$.attr('id') || globalId++);
            this.store = $.kui.store[options.name ? 'get' : 'pageGet'](this.selector, {});
        }
        if (initialState === 'preserve') {
            if (isPreserveEnable) this.isPreserve = true;
            else this.options.initialState = initialState = 'normal';
        }

        // init data
        this.reload(options.data);
        if (isPreserveEnable) this.isPreserve = true;

        if (initialState === 'expand') {
            this.expand();
        } else if (initialState === 'collapse') {
            this.collapse();
        }

        // 绑定事件（Bind event)
        this.$.on('click', '.list-toggle,a[href="#"],.tree-toggle', function(e) {
            var $this = $(this);
            var $li = $this.parent('li');
            that.callEvent('hit', { target: $li, item: $li.data() });
            that.toggle($li);
            if ($this.is('a')) e.preventDefault();
        }).on('click', '.tree-action', function() {
            var $action = $(this);
            var action = $action.data();
            if (action.action) action = action.action;
            if (action.type === 'sort') return;
            var $li = $action.closest('li:not(.tree-action-item)');
            that.callEvent('action', { action: action, target: this, $item: $li, item: $li.data() });
        });
    };

    Tree.prototype.preserve = function($li, id, expand) {
        if (!this.isPreserve) return;
        if ($li) {
            id = id || $li.data('id');
            expand = expand === undefined ? $li.hasClass('open') : false;
            if (expand) this.store[id] = expand;
            else delete this.store[id];
            this.store.time = new Date().getTime();
            $.kui.store[this.options.name ? 'set' : 'pageSet'](this.selector, this.store);
        } else {
            var that = this;
            this.store = {};
            this.$.find('li').each(function() {
                that.preserve($(this));
            });
        }
    };

    Tree.prototype.expand = function($li, disabledAnimate, notStore) {
        if ($li) {
            $li.addClass('open');
            if (!disabledAnimate && this.options.animate) {
                setTimeout(function() {
                    $li.addClass('in').slideDown("slow");
                }, 10);
            } else {
                $li.addClass('in');
            }
        } else {
            $li = this.$.find('li.has-list').addClass('open in');
        }
        if (!notStore) this.preserve($li);
        this.callEvent('expand', $li, this);
    };

    Tree.prototype.show = function($lis, disabledAnimate, notStore) {
        var that = this;
        $lis.each(function() {
            var $li = $(this);
            that.expand($li, disabledAnimate, notStore);
            if ($li) {
                var $ul = $li.parent('ul');
                while ($ul && $ul.length && !$ul.hasClass('tree')) {
                    var $parentLi = $ul.parent('li');
                    if ($parentLi.length) {
                        that.expand($parentLi, disabledAnimate, notStore);
                        $ul = $parentLi.parent('ul');
                    } else {
                        $ul = false;
                    }
                }
            }
        });
    };

    Tree.prototype.collapse = function($li, disabledAnimate, notStore) {
        if ($li) {
            if (!disabledAnimate && this.options.animate) {
                $li.removeClass('in');
                setTimeout(function() {
                    $li.removeClass('open');
                }, 300);
            } else {
                $li.removeClass('open in');
            }
        } else {
            $li = this.$.find('li.has-list').removeClass('open in');
        }
        if (!notStore) this.preserve($li);
        this.callEvent('collapse', $li, this);
    };

    Tree.prototype.toggle = function($li) {
        var collapse = ($li && $li.hasClass('open')) || $li === false || ($li === undefined && this.$.find('li.has-list.open').length);
        this[collapse ? 'collapse' : 'expand']($li);
    };

    // Get and init options
    Tree.prototype.getOptions = function(options) {
        this.options = $.extend({}, Tree.DEFAULTS, this.$.data(), options);
        if (this.options.animate === null && this.$.hasClass('tree-animate')) {
            this.options.animate = true;
        }
        if (null != this.options.initialstate) {
            this.options.initialState = this.options.initialstate;
        }
    };

    Tree.prototype.toData = function($ul, filter) {
        if ($.isFunction($ul)) {
            filter = $ul;
            $ul = null;
        }
        $ul = $ul || this.$;
        var that = this;
        return $ul.children('li:not(.tree-action-item)').map(function() {
            var $li = $(this);
            var data = $li.data();
            delete data['kui.droppable'];
            var $children = $li.children('ul');
            if ($children.length) data.children = that.toData($children);
            return $.isFunction(filter) ? filter(data, $li) : data;
        }).get();
    };

    // Call event helper
    Tree.prototype.callEvent = function(name, params) {
        var result;
        if ($.isFunction(this.options[name])) {
            result = this.options[name](params, this);
        }
        this.$.trigger($.Event(name + '.' + this.name, params));
        return result;
    };

    // Extense jquery element
    $.fn.tree = function(option, params) {
        return this.each(function() {
            var $this = $(this);
            var data = $this.data(name);
            var options = typeof option == 'object' && option;

            if (!data) $this.data(name, (data = new Tree(this, options)));

            if (typeof option == 'string') data[option](params);
        });
    };

    $.fn.tree.Constructor = Tree;

    // Auto call tree after document load complete
    $(function() {
        $('[data-ride="tree"]').tree();
    });
}(jQuery));


/**** 
 * Module:数据处理
 * Explain:前端本地存储
 * Last Modify:kangbolei 20171122
 *****/
(function(window, $) {
    'use strict';

    var lsName = 'localStorage';
    var storage,
        dataset,
        pageName = 'page_' + window.location.pathname + window.location.search;

    /* The Store object */
    var Store = function() {
        this.slience = true;
        try {
            if ((lsName in window) && window[lsName] && window[lsName].setItem) {
                this.enable = true;
                storage = window[lsName];
            }
        } catch (e) {}
        if (!this.enable) {
            dataset = {};
            storage = {
                getLength: function() {
                    var length = 0;
                    $.each(dataset, function() {
                        length++;
                    });
                    return length;
                },
                key: function(index) {
                    var key, i = 0;
                    $.each(dataset, function(k) {
                        if (i === index) {
                            key = k;
                            return false;
                        }
                        i++;
                    });
                    return key;
                },
                removeItem: function(key) {
                    delete dataset[key];
                },
                getItem: function(key) {
                    return dataset[key];
                },
                setItem: function(key, val) {
                    dataset[key] = val;
                },
                clear: function() {
                    dataset = {};
                }
            };
        }
        this.storage = storage;
        this.page = this.get(pageName, {});
    };

    /* Save page data */
    Store.prototype.pageSave = function() {
        if ($.isEmptyObject(this.page)) {
            this.remove(pageName);
        } else {
            var forDeletes = [],
                i;
            for (i in this.page) {
                var val = this.page[i];
                if (val === null)
                    forDeletes.push(i);
            }
            for (i = forDeletes.length - 1; i >= 0; i--) {
                delete this.page[forDeletes[i]];
            }
            this.set(pageName, this.page);
        }
    };

    /* Remove page data item */
    Store.prototype.pageRemove = function(key) {
        if (typeof this.page[key] != 'undefined') {
            this.page[key] = null;
            this.pageSave();
        }
    };

    /* Clear page data */
    Store.prototype.pageClear = function() {
        this.page = {};
        this.pageSave();
    };

    /* Get page data */
    Store.prototype.pageGet = function(key, defaultValue) {
        var val = this.page[key];
        return (defaultValue !== undefined && (val === null || val === undefined)) ? defaultValue : val;
    };

    /* Set page data */
    Store.prototype.pageSet = function(objOrKey, val) {
        if ($.isPlainObject(objOrKey)) {
            $.extend(true, this.page, objOrKey);
        } else {
            this.page[this.serialize(objOrKey)] = val;
        }
        this.pageSave();
    };

    /* Check enable status */
    Store.prototype.check = function() {
        if (!this.enable) {
            if (!this.slience) throw new Error('Browser not support localStorage or enable status been set true.');
        }
        return this.enable;
    };

    /* Get length */
    Store.prototype.length = function() {
        if (this.check()) {
            return storage.getLength ? storage.getLength() : storage.length;
        }
        return 0;
    };

    /* Remove item with browser localstorage native method */
    Store.prototype.removeItem = function(key) {
        storage.removeItem(key);
        return this;
    };

    /* Remove item with browser localstorage native method, same as removeItem */
    Store.prototype.remove = function(key) {
        return this.removeItem(key);
    };

    /* Get item value with browser localstorage native method, and without deserialize */
    Store.prototype.getItem = function(key) {
        return storage.getItem(key);
    };

    /* Get item value and deserialize it, if value is null and defaultValue been given then return defaultValue */
    Store.prototype.get = function(key, defaultValue) {
        var val = this.deserialize(this.getItem(key));
        if (typeof val === 'undefined' || val === null) {
            if (typeof defaultValue !== 'undefined') {
                return defaultValue;
            }
        }
        return val;
    };

    /* Get item key by index and deserialize it */
    Store.prototype.key = function(index) {
        return storage.key(index);
    };

    /* Set item value with browser localstorage native method, and without serialize filter */
    Store.prototype.setItem = function(key, val) {
        storage.setItem(key, val);
        return this;
    };

    /* Set item value, serialize it if the given value is not an string */
    Store.prototype.set = function(key, val) {
        if (val === undefined) return this.remove(key);
        this.setItem(key, this.serialize(val));
        return this;
    };

    /* Clear all items with browser localstorage native method */
    Store.prototype.clear = function() {
        storage.clear();
        return this;
    };

    /* Iterate all items with callback */
    Store.prototype.forEach = function(callback) {
        var length = this.length();
        for (var i = length - 1; i >= 0; i--) {
            var key = storage.key(i);
            callback(key, this.get(key));
        }
        return this;
    };

    /* Get all items and set value in an object. */
    Store.prototype.getAll = function() {
        var all = {};
        this.forEach(function(key, val) {
            all[key] = val;
        });

        return all;
    };

    /* Serialize value with JSON.stringify */
    Store.prototype.serialize = function(value) {
        if (typeof value === 'string') return value;
        return JSON.stringify(value);
    };

    /* Deserialize value, with JSON.parse if the given value is not a string */
    Store.prototype.deserialize = function(value) {
        if (typeof value !== 'string') return undefined;
        try {
            return JSON.parse(value);
        } catch (e) {
            return value || undefined;
        }
    };

    $.kui({
        store: new Store()
    });
}(window, jQuery));


/**** 
 * Module:导航
 * Explain:下拉列表
 * Last Modify:kangbolei 20171122
 *****/

+

function($) {
    'use strict';

    // DROPDOWN CLASS DEFINITION
    // =========================

    var kname = 'kui.dropdown';
    var backdrop = '.dropdown-backdrop'
    var toggle = '[data-toggle=dropdown]'
    var Dropdown = function(element) {
        var $el = $(element).on('click.' + kname, this.toggle)
    }

    Dropdown.prototype.toggle = function(e) {
        var $this = $(this)

        if ($this.is('.disabled, :disabled')) return

        var $parent = getParent($this)
        var isActive = $parent.hasClass('open')

        clearMenus()

        if (!isActive) {
            if ('ontouchstart' in document.documentElement && !$parent.closest('.navbar-nav').length) {
                // if mobile we we use a backdrop because click events don't delegate
                $('<div class="dropdown-backdrop"/>').insertAfter($(this)).on('click', clearMenus)
            }

            $parent.trigger(e = $.Event('show.' + kname))

            if (e.isDefaultPrevented()) return

            $parent
                .toggleClass('open')
                .trigger('shown.' + kname)

            $this.focus()
        }

        return false
    }

    Dropdown.prototype.keydown = function(e) {
        if (!/(38|40|27)/.test(e.keyCode)) return

        var $this = $(this)

        e.preventDefault()
        e.stopPropagation()

        if ($this.is('.disabled, :disabled')) return

        var $parent = getParent($this)
        var isActive = $parent.hasClass('open')

        if (!isActive || (isActive && e.keyCode == 27)) {
            if (e.which == 27) $parent.find(toggle).focus()
            return $this.click()
        }

        var $items = $('[role=menu] li:not(.divider):visible a', $parent)

        if (!$items.length) return

        var index = $items.index($items.filter(':focus'))

        if (e.keyCode == 38 && index > 0) index-- // up
            if (e.keyCode == 40 && index < $items.length - 1) index++ // down
                if (!~index) index = 0

        $items.eq(index).focus()
    }

    function clearMenus() {
        $(backdrop).remove()
        $(toggle).each(function(e) {
            var $parent = getParent($(this))
            if (!$parent.hasClass('open')) return
            $parent.trigger(e = $.Event('hide.' + kname))
            if (e.isDefaultPrevented()) return
            $parent.removeClass('open').trigger('hidden.' + kname)
        })
    }

    function getParent($this) {
        var selector = $this.attr('data-target')

        if (!selector) {
            selector = $this.attr('href')
            selector = selector && /#/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
        }
        var $parent;
        try {
            $parent = selector && $(selector);
        } catch (e) {}
        return $parent && $parent.length ? $parent : $this.parent()
    }


    // 下拉插件定义（dropdown plugin definition）
    // ==========================

    var old = $.fn.dropdown

    $.fn.dropdown = function(option) {
        return this.each(function() {
            var $this = $(this)
            var data = $this.data('dropdown')

            if (!data) $this.data('dropdown', (data = new Dropdown(this)))
            if (typeof option == 'string') data[option].call($this)
        })
    }

    $.fn.dropdown.Constructor = Dropdown


    // 无冲突（dropdown no conflict）
    // ====================

    $.fn.dropdown.noConflict = function() {
        $.fn.dropdown = old
        return this
    }


    // 适合标准下拉元素（apply to standard dropdown elements）
    // ===================================

    var apiName = kname + '.data-api'
    $(document)
        .on('click.' + apiName, clearMenus)
        .on('click.' + apiName, '.dropdown form', function(e) {
            e.stopPropagation()
        })
        .on('click.' + apiName, toggle, Dropdown.prototype.toggle)
        .on('keydown.' + apiName, toggle + ', [role=menu]', Dropdown.prototype.keydown)

}(window.jQuery);


+

function(a) {
    "use strict";

    function b(b) {
        return this.each(function() {
            var d = a(this),
                e = d.data("bs.button"),
                f = "object" == typeof b && b;
            e || d.data("bs.button", e = new c(this, f)),
                "toggle" == b ? e.toggle() : b && e.setState(b)
        })
    }
    var c = function(b, d) {
        this.$element = a(b),
            this.options = a.extend({},
                c.DEFAULTS, d),
            this.isLoading = !1
    };
    c.VERSION = "3.3.6",
        c.DEFAULTS = {
            loadingText: "loading..."
        },
        c.prototype.setState = function(b) {
            var c = "disabled",
                d = this.$element,
                e = d.is("input") ? "val" : "html",
                f = d.data();
            b += "Text",
                null == f.resetText && d.data("resetText", d[e]()),
                setTimeout(a.proxy(function() {
                        d[e](null == f[b] ? this.options[b] : f[b]),
                            "loadingText" == b ? (this.isLoading = !0, d.addClass(c).attr(c, c)) : this.isLoading && (this.isLoading = !1, d.removeClass(c).removeAttr(c))
                    },
                    this), 0)
        },
        c.prototype.toggle = function() {
            var a = !0,
                b = this.$element.closest('[data-toggle="buttons"]');
            if (b.length) {
                var c = this.$element.find("input");
                "radio" == c.prop("type") ? (c.prop("checked") && (a = !1), b.find(".active").removeClass("active"), this.$element.addClass("active")) : "checkbox" == c.prop("type") && (c.prop("checked") !== this.$element.hasClass("active") && (a = !1), this.$element.toggleClass("active")),
                    c.prop("checked", this.$element.hasClass("active")),
                    a && c.trigger("change")
            } else this.$element.attr("aria-pressed", !this.$element.hasClass("active")),
                this.$element.toggleClass("active")
        };
    var d = a.fn.button;
    a.fn.button = b,
        a.fn.button.Constructor = c,
        a.fn.button.noConflict = function() {
            return a.fn.button = d,
                this
        },
        a(document).on("click.bs.button.data-api", '[data-toggle^="button"]',
            function(c) {
                var d = a(c.target).closest(".btn");
                b.call(d, "toggle"),
                    a(c.target).is('input[type="radio"]') || a(c.target).is('input[type="checkbox"]') || (c.preventDefault(), d.is("input,button") ? d.trigger("focus") : d.find("input:visible,button:visible").first().trigger("focus"))
            }).on("focus.bs.button.data-api blur.bs.button.data-api", '[data-toggle^="button"]',
            function(b) {
                a(b.target).closest(".btn").toggleClass("focus", /^focus(in)?$/.test(b.type))
            })
}(jQuery);


/**
 * 上传表单相关事件
 */
(function(document, $) {
    'use strict';
    $(document)['on']("change", ".kui-input-group-file [type=file]", function() {
        var obj = $(this);
        var file = $(this)["parents"]('.kui-input-group-file')["find"](".kui-form-control");
        var title = '';
        $['each'](obj[0]['files'], function(i, item) {
            title += item["name"] + ', ';
        });
        title = title["substring"](0, title["length"] - 2);
        file["val"](title);
    });
}(document, jQuery));

/**
 * 无框上传表单相关事件
 */
(function(window, document, $) {
    'use strict';

    $('.form-material')["each"](function() {
        var fm = $(this);
        if (fm["data"]('material') === !![]) {
            return;
        }
        var fc = fm['find'](".kui-form-control");
        if (fc["attr"]("data-hint")) {
            fc['after']("<div class=hint>" + fc["attr"]("data-hint") + '</div>');
        }
        if (fm['hasClass']('floating')) {
            if (fc["hasClass"]("floating-label")) {
                var p = fc['attr']("placeholder");
                fc["attr"]("placeholder", null)["removeClass"]("floating-label");
                fc["after"]("<div class=floating-label>" + p + '</div>');
            }
            if (fc['val']() === null || fc["val"]() === "undefined" || fc["val"]() === '') {
                fc["addClass"]('empty');
            }
        }
        if (fc['next']()['is']("[type=file]")) {
            fm['addClass']('kui-form-material-file');
        }
        fm["data"]("material", !![]);
    });

    function temp(obj) {
        if (typeof obj["which"] === "undefined") {
            return !![];
        } else if (typeof obj['which'] === "number" && obj["which"] > 0x0) {
            return !obj["ctrlKey"] && !obj["metaKey"] && !obj["altKey"] && obj["which"] !== 0x8 && obj['which'] !== 0x9;
        }
        return ![];
    }
    $(document)['on']("keydown.site.material paste.site.material", ".kui-form-control", function(e) {
        if (temp(e)) {
            $(this)['removeClass']("empty");
        }
    })['on']("keyup.site.material change.site.material", ".kui-form-control", function() {
        var fc = $(this);
        if (fc["val"]() === '' && (typeof fc[0x0]["checkValidity"] !== "undefined" && fc[0x0]["checkValidity"]())) {
            fc['addClass']("empty");
        } else {
            fc['removeClass']("empty");
        }
    })['on']("focus", '.kui-form-material-file', function() {
        $(this)["find"]("input")["addClass"]('focus');
    })['on']("blur", ".kui-form-material-file", function() {
        $(this)["find"]("input")["removeClass"]('focus');
    })['on']("change", ".kui-form-material-file [type=file]", function() {
        var file = $(this);
        var value = '';
        $["each"](file[0x0]["files"], function(p, e) {
            value += e["name"] + ', ';
        });
        value = value["substring"](0x0, value["length"] - 0x2);
        if (value) {
            file['prev']()["removeClass"]("empty");
        } else {
            file["prev"]()['addClass']("empty");
        }
        file['prev']()["val"](value);
    });


}(window, document, jQuery));


/**
 * 页面选项卡
 */
(function(win, doc, $) {
    'use strict';
    $["kui"]["contentTabs"] = {
        '$instance': $(".kui-tree-menu"),
        'relative': 0,
        'init': function() {
            this['bind']();
            this["getPath"]();
        },
        'containerSize': function() {
            this["labelWidth"] = this["$label"]["width"]();
            this["view"] = this["$view"]["width"]();
        },
        'bind': function() {
            var _this = this,
                sc = $(".site-contabs"),
                ct = sc["find"]("ul.con-tabs"),
                li = this['$label'] = ct["find"]('li'),
                cs = this['$view'] = sc["find"](".contabs-scroll");
            this["containerSize"](li, cs);
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

            sc['on']("click.site.contabs", "button.pull-left", function() {
                _this["labelPosition"](ct, _this["labelWidth"], "right");
            })['on']("click.site.contabs", ".pull-right>.btn-icon", function() {
                var width = ct["width"]();
                _this["labelPosition"](ct, _this["labelWidth"], "left", _this["view"], width);
            })['on']("click.site.contabs", 'ul.con-tabs>li', function(e) {
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
                        'container': 'main',
                        'replace': !![]
                    });
                    $("title")["text"]($["trim"](target['text']()));
                }
            });
            sc['on']('click.site.contabs', ".pull-right li.reload-page", function() {
                var url = sc["find"]("ul.con-tabs>li.active>a")["attr"]("href");
                $["pjax"]({
                    'url': url,
                    'changeAddress': true,
                    'container': 'main',
                    'replace': !![]
                });
            })['on']('click.site.contabs', ".pull-right li.close-other", function() {
                sc["find"]("ul.con-tabs>li")["filter"](function() {
                    return !$(this)['is'](".active") && $(this)["index"]() !== 0;
                })["remove"]();
                ct["animate"]({
                    'left': 0
                }, 100);
                _this['btnView']("hide");
            })['on']('click.site.contabs', ".pull-right li.close-all", function() {
                var li = sc['find']("ul.con-tabs>li"),
                    url = li['eq'](0)["find"]('a')["attr"]("href");
                li["filter"](function() {
                    return $(this)["index"]() !== 0;
                })["remove"]();
                ct["animate"]({
                    'left': 0
                }, 100);
                _this["btnView"]("hide");
                $["pjax"]({
                    'url': url,
                    'fragment': "main",
                    'changeAddress': true,
                    'container': "main",
                    'replace': !![]
                });
                li['eq'](0)["addClass"]("active");
            });
            $(win)['on']("resize", this["resize"]);
        },
        'resize': function() {
            var sContabs = $(".site-contabs"),
                cTabs = sContabs["find"]("ul.con-tabs");
            $["kui"]['contentTabs']['throttle'](function() {
                $["kui"]['contentTabs']["view"] = sContabs["find"](".contabs-scroll")["width"]();
                $["kui"]["contentTabs"]["labelEvent"](cTabs, 'media');
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
                txt = $('main')["find"]('.kui-title')["text"]();
            if (pname !== $["ctx"] + '/') {
                this['buildTag']({
                    'name': txt,
                    'url': pname
                });
            }
            $("main")["find"]("title")["remove"]();
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
            cTabs['append']("<li class=\"active\"><a data-pjax=main " + fragment + " href=\"" + btag["url"] + "\" title=\"" + btag["name"] + "\" rel=\"contents\"><span>" + btag["name"] + "</span><i class=\"fa fa-close\"></i></a></li>");
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
            var sc = $(".site-contabs"),
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
                'container': 'main',
                'replace': !![]
            });
            this["$instance"]['find']("a[href='" + url + "']")["parent"]('li')['addClass']('active');
            $("title")["text"]($["trim"](title));
        },
        'btnView': function(display) {
            var sContabs = $(".site-contabs"),
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
/*文件输入组文件上传函数 */
(function(document, $) {
    'use strict';
    $(document)['on']("change", ".kui-input-group-file [type=file]", function() {
        var obj = $(this);
        var file = $(this)["parents"]('.kui-input-group-file')["find"](".kui-form-control");
        var title = '';
        $['each'](obj[0]['files'], function(i, item) {
            title += item["name"] + ', ';
        });
        title = title["substring"](0, title["length"] - 2);
        file["val"](title);
    });
}(document, jQuery));
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
                    opts.container = 'main';
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

//ajax访问远程资源模版
(function(document, $) {

    var kjax = function() {
        var template = null;
    };
    /**
     * 发送ajax请求
     * url--url
     * methodtype(post/get)
     * con (true(异步)|false(同步))
     * parameter(参数)
     * functionName(回调方法名，不需要引号,这里只有成功的时候才调用)
     * (注意：这方法有二个参数，一个就是xmlhttp,一个就是要处理的对象)
     * obj需要到回调方法中处理的对象
     */
    kjax.prototype.ajaxrequest = function(url, methodtype, con, parameter, functionName, obj) {
        var xmlhttp = this.getajaxHttp();
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4) {
                //HTTP响应已经完全接收才调用
                functionName(xmlhttp, obj);
            }
        };
        xmlhttp.open(methodtype, url, con);
        xmlhttp.send(parameter);
    };
    /**原生ajax系列-获取xmlHttp对象*/
    kjax.prototype.getajaxHttp = function() {
        var xmlHttp;
        try {
            // Firefox, Opera 8.0+, Safari
            xmlHttp = new XMLHttpRequest();
        } catch (e) {
            // Internet Explorer
            try {
                xmlHttp = new ActiveXObject("Msxml2.XMLHTTP");
            } catch (e) {
                try {
                    xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
                } catch (e) {
                    alert("您的浏览器不支持AJAX！");
                    return false;
                }
            }
        }
        return xmlHttp;
    };

    kjax.prototype.atemplate = function(target, template_id, template_url, template_data, template_div) {
        this.ajaxrequest(template_url, 'get', true, null, function(http, obj) {
            if (null == target) target = template_id;
            //编译模版
            $(template_div).html(http.responseText);
            if (template_data) {
                $(target).html(template(template_id, template_data));
            } else {
                $(target).html(template(template_id));
            }

        }, null);
    };


    $.kui({
        kjax: new kjax()
    });
})(document, jQuery);


/* ========================================================================
 * Bootstrap: tooltip.js v3.3.5
 * http://getbootstrap.com/javascript/#tooltip
 * Inspired by the original jQuery.tipsy by Jason Frame
 * ========================================================================
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+

function($) {
    'use strict';

    // TOOLTIP PUBLIC CLASS DEFINITION
    // ===============================

    var Tooltip = function(element, options) {
        this.type = null
        this.options = null
        this.enabled = null
        this.timeout = null
        this.hoverState = null
        this.$element = null
        this.inState = null

        this.init('tooltip', element, options)
    }

    Tooltip.VERSION = '3.3.5'

    Tooltip.TRANSITION_DURATION = 150

    Tooltip.DEFAULTS = {
        animation: true,
        placement: 'top',
        selector: false,
        template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
        trigger: 'hover focus',
        title: '',
        delay: 0,
        html: false,
        container: false,
        viewport: {
            selector: 'body',
            padding: 0
        }
    }

    Tooltip.prototype.init = function(type, element, options) {
        this.enabled = true
        this.type = type
        this.$element = $(element)
        this.options = this.getOptions(options)
        this.$viewport = this.options.viewport && $($.isFunction(this.options.viewport) ? this.options.viewport.call(this, this.$element) : (this.options.viewport.selector || this.options.viewport))
        this.inState = { click: false, hover: false, focus: false }

        if (this.$element[0] instanceof document.constructor && !this.options.selector) {
            throw new Error('`selector` option must be specified when initializing ' + this.type + ' on the window.document object!')
        }

        var triggers = this.options.trigger.split(' ')

        for (var i = triggers.length; i--;) {
            var trigger = triggers[i]

            if (trigger == 'click') {
                this.$element.on('click.' + this.type, this.options.selector, $.proxy(this.toggle, this))
            } else if (trigger != 'manual') {
                var eventIn = trigger == 'hover' ? 'mouseenter' : 'focusin'
                var eventOut = trigger == 'hover' ? 'mouseleave' : 'focusout'

                this.$element.on(eventIn + '.' + this.type, this.options.selector, $.proxy(this.enter, this))
                this.$element.on(eventOut + '.' + this.type, this.options.selector, $.proxy(this.leave, this))
            }
        }

        this.options.selector ?
            (this._options = $.extend({}, this.options, { trigger: 'manual', selector: '' })) :
            this.fixTitle()
    }

    Tooltip.prototype.getDefaults = function() {
        return Tooltip.DEFAULTS
    }

    Tooltip.prototype.getOptions = function(options) {
        options = $.extend({}, this.getDefaults(), this.$element.data(), options)

        if (options.delay && typeof options.delay == 'number') {
            options.delay = {
                show: options.delay,
                hide: options.delay
            }
        }

        return options
    }

    Tooltip.prototype.getDelegateOptions = function() {
        var options = {}
        var defaults = this.getDefaults()

        this._options && $.each(this._options, function(key, value) {
            if (defaults[key] != value) options[key] = value
        })

        return options
    }

    Tooltip.prototype.enter = function(obj) {
        var self = obj instanceof this.constructor ?
            obj : $(obj.currentTarget).data('bs.' + this.type)

        if (!self) {
            self = new this.constructor(obj.currentTarget, this.getDelegateOptions())
            $(obj.currentTarget).data('bs.' + this.type, self)
        }

        if (obj instanceof $.Event) {
            self.inState[obj.type == 'focusin' ? 'focus' : 'hover'] = true
        }

        if (self.tip().hasClass('in') || self.hoverState == 'in') {
            self.hoverState = 'in'
            return
        }

        clearTimeout(self.timeout)

        self.hoverState = 'in'

        if (!self.options.delay || !self.options.delay.show) return self.show()

        self.timeout = setTimeout(function() {
            if (self.hoverState == 'in') self.show()
        }, self.options.delay.show)
    }

    Tooltip.prototype.isInStateTrue = function() {
        for (var key in this.inState) {
            if (this.inState[key]) return true
        }

        return false
    }

    Tooltip.prototype.leave = function(obj) {
        var self = obj instanceof this.constructor ?
            obj : $(obj.currentTarget).data('bs.' + this.type)

        if (!self) {
            self = new this.constructor(obj.currentTarget, this.getDelegateOptions())
            $(obj.currentTarget).data('bs.' + this.type, self)
        }

        if (obj instanceof $.Event) {
            self.inState[obj.type == 'focusout' ? 'focus' : 'hover'] = false
        }

        if (self.isInStateTrue()) return

        clearTimeout(self.timeout)

        self.hoverState = 'out'

        if (!self.options.delay || !self.options.delay.hide) return self.hide()

        self.timeout = setTimeout(function() {
            if (self.hoverState == 'out') self.hide()
        }, self.options.delay.hide)
    }

    Tooltip.prototype.show = function() {
        var e = $.Event('show.bs.' + this.type)

        if (this.hasContent() && this.enabled) {
            this.$element.trigger(e)

            var inDom = $.contains(this.$element[0].ownerDocument.documentElement, this.$element[0])
            if (e.isDefaultPrevented() || !inDom) return
            var that = this

            var $tip = this.tip()

            var tipId = this.getUID(this.type)

            this.setContent()
            $tip.attr('id', tipId)
            this.$element.attr('aria-describedby', tipId)

            if (this.options.animation) $tip.addClass('fade')

            var placement = typeof this.options.placement == 'function' ?
                this.options.placement.call(this, $tip[0], this.$element[0]) :
                this.options.placement

            var autoToken = /\s?auto?\s?/i
            var autoPlace = autoToken.test(placement)
            if (autoPlace) placement = placement.replace(autoToken, '') || 'top'

            $tip
                .detach()
                .css({ top: 0, left: 0, display: 'block' })
                .addClass(placement)
                .data('bs.' + this.type, this)

            this.options.container ? $tip.appendTo(this.options.container) : $tip.insertAfter(this.$element)
            this.$element.trigger('inserted.bs.' + this.type)

            var pos = this.getPosition()
            var actualWidth = $tip[0].offsetWidth
            var actualHeight = $tip[0].offsetHeight

            if (autoPlace) {
                var orgPlacement = placement
                var viewportDim = this.getPosition(this.$viewport)

                placement = placement == 'bottom' && pos.bottom + actualHeight > viewportDim.bottom ? 'top' :
                    placement == 'top' && pos.top - actualHeight < viewportDim.top ? 'bottom' :
                    placement == 'right' && pos.right + actualWidth > viewportDim.width ? 'left' :
                    placement == 'left' && pos.left - actualWidth < viewportDim.left ? 'right' :
                    placement

                $tip
                    .removeClass(orgPlacement)
                    .addClass(placement)
            }

            var calculatedOffset = this.getCalculatedOffset(placement, pos, actualWidth, actualHeight)

            this.applyPlacement(calculatedOffset, placement)

            var complete = function() {
                var prevHoverState = that.hoverState
                that.$element.trigger('shown.bs.' + that.type)
                that.hoverState = null

                if (prevHoverState == 'out') that.leave(that)
            }

            $.support.transition && this.$tip.hasClass('fade') ?
                $tip
                .one('bsTransitionEnd', complete)
                .emulateTransitionEnd(Tooltip.TRANSITION_DURATION) :
                complete()
        }
    }

    Tooltip.prototype.applyPlacement = function(offset, placement) {
        var $tip = this.tip()
        var width = $tip[0].offsetWidth
        var height = $tip[0].offsetHeight

        // manually read margins because getBoundingClientRect includes difference
        var marginTop = parseInt($tip.css('margin-top'), 10)
        var marginLeft = parseInt($tip.css('margin-left'), 10)

        // we must check for NaN for ie 8/9
        if (isNaN(marginTop)) marginTop = 0
        if (isNaN(marginLeft)) marginLeft = 0

        offset.top += marginTop
        offset.left += marginLeft

        // $.fn.offset doesn't round pixel values
        // so we use setOffset directly with our own function B-0
        $.offset.setOffset($tip[0], $.extend({
            using: function(props) {
                $tip.css({
                    top: Math.round(props.top),
                    left: Math.round(props.left)
                })
            }
        }, offset), 0)

        $tip.addClass('in')

        // check to see if placing tip in new offset caused the tip to resize itself
        var actualWidth = $tip[0].offsetWidth
        var actualHeight = $tip[0].offsetHeight

        if (placement == 'top' && actualHeight != height) {
            offset.top = offset.top + height - actualHeight
        }

        var delta = this.getViewportAdjustedDelta(placement, offset, actualWidth, actualHeight)

        if (delta.left) offset.left += delta.left
        else offset.top += delta.top

        var isVertical = /top|bottom/.test(placement)
        var arrowDelta = isVertical ? delta.left * 2 - width + actualWidth : delta.top * 2 - height + actualHeight
        var arrowOffsetPosition = isVertical ? 'offsetWidth' : 'offsetHeight'

        $tip.offset(offset)
        this.replaceArrow(arrowDelta, $tip[0][arrowOffsetPosition], isVertical)
    }

    Tooltip.prototype.replaceArrow = function(delta, dimension, isVertical) {
        this.arrow()
            .css(isVertical ? 'left' : 'top', 50 * (1 - delta / dimension) + '%')
            .css(isVertical ? 'top' : 'left', '')
    }

    Tooltip.prototype.setContent = function() {
        var $tip = this.tip()
        var title = this.getTitle()

        $tip.find('.tooltip-inner')[this.options.html ? 'html' : 'text'](title)
        $tip.removeClass('fade in top bottom left right')
    }

    Tooltip.prototype.hide = function(callback) {
        var that = this
        var $tip = $(this.$tip)
        var e = $.Event('hide.bs.' + this.type)

        function complete() {
            if (that.hoverState != 'in') $tip.detach()
            that.$element
                .removeAttr('aria-describedby')
                .trigger('hidden.bs.' + that.type)
            callback && callback()
        }

        this.$element.trigger(e)

        if (e.isDefaultPrevented()) return

        $tip.removeClass('in')

        $.support.transition && $tip.hasClass('fade') ?
            $tip
            .one('bsTransitionEnd', complete)
            .emulateTransitionEnd(Tooltip.TRANSITION_DURATION) :
            complete()

        this.hoverState = null

        return this
    }

    Tooltip.prototype.fixTitle = function() {
        var $e = this.$element
        if ($e.attr('title') || typeof $e.attr('data-original-title') != 'string') {
            $e.attr('data-original-title', $e.attr('title') || '').attr('title', '')
        }
    }

    Tooltip.prototype.hasContent = function() {
        return this.getTitle()
    }

    Tooltip.prototype.getPosition = function($element) {
        $element = $element || this.$element

        var el = $element[0]
        var isBody = el.tagName == 'BODY'

        var elRect = el.getBoundingClientRect()
        if (elRect.width == null) {
            // width and height are missing in IE8, so compute them manually; see https://github.com/twbs/bootstrap/issues/14093
            elRect = $.extend({}, elRect, { width: elRect.right - elRect.left, height: elRect.bottom - elRect.top })
        }
        var elOffset = isBody ? { top: 0, left: 0 } : $element.offset()
        var scroll = { scroll: isBody ? document.documentElement.scrollTop || document.body.scrollTop : $element.scrollTop() }
        var outerDims = isBody ? { width: $(window).width(), height: $(window).height() } : null

        return $.extend({}, elRect, scroll, outerDims, elOffset)
    }

    Tooltip.prototype.getCalculatedOffset = function(placement, pos, actualWidth, actualHeight) {
        return placement == 'bottom' ? { top: pos.top + pos.height, left: pos.left + pos.width / 2 - actualWidth / 2 } :
            placement == 'top' ? { top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2 } :
            placement == 'left' ? { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth } :
            /* placement == 'right' */
            { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width }

    }

    Tooltip.prototype.getViewportAdjustedDelta = function(placement, pos, actualWidth, actualHeight) {
        var delta = { top: 0, left: 0 }
        if (!this.$viewport) return delta

        var viewportPadding = this.options.viewport && this.options.viewport.padding || 0
        var viewportDimensions = this.getPosition(this.$viewport)

        if (/right|left/.test(placement)) {
            var topEdgeOffset = pos.top - viewportPadding - viewportDimensions.scroll
            var bottomEdgeOffset = pos.top + viewportPadding - viewportDimensions.scroll + actualHeight
            if (topEdgeOffset < viewportDimensions.top) { // top overflow
                delta.top = viewportDimensions.top - topEdgeOffset
            } else if (bottomEdgeOffset > viewportDimensions.top + viewportDimensions.height) { // bottom overflow
                delta.top = viewportDimensions.top + viewportDimensions.height - bottomEdgeOffset
            }
        } else {
            var leftEdgeOffset = pos.left - viewportPadding
            var rightEdgeOffset = pos.left + viewportPadding + actualWidth
            if (leftEdgeOffset < viewportDimensions.left) { // left overflow
                delta.left = viewportDimensions.left - leftEdgeOffset
            } else if (rightEdgeOffset > viewportDimensions.right) { // right overflow
                delta.left = viewportDimensions.left + viewportDimensions.width - rightEdgeOffset
            }
        }

        return delta
    }

    Tooltip.prototype.getTitle = function() {
        var title
        var $e = this.$element
        var o = this.options

        title = $e.attr('data-original-title') ||
            (typeof o.title == 'function' ? o.title.call($e[0]) : o.title)

        return title
    }

    Tooltip.prototype.getUID = function(prefix) {
        do prefix += ~~(Math.random() * 1000000)
        while (document.getElementById(prefix))
        return prefix
    }

    Tooltip.prototype.tip = function() {
        if (!this.$tip) {
            this.$tip = $(this.options.template)
            if (this.$tip.length != 1) {
                throw new Error(this.type + ' `template` option must consist of exactly 1 top-level element!')
            }
        }
        return this.$tip
    }

    Tooltip.prototype.arrow = function() {
        return (this.$arrow = this.$arrow || this.tip().find('.tooltip-arrow'))
    }

    Tooltip.prototype.enable = function() {
        this.enabled = true
    }

    Tooltip.prototype.disable = function() {
        this.enabled = false
    }

    Tooltip.prototype.toggleEnabled = function() {
        this.enabled = !this.enabled
    }

    Tooltip.prototype.toggle = function(e) {
        var self = this
        if (e) {
            self = $(e.currentTarget).data('bs.' + this.type)
            if (!self) {
                self = new this.constructor(e.currentTarget, this.getDelegateOptions())
                $(e.currentTarget).data('bs.' + this.type, self)
            }
        }

        if (e) {
            self.inState.click = !self.inState.click
            if (self.isInStateTrue()) self.enter(self)
            else self.leave(self)
        } else {
            self.tip().hasClass('in') ? self.leave(self) : self.enter(self)
        }
    }

    Tooltip.prototype.destroy = function() {
        var that = this
        clearTimeout(this.timeout)
        this.hide(function() {
            that.$element.off('.' + that.type).removeData('bs.' + that.type)
            if (that.$tip) {
                that.$tip.detach()
            }
            that.$tip = null
            that.$arrow = null
            that.$viewport = null
        })
    }


    // TOOLTIP PLUGIN DEFINITION
    // =========================

    function Plugin(option) {
        return this.each(function() {
            var $this = $(this)
            var data = $this.data('bs.tooltip')
            var options = typeof option == 'object' && option

            if (!data && /destroy|hide/.test(option)) return
            if (!data) $this.data('bs.tooltip', (data = new Tooltip(this, options)))
            if (typeof option == 'string') data[option]()
        })
    }

    var old = $.fn.tooltip

    $.fn.tooltip = Plugin
    $.fn.tooltip.Constructor = Tooltip


    // TOOLTIP NO CONFLICT
    // ===================

    $.fn.tooltip.noConflict = function() {
        $.fn.tooltip = old
        return this
    }

}(jQuery);



/* ========================================================================
 * Bootstrap: modal.js v3.2.0
 * http://getbootstrap.com/javascript/#modals
 *
 * ZUI: The file has been changed in ZUI. It will not keep update with the
 * Bootsrap version in the future.
 * http://zui.sexy
 * ========================================================================
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ========================================================================
 * Updates in ZUI：
 * 1. changed event namespace to *.zui.modal
 * 2. added position option to ajust poisition of modal
 * 3. added event 'escaping.zui.modal' with an param 'esc' to judge the esc
 *    key down
 * 4. get moveable options value from '.modal-moveable' on '.modal-dialog'
 * 5. add setMoveable method to make modal dialog moveable
 * ======================================================================== */

+

function($) {
    'use strict';

    // MODAL CLASS DEFINITION
    // ======================

    var kuiname = 'kui.modal'
    var Modal = function(element, options) {
        this.options = options
        this.$body = $(document.body)
        this.$element = $(element)
        this.$backdrop =
            this.isShown = null
        this.scrollbarWidth = 0

        if (typeof this.options.moveable === 'undefined') {
            this.options.moveable = this.$element.hasClass('modal-moveable');
        }

        if (this.options.remote) {
            this.$element
                .find('.modal-content')
                .load(this.options.remote, $.proxy(function() {
                    this.$element.trigger('loaded.' + kuiname)
                }, this))
        }
    }

    Modal.VERSION = '3.2.0'

    Modal.TRANSITION_DURATION = 300
    Modal.BACKDROP_TRANSITION_DURATION = 150

    Modal.DEFAULTS = {
        backdrop: true,
        keyboard: true,
        show: true,
        // rememberPos: false,
        // moveable: false,
        position: 'fit' // 'center' or '40px' or '10%'
    }

    Modal.prototype.toggle = function(_relatedTarget, position) {
        return this.isShown ? this.hide() : this.show(_relatedTarget, position)
    }

    Modal.prototype.ajustPosition = function(position) {
        if (typeof position === 'undefined') position = this.options.position;
        if (typeof position === 'undefined') return;
        var $dialog = this.$element.find('.modal-dialog');
        // if($dialog.hasClass('modal-dragged')) return;

        var half = Math.max(0, ($(window).height() - $dialog.outerHeight()) / 2);
        var topPos = position == 'fit' ? (half * 2 / 3) : (position == 'center' ? half : position);
        if ($dialog.hasClass('modal-moveable')) {
            var pos = null;
            if (this.options.rememberPos) {
                if (this.options.rememberPos === true) {
                    pos = this.$element.data('modal-pos');
                } else if ($.zui.store) {
                    pos = $.zui.store.pageGet(kuiname + '.rememberPos');
                }
            }
            if (!pos) {
                pos = {
                    left: Math.max(0, ($(window).width() - $dialog.outerWidth()) / 2),
                    top: topPos
                };
            }
            $dialog.css(pos);
        } else {
            $dialog.css('margin-top', topPos);
        }
    }

    Modal.prototype.setMoveale = function() {
        if (!$.fn.draggable) console.error('Moveable modal requires draggable.js.');
        var that = this;
        var options = that.options;
        var $dialog = that.$element.find('.modal-dialog').removeClass('modal-dragged');
        $dialog.toggleClass('modal-moveable', options.moveable);

        if (!that.$element.data('modal-moveable-setup')) {
            $dialog.draggable({
                container: that.$element,
                handle: '.modal-header',
                before: function() {
                    $dialog.css('margin-top', '').addClass('modal-dragged');
                },
                finish: function(e) {
                    if (options.rememberPos) {
                        that.$element.data('modal-pos', e.pos);
                        if ($.zui.store && options.rememberPos !== true) {
                            $.zui.store.pageSet(kuiname + '.rememberPos', e.pos);
                        }
                    }
                }
            });
        }
    }

    Modal.prototype.show = function(_relatedTarget, position) {
        var that = this
        var e = $.Event('show.' + kuiname, {
            relatedTarget: _relatedTarget
        })

        that.$element.trigger(e)

        if (that.isShown || e.isDefaultPrevented()) return

        that.isShown = true

        if (that.options.moveable) that.setMoveale();

        that.checkScrollbar()
        that.$body.addClass('modal-open')

        that.setScrollbar()
        that.escape()

        that.$element.on('click.dismiss.' + kuiname, '[data-dismiss="modal"]', $.proxy(that.hide, that))

        that.backdrop(function() {
            var transition = $.support.transition && that.$element.hasClass('fade')

            if (!that.$element.parent().length) {
                that.$element.appendTo(that.$body) // don't move modals dom position
            }

            that.$element
                .show()
                .scrollTop(0)

            if (transition) {
                that.$element[0].offsetWidth // force reflow
            }

            that.$element
                .addClass('in')
                .attr('aria-hidden', false)

            that.ajustPosition(position);

            that.enforceFocus()

            var e = $.Event('shown.' + kuiname, {
                relatedTarget: _relatedTarget
            })

            transition ?
                that.$element.find('.modal-dialog') // wait for modal to slide in
                .one('bsTransitionEnd', function() {
                    that.$element.trigger('focus').trigger(e)
                })
                .emulateTransitionEnd(Modal.TRANSITION_DURATION) :
                that.$element.trigger('focus').trigger(e)
        })
    }

    Modal.prototype.hide = function(e) {
        if (e) e.preventDefault()

        e = $.Event('hide.' + kuiname)

        this.$element.trigger(e)

        if (!this.isShown || e.isDefaultPrevented()) return

        this.isShown = false

        this.$body.removeClass('modal-open')

        this.resetScrollbar()
        this.escape()

        $(document).off('focusin.' + kuiname)

        this.$element
            .removeClass('in')
            .attr('aria-hidden', true)
            .off('click.dismiss.' + kuiname)

        $.support.transition && this.$element.hasClass('fade') ?
            this.$element
            .one('bsTransitionEnd', $.proxy(this.hideModal, this))
            .emulateTransitionEnd(Modal.TRANSITION_DURATION) :
            this.hideModal()
    }

    Modal.prototype.enforceFocus = function() {
        $(document)
            .off('focusin.' + kuiname) // guard against infinite focus loop
            .on('focusin.' + kuiname, $.proxy(function(e) {
                if (this.$element[0] !== e.target && !this.$element.has(e.target).length) {
                    this.$element.trigger('focus')
                }
            }, this))
    }

    Modal.prototype.escape = function() {
        if (this.isShown && this.options.keyboard) {
            $(document).on('keydown.dismiss.' + kuiname, $.proxy(function(e) {
                if (e.which == 27) {
                    var et = $.Event('escaping.' + kuiname)
                    var result = this.$element.triggerHandler(et, 'esc')
                    if (result != undefined && (!result)) return
                    this.hide()
                }
            }, this))
        } else if (!this.isShown) {
            $(document).off('keydown.dismiss.' + kuiname)
        }
    }

    Modal.prototype.hideModal = function() {
        var that = this
        this.$element.hide()
        this.backdrop(function() {
            that.$element.trigger('hidden.' + kuiname)
        })
    }

    Modal.prototype.removeBackdrop = function() {
        this.$backdrop && this.$backdrop.remove()
        this.$backdrop = null
    }

    Modal.prototype.backdrop = function(callback) {
        var that = this
        var animate = this.$element.hasClass('fade') ? 'fade' : ''

        if (this.isShown && this.options.backdrop) {
            var doAnimate = $.support.transition && animate

            this.$backdrop = $('<div class="modal-backdrop ' + animate + '" />')
                .appendTo(this.$body)

            this.$element.on('mousedown.dismiss.' + kuiname, $.proxy(function(e) {
                if (e.target !== e.currentTarget) return
                this.options.backdrop == 'static' ? this.$element[0].focus.call(this.$element[0]) : this.hide.call(this)
            }, this))

            if (doAnimate) this.$backdrop[0].offsetWidth // force reflow

            this.$backdrop.addClass('in')

            if (!callback) return

            doAnimate ?
                this.$backdrop
                .one('bsTransitionEnd', callback)
                .emulateTransitionEnd(Modal.BACKDROP_TRANSITION_DURATION) :
                callback()

        } else if (!this.isShown && this.$backdrop) {
            this.$backdrop.removeClass('in')

            var callbackRemove = function() {
                that.removeBackdrop()
                callback && callback()
            }
            $.support.transition && this.$element.hasClass('fade') ?
                this.$backdrop
                .one('bsTransitionEnd', callbackRemove)
                .emulateTransitionEnd(Modal.BACKDROP_TRANSITION_DURATION) :
                callbackRemove()

        } else if (callback) {
            callback()
        }
    }

    Modal.prototype.checkScrollbar = function() {
        if (document.body.clientWidth >= window.innerWidth) return
        this.scrollbarWidth = this.scrollbarWidth || this.measureScrollbar()
    }

    Modal.prototype.setScrollbar = function() {
        var bodyPad = parseInt((this.$body.css('padding-right') || 0), 10)
        if (this.scrollbarWidth) this.$body.css('padding-right', bodyPad + this.scrollbarWidth)
    }

    Modal.prototype.resetScrollbar = function() {
        this.$body.css('padding-right', '')
    }

    Modal.prototype.measureScrollbar = function() { // thx walsh
        var scrollDiv = document.createElement('div')
        scrollDiv.className = 'modal-scrollbar-measure'
        this.$body.append(scrollDiv)
        var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth
        this.$body[0].removeChild(scrollDiv)
        return scrollbarWidth
    }


    // MODAL PLUGIN DEFINITION
    // =======================

    function Plugin(option, _relatedTarget, position) {
        return this.each(function() {
            var $this = $(this)
            var data = $this.data(kuiname)
            var options = $.extend({}, Modal.DEFAULTS, $this.data(), typeof option == 'object' && option)

            if (!data) $this.data(kuiname, (data = new Modal(this, options)))
            if (typeof option == 'string') data[option](_relatedTarget, position)
            else if (options.show) data.show(_relatedTarget, position)
        })
    }

    var old = $.fn.modal

    $.fn.modal = Plugin
    $.fn.modal.Constructor = Modal


    // MODAL NO CONFLICT
    // =================

    $.fn.modal.noConflict = function() {
        $.fn.modal = old
        return this
    }


    // MODAL DATA-API
    // ==============

    $(document).on('click.' + kuiname + '.data-api', '[data-toggle="modal"]', function(e) {
        var $this = $(this)
        var href = $this.attr('href')
        var $target = null
        try {
            // strip for ie7
            $target = $($this.attr('data-target') || (href && href.replace(/.*(?=#[^\s]+$)/, '')));
        } catch (ex) {
            return
        }
        if (!$target.length) return;
        var option = $target.data(kuiname) ? 'toggle' : $.extend({
            remote: !/#/.test(href) && href
        }, $target.data(), $this.data())

        if ($this.is('a')) e.preventDefault()

        $target.one('show.' + kuiname, function(showEvent) {
            // only register focus restorer if modal will actually get shown
            if (showEvent.isDefaultPrevented()) return
            $target.one('hidden.' + kuiname, function() {
                $this.is(':visible') && $this.trigger('focus')
            })
        })
        Plugin.call($target, option, this, $this.data('position'))
    })

}(jQuery);