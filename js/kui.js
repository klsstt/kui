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
            actions = {
                add: true,
                "delete": true,
                edit: true,
                sort: true
            };
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
                    _actions[name] = $.extend({
                        type: name
                    }, DETAULT_ACTIONS[name], $.isPlainObject(action) ? action : null);
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
        return $(template || action.template).addClass('tree-action').attr($.extend({
            'data-type': name,
            title: action.title || ''
        }, action.attr)).data('action', action);
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
                    $wrapper.append($('<a/>', {
                        href: item.url
                    }).text(item.title || item.name));
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
                        that.callEvent('action', {
                            action: actions.sort,
                            $list: $list,
                            target: e.target,
                            item: data
                        });
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
            that.callEvent('hit', {
                target: $li,
                item: $li.data()
            });
            that.toggle($li);
            if ($this.is('a')) e.preventDefault();
        }).on('click', '.tree-action', function() {
            var $action = $(this);
            var action = $action.data();
            if (action.action) action = action.action;
            if (action.type === 'sort') return;
            var $li = $action.closest('li:not(.tree-action-item)');
            that.callEvent('action', {
                action: action,
                target: this,
                $item: $li,
                item: $li.data()
            });
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
    //无参数
    kjax.prototype.atemplateUrl = function(template_url, template_id) {
        this.ajaxrequest(template_url, 'get', true, null, function(http, obj) {
            //编译模版
            $(template_id).html(http.responseText);
        }, null);
    };
    //注入参数
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



/**** 
 * Module:导航
 * Explain:面板
 * Last Modify:kangbolei 20171122
 *****/
(function(win, doc, $) {
    'use strict';
    $["kui"]["panel"] = {
        '$instance': $(".panel"),
        'init': function() {
            $(".panel")["each"](function() {
                var _this = $(this);
                var temp1 = false;
                var temp2 = false;
                var temp3 = false;
                var temp4 = false;
                var fullscreen = _this["find"]("[data-toggle=panel-fullscreen]");
                var collapse = _this["find"]("[data-toggle=panel-collapse]");
                var content;
                var _th = this;
                if (_this["hasClass"]("is-collapse")) {
                    temp3 = true;
                }
                var option = {
                    'load': function(html) {
                        var body = $(_this).find(".panel-body");
                        if (html) {
                            $(body).html(html);
                            console.log(body);
                        }
                    },
                    'done': function() {
                        if (temp4 === true) {
                            content["remove"]();
                            _this['removeClass']("is-loading");
                            _this["trigger"]("loading.done.uikit.panel");
                        }
                    },
                    'toggleContent': function() {
                        if (temp3) {
                            this["showContent"]();
                        } else {
                            this["hideContent"]();
                        }
                    },
                    'showContent': function() {
                        if (temp3 !== false) {
                            _this["removeClass"]('is-collapse');
                            if (collapse["hasClass"]("fa-plus")) {
                                collapse['removeClass']("fa-plus")["addClass"]("fa-minus");
                            }
                            _this["trigger"]("shown.uikit.panel");
                            temp3 = false;
                        }
                    },
                    'hideContent': function() {
                        if (temp3 !== true) {
                            _this["addClass"]("is-collapse");
                            if (collapse['hasClass']('fa-minus')) {
                                collapse["removeClass"]("fa-minus")["addClass"]('fa-plus');
                            }
                            _this["trigger"]("hidden.uikit.panel");
                            temp3 = true;
                        }
                    },
                    'toggleFullscreen': function() {
                        if (temp1) {
                            this['leaveFullscreen']();
                        } else {
                            this["enterFullscreen"]();
                        }
                    },
                    'enterFullscreen': function() {
                        if (temp1 !== true) {
                            _this['addClass']("is-fullscreen");
                            if (fullscreen["hasClass"]('fa-expand')) {
                                fullscreen["removeClass"]("fa-expand")["addClass"]("fa-compress");
                            }
                            _this['trigger']("enter.fullscreen.uikit.panel");
                            temp1 = true;
                        }
                    },
                    'leaveFullscreen': function() {
                        if (temp1 !== false) {
                            _this['removeClass']("is-fullscreen");
                            if (fullscreen["hasClass"]("fa-compress")) {
                                fullscreen['removeClass']("fa-compress")['addClass']("fa-expand");
                            }
                            _this["trigger"]("leave.fullscreen.uikit.panel");
                            temp1 = false;
                        }
                    },
                    'toggle': function() {
                        if (temp2) {
                            this["open"]();
                        } else {
                            this['close']();
                        }
                    },
                    'open': function() {
                        if (temp2 !== false) {
                            _this["removeClass"]("is-close");
                            _this["trigger"]('open.uikit.panel');
                            temp2 = false;
                        }
                    },
                    'close': function() {
                        if (temp2 !== true) {
                            _this["addClass"]("is-close");
                            _this["trigger"]("close.uikit.panel");
                            temp2 = true;
                        }
                    }
                };
                _this['data']("panel-api", option);
            });
        }
    };
}(window, document, jQuery));

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
        this.inState = {
            click: false,
            hover: false,
            focus: false
        }

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
            (this._options = $.extend({}, this.options, {
                trigger: 'manual',
                selector: ''
            })) :
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
                .css({
                    top: 0,
                    left: 0,
                    display: 'block'
                })
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
            elRect = $.extend({}, elRect, {
                width: elRect.right - elRect.left,
                height: elRect.bottom - elRect.top
            })
        }
        var elOffset = isBody ? {
            top: 0,
            left: 0
        } : $element.offset()
        var scroll = {
            scroll: isBody ? document.documentElement.scrollTop || document.body.scrollTop : $element.scrollTop()
        }
        var outerDims = isBody ? {
            width: $(window).width(),
            height: $(window).height()
        } : null

        return $.extend({}, elRect, scroll, outerDims, elOffset)
    }

    Tooltip.prototype.getCalculatedOffset = function(placement, pos, actualWidth, actualHeight) {
        return placement == 'bottom' ? {
                top: pos.top + pos.height,
                left: pos.left + pos.width / 2 - actualWidth / 2
            } :
            placement == 'top' ? {
                top: pos.top - actualHeight,
                left: pos.left + pos.width / 2 - actualWidth / 2
            } :
            placement == 'left' ? {
                top: pos.top + pos.height / 2 - actualHeight / 2,
                left: pos.left - actualWidth
            } :
            /* placement == 'right' */
            {
                top: pos.top + pos.height / 2 - actualHeight / 2,
                left: pos.left + pos.width
            }

    }

    Tooltip.prototype.getViewportAdjustedDelta = function(placement, pos, actualWidth, actualHeight) {
        var delta = {
            top: 0,
            left: 0
        }
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
 * Bootstrap: popover.js v3.3.6
 * http://getbootstrap.com/javascript/#popovers
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+

function($) {
    'use strict';

    // POPOVER PUBLIC CLASS DEFINITION
    // ===============================

    var Popover = function(element, options) {
        this.init('popover', element, options)
    }

    if (!$.fn.tooltip) throw new Error('Popover requires tooltip.js')

    Popover.VERSION = '3.3.6'

    Popover.DEFAULTS = $.extend({}, $.fn.tooltip.Constructor.DEFAULTS, {
        placement: 'right',
        trigger: 'click',
        content: '',
        template: '<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'
    })


    // NOTE: POPOVER EXTENDS tooltip.js
    // ================================

    Popover.prototype = $.extend({}, $.fn.tooltip.Constructor.prototype)

    Popover.prototype.constructor = Popover

    Popover.prototype.getDefaults = function() {
        return Popover.DEFAULTS
    }

    Popover.prototype.setContent = function() {
        var $tip = this.tip()
        var title = this.getTitle()
        var content = this.getContent()

        $tip.find('.popover-title')[this.options.html ? 'html' : 'text'](title)
        $tip.find('.popover-content').children().detach().end()[ // we use append for html objects to maintain js events
            this.options.html ? (typeof content == 'string' ? 'html' : 'append') : 'text'
        ](content)

        $tip.removeClass('fade top bottom left right in')

        // IE8 doesn't accept hiding via the `:empty` pseudo selector, we have to do
        // this manually by checking the contents.
        if (!$tip.find('.popover-title').html()) $tip.find('.popover-title').hide()
    }

    Popover.prototype.hasContent = function() {
        return this.getTitle() || this.getContent()
    }

    Popover.prototype.getContent = function() {
        var $e = this.$element
        var o = this.options

        return $e.attr('data-content') ||
            (typeof o.content == 'function' ?
                o.content.call($e[0]) :
                o.content)
    }

    Popover.prototype.arrow = function() {
        return (this.$arrow = this.$arrow || this.tip().find('.arrow'))
    }


    // POPOVER PLUGIN DEFINITION
    // =========================

    function Plugin(option) {
        return this.each(function() {
            var $this = $(this)
            var data = $this.data('bs.popover')
            var options = typeof option == 'object' && option

            if (!data && /destroy|hide/.test(option)) return
            if (!data) $this.data('bs.popover', (data = new Popover(this, options)))
            if (typeof option == 'string') data[option]()
        })
    }

    var old = $.fn.popover

    $.fn.popover = Plugin
    $.fn.popover.Constructor = Popover


    // POPOVER NO CONFLICT
    // ===================

    $.fn.popover.noConflict = function() {
        $.fn.popover = old
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

    var kuiname = 'kui.modal';
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
                } else if ($.kui.store) {
                    pos = $.kui.store.pageGet(kuiname + '.rememberPos');
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
                        if ($.kui.store && options.rememberPos !== true) {
                            $.kui.store.pageSet(kuiname + '.rememberPos', e.pos);
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


/* ========================================================================
 * Bootstrap: tab.js v3.3.6
 * http://getbootstrap.com/javascript/#tabs
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+

function($) {
    'use strict';

    // TAB CLASS DEFINITION
    // ====================

    var Tab = function(element) {
        // jscs:disable requireDollarBeforejQueryAssignment
        this.element = $(element)
            // jscs:enable requireDollarBeforejQueryAssignment
    }

    Tab.VERSION = '3.3.6'

    Tab.TRANSITION_DURATION = 150

    Tab.prototype.show = function() {
        var $this = this.element
        var $ul = $this.closest('ul:not(.dropdown-menu)')
        var selector = $this.data('target')

        if (!selector) {
            selector = $this.attr('href')
            selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') // strip for ie7
        }

        if ($this.parent('li').hasClass('active')) return

        var $previous = $ul.find('.active:last a')
        var hideEvent = $.Event('hide.bs.tab', {
            relatedTarget: $this[0]
        })
        var showEvent = $.Event('show.bs.tab', {
            relatedTarget: $previous[0]
        })

        $previous.trigger(hideEvent)
        $this.trigger(showEvent)

        if (showEvent.isDefaultPrevented() || hideEvent.isDefaultPrevented()) return

        var $target = $(selector)

        this.activate($this.closest('li'), $ul)
        this.activate($target, $target.parent(), function() {
            $previous.trigger({
                type: 'hidden.bs.tab',
                relatedTarget: $this[0]
            })
            $this.trigger({
                type: 'shown.bs.tab',
                relatedTarget: $previous[0]
            })
        })
    }

    Tab.prototype.activate = function(element, container, callback) {
        var $active = container.find('> .active')
        var transition = callback &&
            $.support.transition &&
            ($active.length && $active.hasClass('fade') || !!container.find('> .fade').length)

        function next() {
            $active
                .removeClass('active')
                .find('> .dropdown-menu > .active')
                .removeClass('active')
                .end()
                .find('[data-toggle="tab"]')
                .attr('aria-expanded', false)

            element
                .addClass('active')
                .find('[data-toggle="tab"]')
                .attr('aria-expanded', true)

            if (transition) {
                element[0].offsetWidth // reflow for transition
                element.addClass('in')
            } else {
                element.removeClass('fade')
            }

            if (element.parent('.dropdown-menu').length) {
                element
                    .closest('li.dropdown')
                    .addClass('active')
                    .end()
                    .find('[data-toggle="tab"]')
                    .attr('aria-expanded', true)
            }

            callback && callback()
        }

        $active.length && transition ?
            $active
            .one('bsTransitionEnd', next)
            .emulateTransitionEnd(Tab.TRANSITION_DURATION) :
            next()

        $active.removeClass('in')
    }


    // TAB PLUGIN DEFINITION
    // =====================

    function Plugin(option) {
        return this.each(function() {
            var $this = $(this)
            var data = $this.data('bs.tab')

            if (!data) $this.data('bs.tab', (data = new Tab(this)))
            if (typeof option == 'string') data[option]()
        })
    }

    var old = $.fn.tab

    $.fn.tab = Plugin
    $.fn.tab.Constructor = Tab


    // TAB NO CONFLICT
    // ===============

    $.fn.tab.noConflict = function() {
        $.fn.tab = old
        return this
    }


    // TAB DATA-API
    // ============

    var clickHandler = function(e) {
        e.preventDefault()
        Plugin.call($(this), 'show')
    }

    $(document)
        .on('click.bs.tab.data-api', '[data-toggle="tab"]', clickHandler)
        .on('click.bs.tab.data-api', '[data-toggle="pill"]', clickHandler)

}(jQuery);


/* ========================================================================
 * Bootstrap: alert.js v3.3.6
 * http://getbootstrap.com/javascript/#alerts
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+

function($) {
    'use strict';

    // ALERT CLASS DEFINITION
    // ======================

    var dismiss = '[data-dismiss="alert"]'
    var Alert = function(el) {
        $(el).on('click', dismiss, this.close)
    }

    Alert.VERSION = '3.3.6'

    Alert.TRANSITION_DURATION = 150

    Alert.prototype.close = function(e) {
        var $this = $(this)
        var selector = $this.attr('data-target')

        if (!selector) {
            selector = $this.attr('href')
            selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') // strip for ie7
        }

        var $parent = $(selector)

        if (e) e.preventDefault()

        if (!$parent.length) {
            $parent = $this.closest('.alert')
        }

        $parent.trigger(e = $.Event('close.bs.alert'))

        if (e.isDefaultPrevented()) return

        $parent.removeClass('in')

        function removeElement() {
            // detach from parent, fire event then clean up data
            $parent.detach().trigger('closed.bs.alert').remove()
        }

        $.support.transition && $parent.hasClass('fade') ?
            $parent
            .one('bsTransitionEnd', removeElement)
            .emulateTransitionEnd(Alert.TRANSITION_DURATION) :
            removeElement()
    }


    // ALERT PLUGIN DEFINITION
    // =======================

    function Plugin(option) {
        return this.each(function() {
            var $this = $(this)
            var data = $this.data('bs.alert')

            if (!data) $this.data('bs.alert', (data = new Alert(this)))
            if (typeof option == 'string') data[option].call($this)
        })
    }

    var old = $.fn.alert

    $.fn.alert = Plugin
    $.fn.alert.Constructor = Alert


    // ALERT NO CONFLICT
    // =================

    $.fn.alert.noConflict = function() {
        $.fn.alert = old
        return this
    }


    // ALERT DATA-API
    // ==============

    $(document).on('click.bs.alert.data-api', dismiss, Alert.prototype.close)

}(jQuery);


/* ========================================================================
 * Bootstrap: collapse.js v3.0.0
 * http://twbs.github.com/bootstrap/javascript.html#collapse
 * 
 * ZUI: The file has been changed in ZUI. It will not keep update with the
 * Bootsrap version in the future.
 * http://zui.sexy
 * ========================================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ======================================================================== */


+

function($) {
    'use strict';

    var kuiname = 'kui.collapse'

    // COLLAPSE PUBLIC CLASS DEFINITION
    // ================================

    var Collapse = function(element, options) {
        this.$element = $(element)
        this.options = $.extend({}, Collapse.DEFAULTS, options)
        this.transitioning = null

        if (this.options.parent) this.$parent = $(this.options.parent)
        if (this.options.toggle) this.toggle()
    }

    Collapse.DEFAULTS = {
        toggle: true
    }

    Collapse.prototype.dimension = function() {
        var hasWidth = this.$element.hasClass('width')
        return hasWidth ? 'width' : 'height'
    }

    Collapse.prototype.show = function() {
        if (this.transitioning || this.$element.hasClass('in')) return

        var startEvent = $.Event('show.' + kuiname)
        this.$element.trigger(startEvent)
        if (startEvent.isDefaultPrevented()) return

        var actives = this.$parent && this.$parent.find('.in')

        if (actives && actives.length) {
            var hasData = actives.data(kuiname)
            if (hasData && hasData.transitioning) return
            actives.collapse('hide')
            hasData || actives.data(kuiname, null)
        }

        var dimension = this.dimension()

        this.$element
            .removeClass('collapse')
            .addClass('collapsing')[dimension](0)

        this.transitioning = 1

        var complete = function() {
            this.$element
                .removeClass('collapsing')
                .addClass('in')[dimension]('auto')
            this.transitioning = 0
            this.$element.trigger('shown.' + kuiname)
        }

        if (!$.support.transition) return complete.call(this)

        var scrollSize = $.camelCase(['scroll', dimension].join('-'))

        this.$element
            .one($.support.transition.end, $.proxy(complete, this))
            .emulateTransitionEnd(350)[dimension](this.$element[0][scrollSize])
    }

    Collapse.prototype.hide = function() {
        if (this.transitioning || !this.$element.hasClass('in')) return

        var startEvent = $.Event('hide.' + kuiname)
        this.$element.trigger(startEvent)
        if (startEvent.isDefaultPrevented()) return

        var dimension = this.dimension()

        this.$element[dimension](this.$element[dimension]())[0].offsetHeight

        this.$element
            .addClass('collapsing')
            .removeClass('collapse')
            .removeClass('in')

        this.transitioning = 1

        var complete = function() {
            this.transitioning = 0
            this.$element
                .trigger('hidden.' + kuiname)
                .removeClass('collapsing')
                .addClass('collapse')
        }

        if (!$.support.transition) return complete.call(this)

        this.$element[dimension](0)
            .one($.support.transition.end, $.proxy(complete, this))
            .emulateTransitionEnd(350)
    }

    Collapse.prototype.toggle = function() {
        this[this.$element.hasClass('in') ? 'hide' : 'show']()
    }


    // COLLAPSE PLUGIN DEFINITION
    // ==========================

    var old = $.fn.collapse

    $.fn.collapse = function(option) {
        return this.each(function() {
            var $this = $(this)
            var data = $this.data(kuiname)
            var options = $.extend({}, Collapse.DEFAULTS, $this.data(), typeof option == 'object' && option)

            if (!data) $this.data(kuiname, (data = new Collapse(this, options)))
            if (typeof option == 'string') data[option]()
        })
    }

    $.fn.collapse.Constructor = Collapse


    // COLLAPSE NO CONFLICT
    // ====================

    $.fn.collapse.noConflict = function() {
        $.fn.collapse = old
        return this
    }


    // COLLAPSE DATA-API
    // =================

    $(document).on('click.' + kuiname + '.data-api', '[data-toggle=collapse]', function(e) {
        var $this = $(this),
            href
        var target = $this.attr('data-target') || e.preventDefault() || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '') //strip for ie7
        var $target = $(target)
        var data = $target.data(kuiname)
        var option = data ? 'toggle' : $this.data()
        var parent = $this.attr('data-parent')
        var $parent = parent && $(parent)

        if (!data || !data.transitioning) {
            if ($parent) $parent.find('[data-toggle=collapse][data-parent="' + parent + '"]').not($this).addClass('collapsed')
            $this[$target.hasClass('in') ? 'addClass' : 'removeClass']('collapsed')
        }

        $target.collapse(option)
    })

}(window.jQuery);

/* ========================================================================
 * Bootstrap: scrollspy.js v3.3.6
 * http://getbootstrap.com/javascript/#scrollspy
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+

function($) {
    'use strict';

    // SCROLLSPY CLASS DEFINITION
    // ==========================

    function ScrollSpy(element, options) {
        this.$body = $(document.body)
        this.$scrollElement = $(element).is(document.body) ? $(window) : $(element)
        this.options = $.extend({}, ScrollSpy.DEFAULTS, options)
        this.selector = (this.options.target || '') + ' .nav li > a'
        this.offsets = []
        this.targets = []
        this.activeTarget = null
        this.scrollHeight = 0

        this.$scrollElement.on('scroll.bs.scrollspy', $.proxy(this.process, this))
        this.refresh()
        this.process()
    }

    ScrollSpy.VERSION = '3.3.6'

    ScrollSpy.DEFAULTS = {
        offset: 10
    }

    ScrollSpy.prototype.getScrollHeight = function() {
        return this.$scrollElement[0].scrollHeight || Math.max(this.$body[0].scrollHeight, document.documentElement.scrollHeight)
    }

    ScrollSpy.prototype.refresh = function() {
        var that = this
        var offsetMethod = 'offset'
        var offsetBase = 0

        this.offsets = []
        this.targets = []
        this.scrollHeight = this.getScrollHeight()

        if (!$.isWindow(this.$scrollElement[0])) {
            offsetMethod = 'position'
            offsetBase = this.$scrollElement.scrollTop()
        }

        this.$body
            .find(this.selector)
            .map(function() {
                var $el = $(this)
                var href = $el.data('target') || $el.attr('href')
                var $href = /^#./.test(href) && $(href)

                return ($href &&
                    $href.length &&
                    $href.is(':visible') && [
                        [$href[offsetMethod]().top + offsetBase, href]
                    ]) || null
            })
            .sort(function(a, b) {
                return a[0] - b[0]
            })
            .each(function() {
                that.offsets.push(this[0])
                that.targets.push(this[1])
            })
    }

    ScrollSpy.prototype.process = function() {
        var scrollTop = this.$scrollElement.scrollTop() + this.options.offset
        var scrollHeight = this.getScrollHeight()
        var maxScroll = this.options.offset + scrollHeight - this.$scrollElement.height()
        var offsets = this.offsets
        var targets = this.targets
        var activeTarget = this.activeTarget
        var i

        if (this.scrollHeight != scrollHeight) {
            this.refresh()
        }

        if (scrollTop >= maxScroll) {
            return activeTarget != (i = targets[targets.length - 1]) && this.activate(i)
        }

        if (activeTarget && scrollTop < offsets[0]) {
            this.activeTarget = null
            return this.clear()
        }

        for (i = offsets.length; i--;) {
            activeTarget != targets[i] &&
                scrollTop >= offsets[i] &&
                (offsets[i + 1] === undefined || scrollTop < offsets[i + 1]) &&
                this.activate(targets[i])
        }
    }

    ScrollSpy.prototype.activate = function(target) {
        this.activeTarget = target

        this.clear()

        var selector = this.selector +
            '[data-target="' + target + '"],' +
            this.selector + '[href="' + target + '"]'

        var active = $(selector)
            .parents('li')
            .addClass('active')

        if (active.parent('.dropdown-menu').length) {
            active = active
                .closest('li.dropdown')
                .addClass('active')
        }

        active.trigger('activate.bs.scrollspy')
    }

    ScrollSpy.prototype.clear = function() {
        $(this.selector)
            .parentsUntil(this.options.target, '.active')
            .removeClass('active')
    }


    // SCROLLSPY PLUGIN DEFINITION
    // ===========================

    function Plugin(option) {
        return this.each(function() {
            var $this = $(this)
            var data = $this.data('bs.scrollspy')
            var options = typeof option == 'object' && option

            if (!data) $this.data('bs.scrollspy', (data = new ScrollSpy(this, options)))
            if (typeof option == 'string') data[option]()
        })
    }

    var old = $.fn.scrollspy

    $.fn.scrollspy = Plugin
    $.fn.scrollspy.Constructor = ScrollSpy


    // SCROLLSPY NO CONFLICT
    // =====================

    $.fn.scrollspy.noConflict = function() {
        $.fn.scrollspy = old
        return this
    }


    // SCROLLSPY DATA-API
    // ==================
    $["kui"]["scroll"] = {
        init: function() {
            $('[data-spy="scroll"]')["each"](function() {
                var $spy = $(this)
                Plugin.call($spy, $spy.data())
            })
        }
    };

    $(window).on('load.bs.scrollspy.data-api', function() {
        $('[data-spy="scroll"]').each(function() {
            var $spy = $(this)
            Plugin.call($spy, $spy.data())
        })
    })

}(jQuery);
/*!
 * Bootstrap Context Menu
 * Author: @sydcanem
 * https://github.com/sydcanem/bootstrap-contextmenu
 *
 * Inspired by Bootstrap's dropdown plugin.
 * Bootstrap (http://getbootstrap.com).
 *
 * Licensed under MIT
 * ========================================================= */
(function(b) {
    var a = '[data-toggle="context"]';
    var c = function(e, d) {
        this.$element = b(e);
        this.before = d.before || this.before;
        this.onItem = d.onItem || this.onItem;
        this.scopes = d.scopes || null;
        if (d.target) {
            this.$element.data("target", d.target)
        }
        this.listen()
    };
    c.prototype = {
        constructor: c,
        show: function(i) {
            var h, f, j, g, d = {
                relatedTarget: this,
                target: i.currentTarget
            };
            if (this.isDisabled()) {
                return
            }
            this.closemenu();
            if (this.before.call(this, i, b(i.currentTarget)) === false) {
                return
            }
            h = this.getMenu();
            h.trigger(f = b.Event("show.bs.context", d));
            j = this.getPosition(i, h);
            g = "li:not(.divider)";
            h.attr("style", "").css(j).addClass("open").on("click.context.data-api", g, b.proxy(this.onItem, this, b(i.currentTarget))).trigger("shown.bs.context", d);
            b("html").on("click.context.data-api", h.selector, b.proxy(this.closemenu, this));
            return false
        },
        closemenu: function(i) {
            var h, f, g, d;
            h = this.getMenu();
            if (!h.hasClass("open")) {
                return
            }
            d = {
                relatedTarget: this
            };
            h.trigger(f = b.Event("hide.bs.context", d));
            g = "li:not(.divider)";
            h.removeClass("open").off("click.context.data-api", g).trigger("hidden.bs.context", d);
            b("html").off("click.context.data-api", h.selector);
            if (i && b(i.target).closest("a").length === 0) {
                i.stopPropagation()
            }
        },
        keydown: function(d) {
            if (d.which == 27) {
                this.closemenu(d)
            }
        },
        before: function(d) {
            return true
        },
        onItem: function(d) {
            return true
        },
        listen: function() {
            this.$element.on("contextmenu.context.data-api", this.scopes, b.proxy(this.show, this));
            b("html").on("click.context.data-api", b.proxy(this.closemenu, this));
            b("html").on("keydown.context.data-api", b.proxy(this.keydown, this))
        },
        destroy: function() {
            this.$element.off(".context.data-api").removeData("context");
            b("html").off(".context.data-api")
        },
        isDisabled: function() {
            return this.$element.hasClass("disabled") || this.$element.attr("disabled")
        },
        getMenu: function() {
            var d = this.$element.data("target"),
                e;
            if (!d) {
                d = this.$element.attr("href");
                d = d && d.replace(/.*(?=#[^\s]*$)/, "")
            }
            e = b(d);
            return e && e.length ? e : this.$element.find(d)
        },
        getPosition: function(o, f) {
            var k = o.clientX,
                j = o.clientY,
                m = b(window).width(),
                l = b(window).height(),
                n = f.find(".dropdown-menu").outerWidth(),
                i = f.find(".dropdown-menu").outerHeight(),
                p = {
                    "position": "absolute",
                    "z-index": 9999
                },
                g, h, d;
            if (j + i > l) {
                g = {
                    "top": j - i + b(window).scrollTop()
                }
            } else {
                g = {
                    "top": j + b(window).scrollTop()
                }
            }
            if ((k + n > m) && ((k - n) > 0)) {
                h = {
                    "left": k - n + b(window).scrollLeft()
                }
            } else {
                h = {
                    "left": k + b(window).scrollLeft()
                }
            }
            d = f.offsetParent().offset();
            h.left = h.left - d.left;
            g.top = g.top - d.top;
            return b.extend(p, g, h)
        }
    };
    b.fn.contextmenu = function(d, f) {
        return this.each(function() {
            var h = b(this),
                g = h.data("context"),
                e = (typeof d == "object") && d;
            if (!g) {
                h.data("context", (g = new c(h, e)))
            }
            if (typeof d == "string") {
                g[d].call(g, f)
            }
        })
    };
    b.fn.contextmenu.Constructor = c;
    b(document).on("contextmenu.context.data-api", function() {
        b(a).each(function() {
            var d = b(this).data("context");
            if (!d) {
                return
            }
            d.closemenu()
        })
    }).on("contextmenu.context.data-api", a, function(d) {
        b(this).contextmenu("show", d);
        d.preventDefault();
        d.stopPropagation()
    })
}(jQuery));
/**
 * @author zhixin wen <wenzhixin2010@gmail.com>
 * version: 1.12.1
 * https://github.com/wenzhixin/bootstrap-table/
 */

(function($) {
    'use strict';

    // TOOLS DEFINITION
    // ======================

    var kuiVersion = 3;
    try {
        kuiVersion = parseInt($.fn.dropdown.Constructor.VERSION, 10);
        if (null == $.fn.dropdown.Constructor.VERSION) {
            kuiVersion = 4;
        }
    } catch (e) {}
    var bs = {
        3: {
            buttonsClass: 'default',
            iconsPrefix: 'glyphicon',
            icons: {
                paginationSwitchDown: 'glyphicon-collapse-down icon-chevron-down',
                paginationSwitchUp: 'glyphicon-collapse-up icon-chevron-up',
                refresh: 'glyphicon-refresh icon-refresh',
                toggleOff: 'glyphicon-list-alt icon-list-alt',
                toggleOn: 'glyphicon-list-alt icon-list-alt',
                columns: 'glyphicon-th icon-th',
                detailOpen: 'glyphicon-plus icon-plus',
                detailClose: 'glyphicon-minus icon-minus',
                fullscreen: 'glyphicon-fullscreen'
            },
            pullClass: 'pull',
            toobarDropdowHtml: ['<ul class="dropdown-menu" role="menu">', '</ul>'],
            toobarDropdowItemHtml: '<li role="menuitem"><label>%s</label></li>',
            pageDropdownHtml: ['<ul class="dropdown-menu" role="menu">', '</ul>'],
            pageDropdownItemHtml: '<li role="menuitem" class="%s"><a href="#">%s</a></li>'
        },
        4: {
            buttonsClass: 'secondary',
            iconsPrefix: 'fa',
            icons: {
                paginationSwitchDown: 'fa-toggle-down',
                paginationSwitchUp: 'fa-toggle-up',
                refresh: 'fa-refresh',
                toggle: 'fa-toggle-off',
                toggleOff: 'fa-toggle-off',
                toggleOn: 'fa-toggle-on',
                columns: 'fa-th-list',
                detailOpen: 'fa-plus',
                detailClose: 'fa-minus',
                fullscreen: 'fa-arrows-alt'
            },
            pullClass: 'float',
            toobarDropdowHtml: ['<div class="dropdown-menu dropdown-menu-right">', '</div>'],
            toobarDropdowItemHtml: '<label class="dropdown-item">%s</label>',
            pageDropdownHtml: ['<div class="dropdown-menu">', '</div>'],
            pageDropdownItemHtml: '<a class="dropdown-item %s" href="#">%s</a>'
        }
    }[kuiVersion];

    var cachedWidth = null;

    // it only does '%s', and return '' when arguments are undefined
    var sprintf = function(str) {
        var args = arguments,
            flag = true,
            i = 1;

        str = str.replace(/%s/g, function() {
            var arg = args[i++];

            if (typeof arg === 'undefined') {
                flag = false;
                return '';
            }
            return arg;
        });
        return flag ? str : '';
    };

    var getPropertyFromOther = function(list, from, to, value) {
        var result = '';
        $.each(list, function(i, item) {
            if (item[from] === value) {
                result = item[to];
                return false;
            }
            return true;
        });
        return result;
    };

    // http://jsfiddle.net/wenyi/47nz7ez9/3/
    var setFieldIndex = function(columns) {
        var i, j, k,
            totalCol = 0,
            flag = [];

        for (i = 0; i < columns[0].length; i++) {
            totalCol += columns[0][i].colspan || 1;
        }

        for (i = 0; i < columns.length; i++) {
            flag[i] = [];
            for (j = 0; j < totalCol; j++) {
                flag[i][j] = false;
            }
        }

        for (i = 0; i < columns.length; i++) {
            for (j = 0; j < columns[i].length; j++) {
                var r = columns[i][j],
                    rowspan = r.rowspan || 1,
                    colspan = r.colspan || 1,
                    index = $.inArray(false, flag[i]);

                if (colspan === 1) {
                    r.fieldIndex = index;
                    // when field is undefined, use index instead
                    if (typeof r.field === 'undefined') {
                        r.field = index;
                    }
                }

                for (k = 0; k < rowspan; k++) {
                    flag[i + k][index] = true;
                }
                for (k = 0; k < colspan; k++) {
                    flag[i][index + k] = true;
                }
            }
        }
    };

    var getScrollBarWidth = function() {
        if (cachedWidth === null) {
            var inner = $('<p/>').addClass('fixed-table-scroll-inner'),
                outer = $('<div/>').addClass('fixed-table-scroll-outer'),
                w1, w2;

            outer.append(inner);
            $('body').append(outer);

            w1 = inner[0].offsetWidth;
            outer.css('overflow', 'scroll');
            w2 = inner[0].offsetWidth;

            if (w1 === w2) {
                w2 = outer[0].clientWidth;
            }

            outer.remove();
            cachedWidth = w1 - w2;
        }
        return cachedWidth;
    };

    var calculateObjectValue = function(self, name, args, defaultValue) {
        var func = name;

        if (typeof name === 'string') {
            // support obj.func1.func2
            var names = name.split('.');

            if (names.length > 1) {
                func = window;
                $.each(names, function(i, f) {
                    func = func[f];
                });
            } else {
                func = window[name];
            }
        }
        if (typeof func === 'object') {
            return func;
        }
        if (typeof func === 'function') {
            return func.apply(self, args || []);
        }
        if (!func && typeof name === 'string' && sprintf.apply(this, [name].concat(args))) {
            return sprintf.apply(this, [name].concat(args));
        }
        return defaultValue;
    };

    var compareObjects = function(objectA, objectB, compareLength) {
        // Create arrays of property names
        var getOwnPropertyNames = Object.getOwnPropertyNames || function(obj) {
            var arr = [];
            for (var k in obj) {
                if (obj.hasOwnProperty(k)) {
                    arr.push(k);
                }
            }
            return arr;
        };
        var objectAProperties = getOwnPropertyNames(objectA),
            objectBProperties = getOwnPropertyNames(objectB),
            propName = '';

        if (compareLength) {
            // If number of properties is different, objects are not equivalent
            if (objectAProperties.length !== objectBProperties.length) {
                return false;
            }
        }

        for (var i = 0; i < objectAProperties.length; i++) {
            propName = objectAProperties[i];

            // If the property is not in the object B properties, continue with the next property
            if ($.inArray(propName, objectBProperties) > -1) {
                // If values of same property are not equal, objects are not equivalent
                if (objectA[propName] !== objectB[propName]) {
                    return false;
                }
            }
        }

        // If we made it this far, objects are considered equivalent
        return true;
    };

    var escapeHTML = function(text) {
        if (typeof text === 'string') {
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;')
                .replace(/`/g, '&#x60;');
        }
        return text;
    };

    var getRealDataAttr = function(dataAttr) {
        for (var attr in dataAttr) {
            var auxAttr = attr.split(/(?=[A-Z])/).join('-').toLowerCase();
            if (auxAttr !== attr) {
                dataAttr[auxAttr] = dataAttr[attr];
                delete dataAttr[attr];
            }
        }

        return dataAttr;
    };

    var getItemField = function(item, field, escape) {
        var value = item;

        if (typeof field !== 'string' || item.hasOwnProperty(field)) {
            return escape ? escapeHTML(item[field]) : item[field];
        }
        var props = field.split('.');
        for (var p in props) {
            if (props.hasOwnProperty(p)) {
                value = value && value[props[p]];
            }
        }
        return escape ? escapeHTML(value) : value;
    };

    var isIEBrowser = function() {
        return !!(navigator.userAgent.indexOf("MSIE ") > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./));
    };

    var objectKeys = function() {
        // From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
        if (!Object.keys) {
            Object.keys = (function() {
                var hasOwnProperty = Object.prototype.hasOwnProperty,
                    hasDontEnumBug = !({
                        toString: null
                    }).propertyIsEnumerable('toString'),
                    dontEnums = [
                        'toString',
                        'toLocaleString',
                        'valueOf',
                        'hasOwnProperty',
                        'isPrototypeOf',
                        'propertyIsEnumerable',
                        'constructor'
                    ],
                    dontEnumsLength = dontEnums.length;

                return function(obj) {
                    if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
                        throw new TypeError('Object.keys called on non-object');
                    }

                    var result = [],
                        prop, i;

                    for (prop in obj) {
                        if (hasOwnProperty.call(obj, prop)) {
                            result.push(prop);
                        }
                    }

                    if (hasDontEnumBug) {
                        for (i = 0; i < dontEnumsLength; i++) {
                            if (hasOwnProperty.call(obj, dontEnums[i])) {
                                result.push(dontEnums[i]);
                            }
                        }
                    }
                    return result;
                };
            }());
        }
    };

    // BOOTSTRAP TABLE CLASS DEFINITION
    // ======================

    var KuiTable = function(el, options) {
        this.options = options;
        this.$el = $(el);
        this.$el_ = this.$el.clone();
        this.timeoutId_ = 0;
        this.timeoutFooter_ = 0;

        this.init();
    };

    KuiTable.DEFAULTS = {
        classes: 'table table-hover',
        sortClass: undefined,
        locale: undefined,
        height: undefined,
        undefinedText: '-',
        sortName: undefined,
        sortOrder: 'asc',
        sortStable: false,
        rememberOrder: false,
        striped: false,
        columns: [
            []
        ],
        data: [],
        totalField: 'total',
        dataField: 'rows',
        method: 'get',
        url: undefined,
        ajax: undefined,
        cache: true,
        contentType: 'application/json',
        dataType: 'json',
        ajaxOptions: {},
        queryParams: function(params) {
            return params;
        },
        queryParamsType: 'limit', // undefined
        responseHandler: function(res) {
            return res;
        },
        pagination: false,
        onlyInfoPagination: false,
        paginationLoop: true,
        sidePagination: 'client', // client or server
        totalRows: 0, // server side need to set
        pageNumber: 1,
        pageSize: 10,
        pageList: [10, 25, 50, 100],
        paginationHAlign: 'right', //right, left
        paginationVAlign: 'bottom', //bottom, top, both
        paginationDetailHAlign: 'left', //right, left
        paginationPreText: '&lsaquo;',
        paginationNextText: '&rsaquo;',
        search: false,
        searchOnEnterKey: false,
        strictSearch: false,
        searchAlign: 'right',
        selectItemName: 'btSelectItem',
        showHeader: true,
        showFooter: false,
        showColumns: false,
        showPaginationSwitch: false,
        showRefresh: false,
        showToggle: false,
        showFullscreen: false,
        smartDisplay: true,
        escape: false,
        minimumCountColumns: 1,
        idField: undefined,
        uniqueId: undefined,
        cardView: false,
        detailView: false,
        detailFormatter: function(index, row) {
            return '';
        },
        detailFilter: function(index, row) {
            return true;
        },
        trimOnSearch: true,
        clickToSelect: false,
        singleSelect: false,
        toolbar: undefined,
        toolbarAlign: 'left',
        buttonsToolbar: undefined,
        buttonsAlign: 'right',
        checkboxHeader: true,
        sortable: true,
        silentSort: true,
        maintainSelected: false,
        searchTimeOut: 500,
        searchText: '',
        iconSize: undefined,
        buttonsClass: bs.buttonsClass,
        iconsPrefix: bs.iconsPrefix, // glyphicon or fa (font awesome)
        icons: bs.icons,

        customSearch: $.noop,

        customSort: $.noop,

        ignoreClickToSelectOn: function(element) {
            return $.inArray(element.tagName, ['A', 'BUTTON']);
        },

        rowStyle: function(row, index) {
            return {};
        },

        rowAttributes: function(row, index) {
            return {};
        },

        footerStyle: function(row, index) {
            return {};
        },

        onAll: function(name, args) {
            return false;
        },
        onClickCell: function(field, value, row, $element) {
            return false;
        },
        onDblClickCell: function(field, value, row, $element) {
            return false;
        },
        onClickRow: function(item, $element) {
            return false;
        },
        onDblClickRow: function(item, $element) {
            return false;
        },
        onSort: function(name, order) {
            return false;
        },
        onCheck: function(row) {
            return false;
        },
        onUncheck: function(row) {
            return false;
        },
        onCheckAll: function(rows) {
            return false;
        },
        onUncheckAll: function(rows) {
            return false;
        },
        onCheckSome: function(rows) {
            return false;
        },
        onUncheckSome: function(rows) {
            return false;
        },
        onLoadSuccess: function(data) {
            return false;
        },
        onLoadError: function(status) {
            return false;
        },
        onColumnSwitch: function(field, checked) {
            return false;
        },
        onPageChange: function(number, size) {
            return false;
        },
        onSearch: function(text) {
            return false;
        },
        onToggle: function(cardView) {
            return false;
        },
        onPreBody: function(data) {
            return false;
        },
        onPostBody: function() {
            return false;
        },
        onPostHeader: function() {
            return false;
        },
        onExpandRow: function(index, row, $detail) {
            return false;
        },
        onCollapseRow: function(index, row) {
            return false;
        },
        onRefreshOptions: function(options) {
            return false;
        },
        onRefresh: function(params) {
            return false;
        },
        onResetView: function() {
            return false;
        },
        onScrollBody: function() {
            return false;
        }
    };

    KuiTable.LOCALES = {};

    KuiTable.LOCALES['en-US'] = KuiTable.LOCALES.en = {
        formatLoadingMessage: function() {
            return 'Loading, please wait...';
        },
        formatRecordsPerPage: function(pageNumber) {
            return sprintf('%s rows per page', pageNumber);
        },
        formatShowingRows: function(pageFrom, pageTo, totalRows) {
            return sprintf('Showing %s to %s of %s rows', pageFrom, pageTo, totalRows);
        },
        formatDetailPagination: function(totalRows) {
            return sprintf('Showing %s rows', totalRows);
        },
        formatSearch: function() {
            return 'Search';
        },
        formatNoMatches: function() {
            return 'No matching records found';
        },
        formatPaginationSwitch: function() {
            return 'Hide/Show pagination';
        },
        formatRefresh: function() {
            return 'Refresh';
        },
        formatToggle: function() {
            return 'Toggle';
        },
        formatFullscreen: function() {
            return 'Fullscreen';
        },
        formatColumns: function() {
            return 'Columns';
        },
        formatAllRows: function() {
            return 'All';
        }
    };

    $.extend(KuiTable.DEFAULTS, KuiTable.LOCALES['en-US']);

    KuiTable.COLUMN_DEFAULTS = {
        radio: false,
        checkbox: false,
        checkboxEnabled: true,
        field: undefined,
        title: undefined,
        titleTooltip: undefined,
        'class': undefined,
        align: undefined, // left, right, center
        halign: undefined, // left, right, center
        falign: undefined, // left, right, center
        valign: undefined, // top, middle, bottom
        width: undefined,
        sortable: false,
        order: 'asc', // asc, desc
        visible: true,
        switchable: true,
        clickToSelect: true,
        formatter: undefined,
        footerFormatter: undefined,
        events: undefined,
        sorter: undefined,
        sortName: undefined,
        cellStyle: undefined,
        searchable: true,
        searchFormatter: true,
        cardVisible: true,
        escape: false,
        showSelectTitle: false
    };

    KuiTable.EVENTS = {
        'all.bs.table': 'onAll',
        'click-cell.bs.table': 'onClickCell',
        'dbl-click-cell.bs.table': 'onDblClickCell',
        'click-row.bs.table': 'onClickRow',
        'dbl-click-row.bs.table': 'onDblClickRow',
        'sort.bs.table': 'onSort',
        'check.bs.table': 'onCheck',
        'uncheck.bs.table': 'onUncheck',
        'check-all.bs.table': 'onCheckAll',
        'uncheck-all.bs.table': 'onUncheckAll',
        'check-some.bs.table': 'onCheckSome',
        'uncheck-some.bs.table': 'onUncheckSome',
        'load-success.bs.table': 'onLoadSuccess',
        'load-error.bs.table': 'onLoadError',
        'column-switch.bs.table': 'onColumnSwitch',
        'page-change.bs.table': 'onPageChange',
        'search.bs.table': 'onSearch',
        'toggle.bs.table': 'onToggle',
        'pre-body.bs.table': 'onPreBody',
        'post-body.bs.table': 'onPostBody',
        'post-header.bs.table': 'onPostHeader',
        'expand-row.bs.table': 'onExpandRow',
        'collapse-row.bs.table': 'onCollapseRow',
        'refresh-options.bs.table': 'onRefreshOptions',
        'reset-view.bs.table': 'onResetView',
        'refresh.bs.table': 'onRefresh',
        'scroll-body.bs.table': 'onScrollBody'
    };

    KuiTable.prototype.init = function() {
        this.initLocale();
        this.initContainer();
        this.initTable();
        this.initHeader();
        this.initData();
        this.initHiddenRows();
        this.initFooter();
        this.initToolbar();
        this.initPagination();
        this.initBody();
        this.initSearchText();
        this.initServer();
    };

    KuiTable.prototype.initLocale = function() {
        if (this.options.locale) {
            var parts = this.options.locale.split(/-|_/);
            parts[0].toLowerCase();
            if (parts[1]) {
                parts[1].toUpperCase();
            }
            if ($.fn.kuiTable.locales[this.options.locale]) {
                // locale as requested
                $.extend(this.options, $.fn.kuiTable.locales[this.options.locale]);
            } else if ($.fn.kuiTable.locales[parts.join('-')]) {
                // locale with sep set to - (in case original was specified with _)
                $.extend(this.options, $.fn.kuiTable.locales[parts.join('-')]);
            } else if ($.fn.kuiTable.locales[parts[0]]) {
                // short locale language code (i.e. 'en')
                $.extend(this.options, $.fn.kuiTable.locales[parts[0]]);
            }
        }
    };

    KuiTable.prototype.initContainer = function() {
        this.$container = $([
            '<div class="kui-table">',
            '<div class="fixed-table-toolbar"></div>',
            this.options.paginationVAlign === 'top' || this.options.paginationVAlign === 'both' ?
            '<div class="fixed-table-pagination" style="clear: both;"></div>' :
            '',
            '<div class="fixed-table-container">',
            '<div class="fixed-table-header"><table></table></div>',
            '<div class="fixed-table-body">',
            '<div class="fixed-table-loading">',
            this.options.formatLoadingMessage(),
            '</div>',
            '</div>',
            '<div class="fixed-table-footer"><table><tr></tr></table></div>',
            '</div>',
            this.options.paginationVAlign === 'bottom' || this.options.paginationVAlign === 'both' ?
            '<div class="fixed-table-pagination"></div>' :
            '',
            '</div>'
        ].join(''));

        this.$container.insertAfter(this.$el);
        this.$tableContainer = this.$container.find('.fixed-table-container');
        this.$tableHeader = this.$container.find('.fixed-table-header');
        this.$tableBody = this.$container.find('.fixed-table-body');
        this.$tableLoading = this.$container.find('.fixed-table-loading');
        this.$tableFooter = this.$container.find('.fixed-table-footer');
        // checking if custom table-toolbar exists or not
        if (this.options.buttonsToolbar) {
            this.$toolbar = $('body').find(this.options.buttonsToolbar);
        } else {
            this.$toolbar = this.$container.find('.fixed-table-toolbar');
        }
        this.$pagination = this.$container.find('.fixed-table-pagination');

        this.$tableBody.append(this.$el);
        this.$container.after('<div class="clearfix"></div>');

        this.$el.addClass(this.options.classes);
        if (this.options.striped) {
            this.$el.addClass('table-striped');
        }
        if ($.inArray('table-no-bordered', this.options.classes.split(' ')) !== -1) {
            this.$tableContainer.addClass('table-no-bordered');
        }
    };

    KuiTable.prototype.initTable = function() {
        var that = this,
            columns = [],
            data = [];

        this.$header = this.$el.find('>thead');
        if (!this.$header.length) {
            this.$header = $('<thead></thead>').appendTo(this.$el);
        }
        this.$header.find('tr').each(function() {
            var column = [];

            $(this).find('th').each(function() {
                // Fix #2014 - getFieldIndex and elsewhere assume this is string, causes issues if not
                if (typeof $(this).data('field') !== 'undefined') {
                    $(this).data('field', $(this).data('field') + '');
                }
                column.push($.extend({}, {
                    title: $(this).html(),
                    'class': $(this).attr('class'),
                    titleTooltip: $(this).attr('title'),
                    rowspan: $(this).attr('rowspan') ? +$(this).attr('rowspan') : undefined,
                    colspan: $(this).attr('colspan') ? +$(this).attr('colspan') : undefined
                }, $(this).data()));
            });
            columns.push(column);
        });
        if (!$.isArray(this.options.columns[0])) {
            this.options.columns = [this.options.columns];
        }
        this.options.columns = $.extend(true, [], columns, this.options.columns);
        this.columns = [];
        this.fieldsColumnsIndex = [];

        setFieldIndex(this.options.columns);
        $.each(this.options.columns, function(i, columns) {
            $.each(columns, function(j, column) {
                column = $.extend({}, KuiTable.COLUMN_DEFAULTS, column);

                if (typeof column.fieldIndex !== 'undefined') {
                    that.columns[column.fieldIndex] = column;
                    that.fieldsColumnsIndex[column.field] = column.fieldIndex;
                }

                that.options.columns[i][j] = column;
            });
        });

        // if options.data is setting, do not process tbody data
        if (this.options.data.length) {
            return;
        }

        var m = [];
        this.$el.find('>tbody>tr').each(function(y) {
            var row = {};

            // save tr's id, class and data-* attributes
            row._id = $(this).attr('id');
            row._class = $(this).attr('class');
            row._data = getRealDataAttr($(this).data());

            $(this).find('>td').each(function(x) {
                var $this = $(this),
                    cspan = +$this.attr('colspan') || 1,
                    rspan = +$this.attr('rowspan') || 1,
                    tx,
                    ty;

                // skip already occupied cells in current row
                for (; m[y] && m[y][x]; x++);

                for (tx = x; tx < x + cspan; tx++) { //mark matrix elements occupied by current cell with true
                    for (ty = y; ty < y + rspan; ty++) {
                        if (!m[ty]) { //fill missing rows
                            m[ty] = [];
                        }
                        m[ty][tx] = true;
                    }
                }

                var field = that.columns[x].field;

                row[field] = $(this).html();
                // save td's id, class and data-* attributes
                row['_' + field + '_id'] = $(this).attr('id');
                row['_' + field + '_class'] = $(this).attr('class');
                row['_' + field + '_rowspan'] = $(this).attr('rowspan');
                row['_' + field + '_colspan'] = $(this).attr('colspan');
                row['_' + field + '_title'] = $(this).attr('title');
                row['_' + field + '_data'] = getRealDataAttr($(this).data());
            });
            data.push(row);
        });
        this.options.data = data;
        if (data.length) this.fromHtml = true;
    };

    KuiTable.prototype.initHeader = function() {
        var that = this,
            visibleColumns = {},
            html = [];

        this.header = {
            fields: [],
            styles: [],
            classes: [],
            formatters: [],
            events: [],
            sorters: [],
            sortNames: [],
            cellStyles: [],
            searchables: []
        };

        $.each(this.options.columns, function(i, columns) {
            html.push('<tr>');

            if (i === 0 && !that.options.cardView && that.options.detailView) {
                html.push(sprintf('<th class="detail" rowspan="%s"><div class="fht-cell"></div></th>',
                    that.options.columns.length));
            }

            $.each(columns, function(j, column) {
                var text = '',
                    halign = '', // header align style
                    align = '', // body align style
                    style = '',
                    class_ = sprintf(' class="%s"', column['class']),
                    order = that.options.sortOrder || column.order,
                    unitWidth = 'px',
                    width = column.width;

                if (column.width !== undefined && (!that.options.cardView)) {
                    if (typeof column.width === 'string') {
                        if (column.width.indexOf('%') !== -1) {
                            unitWidth = '%';
                        }
                    }
                }
                if (column.width && typeof column.width === 'string') {
                    width = column.width.replace('%', '').replace('px', '');
                }

                halign = sprintf('text-align: %s; ', column.halign ? column.halign : column.align);
                align = sprintf('text-align: %s; ', column.align);
                style = sprintf('v-align: %s; ', column.valign);
                style += sprintf('width: %s; ', (column.checkbox || column.radio) && !width ?
                    (!column.showSelectTitle ? '36px' : undefined) :
                    (width ? width + unitWidth : undefined));

                if (typeof column.fieldIndex !== 'undefined') {
                    that.header.fields[column.fieldIndex] = column.field;
                    that.header.styles[column.fieldIndex] = align + style;
                    that.header.classes[column.fieldIndex] = class_;
                    that.header.formatters[column.fieldIndex] = column.formatter;
                    that.header.events[column.fieldIndex] = column.events;
                    that.header.sorters[column.fieldIndex] = column.sorter;
                    that.header.sortNames[column.fieldIndex] = column.sortName;
                    that.header.cellStyles[column.fieldIndex] = column.cellStyle;
                    that.header.searchables[column.fieldIndex] = column.searchable;

                    if (!column.visible) {
                        return;
                    }

                    if (that.options.cardView && (!column.cardVisible)) {
                        return;
                    }

                    visibleColumns[column.field] = column;
                }

                html.push('<th' + sprintf(' title="%s"', column.titleTooltip),
                    column.checkbox || column.radio ?
                    sprintf(' class="bs-checkbox %s"', column['class'] || '') :
                    class_,
                    sprintf(' style="%s"', halign + style),
                    sprintf(' rowspan="%s"', column.rowspan),
                    sprintf(' colspan="%s"', column.colspan),
                    sprintf(' data-field="%s"', column.field),
                    j === 0 && column.fieldIndex ? ' data-not-first-th' : '',
                    '>');

                html.push(sprintf('<div class="th-inner %s">', that.options.sortable && column.sortable ?
                    'sortable both' : ''));

                text = that.options.escape ? escapeHTML(column.title) : column.title;

                var title = text;
                if (column.checkbox) {
                    text = '';
                    if (!that.options.singleSelect && that.options.checkboxHeader) {
                        text = '<span class=\"checkbox-custom\"> <input name="btSelectAll" type="checkbox" /><label for=\"btSelectAll\"></label></span>';
                    }
                    that.header.stateField = column.field;
                }
                if (column.radio) {
                    text = '';
                    that.header.stateField = column.field;
                    that.options.singleSelect = true;
                }
                if (!text && column.showSelectTitle) {
                    text += title;
                }

                html.push(text);
                html.push('</div>');
                html.push('<div class="fht-cell"></div>');
                html.push('</div>');
                html.push('</th>');
            });
            html.push('</tr>');
        });

        this.$header.html(html.join(''));
        this.$header.find('th[data-field]').each(function(i) {
            $(this).data(visibleColumns[$(this).data('field')]);
        });
        this.$container.off('click', '.th-inner').on('click', '.th-inner', function(event) {
            var $this = $(this);

            if (that.options.detailView && !$this.parent().hasClass('bs-checkbox')) {
                if ($this.closest('.table')[0] !== that.$container[0]) {
                    return false;
                }
            }

            if (that.options.sortable && $this.parent().data().sortable) {
                that.onSort(event);
            }
        });

        this.$header.children().children().off('keypress').on('keypress', function(event) {
            if (that.options.sortable && $(this).data().sortable) {
                var code = event.keyCode || event.which;
                if (code == 13) { //Enter keycode
                    that.onSort(event);
                }
            }
        });

        $(window).off('resize.table');
        if (!this.options.showHeader || this.options.cardView) {
            this.$header.hide();
            this.$tableHeader.hide();
            this.$tableLoading.css('top', 0);
        } else {
            this.$header.show();
            this.$tableHeader.show();
            this.$tableLoading.css('top', this.$header.outerHeight() + 1);
            // Assign the correct sortable arrow
            this.getCaret();
            $(window).on('resize.table', $.proxy(this.resetWidth, this));
        }

        this.$selectAll = this.$header.find('[name="btSelectAll"]');
        this.$selectAll.off('click').on('click', function() {
            var checked = $(this).prop('checked');
            that[checked ? 'checkAll' : 'uncheckAll']();
            that.updateSelected();
        });
    };

    KuiTable.prototype.initFooter = function() {
        if (!this.options.showFooter || this.options.cardView) {
            this.$tableFooter.hide();
        } else {
            this.$tableFooter.show();
        }
    };

    /**
     * @param data
     * @param type: append / prepend
     */
    KuiTable.prototype.initData = function(data, type) {
        if (type === 'append') {
            this.options.data = this.options.data.concat(data);
        } else if (type === 'prepend') {
            this.options.data = [].concat(data).concat(this.options.data);
        } else {
            this.options.data = data || this.options.data;
        }

        this.data = this.options.data;

        if (this.options.sidePagination === 'server') {
            return;
        }
        this.initSort();
    };

    KuiTable.prototype.initSort = function() {
        var that = this,
            name = this.options.sortName,
            order = this.options.sortOrder === 'desc' ? -1 : 1,
            index = $.inArray(this.options.sortName, this.header.fields),
            timeoutId = 0;

        if (this.options.customSort !== $.noop) {
            this.options.customSort.apply(this, [this.options.sortName, this.options.sortOrder]);
            return;
        }

        if (index !== -1) {
            if (this.options.sortStable) {
                $.each(this.data, function(i, row) {
                    row._position = i;
                });
            }

            this.data.sort(function(a, b) {
                if (that.header.sortNames[index]) {
                    name = that.header.sortNames[index];
                }
                var aa = getItemField(a, name, that.options.escape),
                    bb = getItemField(b, name, that.options.escape),
                    value = calculateObjectValue(that.header, that.header.sorters[index], [aa, bb, a, b]);

                if (value !== undefined) {
                    if (that.options.sortStable && value === 0) {
                        return a._position - b._position;
                    }
                    return order * value;
                }

                // Fix #161: undefined or null string sort bug.
                if (aa === undefined || aa === null) {
                    aa = '';
                }
                if (bb === undefined || bb === null) {
                    bb = '';
                }

                if (that.options.sortStable && aa === bb) {
                    aa = a._position;
                    bb = b._position;
                    return a._position - b._position;
                }

                // IF both values are numeric, do a numeric comparison
                if ($.isNumeric(aa) && $.isNumeric(bb)) {
                    // Convert numerical values form string to float.
                    aa = parseFloat(aa);
                    bb = parseFloat(bb);
                    if (aa < bb) {
                        return order * -1;
                    }
                    return order;
                }

                if (aa === bb) {
                    return 0;
                }

                // If value is not a string, convert to string
                if (typeof aa !== 'string') {
                    aa = aa.toString();
                }

                if (aa.localeCompare(bb) === -1) {
                    return order * -1;
                }

                return order;
            });

            if (this.options.sortClass !== undefined) {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(function() {
                    that.$el.removeClass(that.options.sortClass);
                    var index = that.$header.find(sprintf('[data-field="%s"]',
                        that.options.sortName).index() + 1);
                    that.$el.find(sprintf('tr td:nth-child(%s)', index))
                        .addClass(that.options.sortClass);
                }, 250);
            }
        }
    };

    KuiTable.prototype.onSort = function(event) {
        var $this = event.type === "keypress" ? $(event.currentTarget) : $(event.currentTarget).parent(),
            $this_ = this.$header.find('th').eq($this.index());

        this.$header.add(this.$header_).find('span.order').remove();

        if (this.options.sortName === $this.data('field')) {
            this.options.sortOrder = this.options.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.options.sortName = $this.data('field');
            if (this.options.rememberOrder) {
                this.options.sortOrder = $this.data('order') === 'asc' ? 'desc' : 'asc';
            } else {
                this.options.sortOrder = this.columns[this.fieldsColumnsIndex[$this.data('field')]].order;
            }
        }
        this.trigger('sort', this.options.sortName, this.options.sortOrder);

        $this.add($this_).data('order', this.options.sortOrder);

        // Assign the correct sortable arrow
        this.getCaret();

        if (this.options.sidePagination === 'server') {
            this.initServer(this.options.silentSort);
            return;
        }

        this.initSort();
        this.initBody();
    };

    KuiTable.prototype.initToolbar = function() {
        var that = this,
            html = [],
            timeoutId = 0,
            $keepOpen,
            $search,
            switchableCount = 0;

        if (this.$toolbar.find('.bs-bars').children().length) {
            $('body').append($(this.options.toolbar));
        }
        this.$toolbar.html('');

        if (typeof this.options.toolbar === 'string' || typeof this.options.toolbar === 'object') {
            $(sprintf('<div class="bs-bars %s-%s"></div>', bs.pullClass, this.options.toolbarAlign))
                .appendTo(this.$toolbar)
                .append($(this.options.toolbar));
        }

        // showColumns, showToggle, showRefresh
        html = [sprintf('<div class="columns columns-%s btn-group %s-%s">',
            this.options.buttonsAlign, bs.pullClass, this.options.buttonsAlign)];

        if (typeof this.options.icons === 'string') {
            this.options.icons = calculateObjectValue(null, this.options.icons);
        }

        if (this.options.showPaginationSwitch) {
            html.push(sprintf('<button class="btn' +
                    sprintf(' btn-%s', this.options.buttonsClass) +
                    sprintf(' btn-%s', this.options.iconSize) +
                    '" type="button" name="paginationSwitch" aria-label="pagination Switch" title="%s">',
                    this.options.formatPaginationSwitch()),
                sprintf('<i class="%s %s"></i>', this.options.iconsPrefix, this.options.icons.paginationSwitchDown),
                '</button>');
        }

        if (this.options.showFullscreen) {
            this.$toolbar.find('button[name="fullscreen"]')
                .off('click').on('click', $.proxy(this.toggleFullscreen, this));
        }

        if (this.options.showRefresh) {
            html.push(sprintf('<button class="btn' +
                    sprintf(' btn-%s', this.options.buttonsClass) +
                    sprintf(' btn-%s', this.options.iconSize) +
                    '" type="button" name="refresh" aria-label="refresh" title="%s">',
                    this.options.formatRefresh()),
                sprintf('<i class="%s %s"></i>', this.options.iconsPrefix, this.options.icons.refresh),
                '</button>');
        }

        if (this.options.showToggle) {
            html.push(sprintf('<button class="btn' +
                    sprintf(' btn-%s', this.options.buttonsClass) +
                    sprintf(' btn-%s', this.options.iconSize) +
                    '" type="button" name="toggle" aria-label="toggle" title="%s">',
                    this.options.formatToggle()),
                sprintf('<i class="%s %s"></i>', this.options.iconsPrefix, this.options.icons.toggle),
                '</button>');
        }

        if (this.options.showFullscreen) {
            html.push(sprintf('<button class="btn' +
                    sprintf(' btn-%s', this.options.buttonsClass) +
                    sprintf(' btn-%s', this.options.iconSize) +
                    '" type="button" name="fullscreen" aria-label="fullscreen" title="%s">',
                    this.options.formatFullscreen()),
                sprintf('<i class="%s %s"></i>', this.options.iconsPrefix, this.options.icons.fullscreen),
                '</button>');
        }

        if (this.options.showColumns) {
            html.push(sprintf('<div class="keep-open btn-group" title="%s">',
                    this.options.formatColumns()),
                '<button type="button" aria-label="columns" class="btn' +
                sprintf(' btn-%s', this.options.buttonsClass) +
                sprintf(' btn-%s', this.options.iconSize) +
                ' dropdown-toggle" data-toggle="dropdown">',
                sprintf('<i class="%s %s"></i>', this.options.iconsPrefix, this.options.icons.columns),
                ' <span class="caret"></span>',
                '</button>',
                bs.toobarDropdowHtml[0]);

            $.each(this.columns, function(i, column) {
                if (column.radio || column.checkbox) {
                    return;
                }

                if (that.options.cardView && !column.cardVisible) {
                    return;
                }

                var checked = column.visible ? ' checked="checked"' : '';

                if (column.switchable) {
                    html.push(sprintf(bs.toobarDropdowItemHtml,
                        sprintf('<input type="checkbox" data-field="%s" value="%s"%s>%s',
                            column.field, i, checked, column.title)));
                    switchableCount++;
                }
            });
            html.push(bs.toobarDropdowHtml[1], '</div>');
        }

        html.push('</div>');

        // Fix #188: this.showToolbar is for extensions
        if (this.showToolbar || html.length > 2) {
            this.$toolbar.append(html.join(''));
        }

        if (this.options.showPaginationSwitch) {
            this.$toolbar.find('button[name="paginationSwitch"]')
                .off('click').on('click', $.proxy(this.togglePagination, this));
        }

        if (this.options.showRefresh) {
            this.$toolbar.find('button[name="refresh"]')
                .off('click').on('click', $.proxy(this.refresh, this));
        }

        if (this.options.showToggle) {
            this.$toolbar.find('button[name="toggle"]')
                .off('click').on('click', function() {
                    that.toggleView();
                });
        }

        if (this.options.showColumns) {
            $keepOpen = this.$toolbar.find('.keep-open');

            if (switchableCount <= this.options.minimumCountColumns) {
                $keepOpen.find('input').prop('disabled', true);
            }

            $keepOpen.find('li').off('click').on('click', function(event) {
                event.stopImmediatePropagation();
            });
            $keepOpen.find('input').off('click').on('click', function() {
                var $this = $(this);

                that.toggleColumn($(this).val(), $this.prop('checked'), false);
                that.trigger('column-switch', $(this).data('field'), $this.prop('checked'));
            });
        }

        if (this.options.search) {
            html = [];
            html.push(
                sprintf('<div class="%s-%s search">', bs.pullClass, this.options.searchAlign),
                sprintf('<input class="kui-form-control' +
                    sprintf(' input-%s', this.options.iconSize) +
                    '" type="text" placeholder="%s">',
                    this.options.formatSearch()),
                '</div>');

            this.$toolbar.append(html.join(''));
            $search = this.$toolbar.find('.search input');
            $search.off('keyup drop blur').on('keyup drop blur', function(event) {
                if (that.options.searchOnEnterKey && event.keyCode !== 13) {
                    return;
                }

                if ($.inArray(event.keyCode, [37, 38, 39, 40]) > -1) {
                    return;
                }

                clearTimeout(timeoutId); // doesn't matter if it's 0
                timeoutId = setTimeout(function() {
                    that.onSearch(event);
                }, that.options.searchTimeOut);
            });

            if (isIEBrowser()) {
                $search.off('mouseup').on('mouseup', function(event) {
                    clearTimeout(timeoutId); // doesn't matter if it's 0
                    timeoutId = setTimeout(function() {
                        that.onSearch(event);
                    }, that.options.searchTimeOut);
                });
            }
        }
    };

    KuiTable.prototype.onSearch = function(event) {
        var text = $.trim($(event.currentTarget).val());

        // trim search input
        if (this.options.trimOnSearch && $(event.currentTarget).val() !== text) {
            $(event.currentTarget).val(text);
        }

        if (text === this.searchText) {
            return;
        }
        this.searchText = text;
        this.options.searchText = text;

        this.options.pageNumber = 1;
        this.initSearch();
        if (event.firedByInitSearchText) {
            if (this.options.sidePagination === 'client') {
                this.updatePagination();
            }
        } else {
            this.updatePagination();
        }
        this.trigger('search', text);
    };

    KuiTable.prototype.initSearch = function() {
        var that = this;

        if (this.options.sidePagination !== 'server') {
            if (this.options.customSearch !== $.noop) {
                window[this.options.customSearch].apply(this, [this.searchText]);
                return;
            }

            var s = this.searchText && (this.options.escape ?
                escapeHTML(this.searchText) : this.searchText).toLowerCase();
            var f = $.isEmptyObject(this.filterColumns) ? null : this.filterColumns;

            // Check filter
            this.data = f ? $.grep(this.options.data, function(item, i) {
                for (var key in f) {
                    if ($.isArray(f[key]) && $.inArray(item[key], f[key]) === -1 ||
                        !$.isArray(f[key]) && item[key] !== f[key]) {
                        return false;
                    }
                }
                return true;
            }) : this.options.data;

            this.data = s ? $.grep(this.data, function(item, i) {
                for (var j = 0; j < that.header.fields.length; j++) {

                    if (!that.header.searchables[j]) {
                        continue;
                    }

                    var key = $.isNumeric(that.header.fields[j]) ? parseInt(that.header.fields[j], 10) : that.header.fields[j];
                    var column = that.columns[that.fieldsColumnsIndex[key]];
                    var value;

                    if (typeof key === 'string') {
                        value = item;
                        var props = key.split('.');
                        for (var prop_index = 0; prop_index < props.length; prop_index++) {
                            if (value[props[prop_index]] != null) {
                                value = value[props[prop_index]];
                            }
                        }

                        // Fix #142: respect searchForamtter boolean
                        if (column && column.searchFormatter) {
                            value = calculateObjectValue(column,
                                that.header.formatters[j], [value, item, i], value);
                        }
                    } else {
                        value = item[key];
                    }

                    if (typeof value === 'string' || typeof value === 'number') {
                        if (that.options.strictSearch) {
                            if ((value + '').toLowerCase() === s) {
                                return true;
                            }
                        } else {
                            if ((value + '').toLowerCase().indexOf(s) !== -1) {
                                return true;
                            }
                        }
                    }
                }
                return false;
            }) : this.data;
        }
    };

    KuiTable.prototype.initPagination = function() {
        if (!this.options.pagination) {
            this.$pagination.hide();
            return;
        } else {
            this.$pagination.show();
        }

        var that = this,
            html = [],
            $allSelected = false,
            i, from, to,
            $pageList,
            $pre,
            $next,
            $number,
            data = this.getData(),
            pageList = this.options.pageList;

        if (this.options.sidePagination !== 'server') {
            this.options.totalRows = data.length;
        }

        this.totalPages = 0;
        if (this.options.totalRows) {
            if (this.options.pageSize === this.options.formatAllRows()) {
                this.options.pageSize = this.options.totalRows;
                $allSelected = true;
            } else if (this.options.pageSize === this.options.totalRows) {
                // Fix #667 Table with pagination,
                // multiple pages and a search that matches to one page throws exception
                var pageLst = typeof this.options.pageList === 'string' ?
                    this.options.pageList.replace('[', '').replace(']', '')
                    .replace(/ /g, '').toLowerCase().split(',') : this.options.pageList;
                if ($.inArray(this.options.formatAllRows().toLowerCase(), pageLst) > -1) {
                    $allSelected = true;
                }
            }

            this.totalPages = ~~((this.options.totalRows - 1) / this.options.pageSize) + 1;

            this.options.totalPages = this.totalPages;
        }
        if (this.totalPages > 0 && this.options.pageNumber > this.totalPages) {
            this.options.pageNumber = this.totalPages;
        }

        this.pageFrom = (this.options.pageNumber - 1) * this.options.pageSize + 1;
        this.pageTo = this.options.pageNumber * this.options.pageSize;
        if (this.pageTo > this.options.totalRows) {
            this.pageTo = this.options.totalRows;
        }

        html.push(
            sprintf('<div class="%s-%s pagination-detail">', bs.pullClass, this.options.paginationDetailHAlign),
            '<span class="pagination-info">',
            this.options.onlyInfoPagination ? this.options.formatDetailPagination(this.options.totalRows) :
            this.options.formatShowingRows(this.pageFrom, this.pageTo, this.options.totalRows),
            '</span>');

        if (!this.options.onlyInfoPagination) {
            html.push('<span class="page-list">');

            var pageNumber = [
                sprintf('<span class="btn-group %s">',
                    this.options.paginationVAlign === 'top' || this.options.paginationVAlign === 'both' ?
                    'dropdown' : 'dropup'),
                '<button type="button" class="btn' +
                sprintf(' btn-%s', this.options.buttonsClass) +
                sprintf(' btn-%s', this.options.iconSize) +
                ' dropdown-toggle" data-toggle="dropdown">',
                '<span class="page-size">',
                $allSelected ? this.options.formatAllRows() : this.options.pageSize,
                '</span>',
                ' <span class="caret"></span>',
                '</button>',
                bs.pageDropdownHtml[0]
            ];

            if (typeof this.options.pageList === 'string') {
                var list = this.options.pageList.replace('[', '').replace(']', '')
                    .replace(/ /g, '').split(',');

                pageList = [];
                $.each(list, function(i, value) {
                    pageList.push((value.toUpperCase() === that.options.formatAllRows().toUpperCase() || value.toUpperCase() === "UNLIMITED") ?
                        that.options.formatAllRows() : +value);
                });
            }

            $.each(pageList, function(i, page) {
                if (!that.options.smartDisplay || i === 0 || pageList[i - 1] < that.options.totalRows) {
                    var active;
                    if ($allSelected) {
                        active = page === that.options.formatAllRows() ? 'active' : '';
                    } else {
                        active = page === that.options.pageSize ? 'active' : '';
                    }
                    pageNumber.push(sprintf(bs.pageDropdownItemHtml, active, page));
                }
            });
            pageNumber.push(bs.pageDropdownHtml[1] + '</span>');

            html.push(this.options.formatRecordsPerPage(pageNumber.join('')));
            html.push('</span>');

            html.push('</div>',
                sprintf('<div class="%s-%s pagination">', bs.pullClass, this.options.paginationHAlign),
                '<ul class="pagination' + sprintf(' pagination-%s', this.options.iconSize) + '">',
                sprintf('<li class="page-item page-pre"><a class="page-link" href="#">%s</a></li>',
                    this.options.paginationPreText));

            if (this.totalPages < 5) {
                from = 1;
                to = this.totalPages;
            } else {
                from = this.options.pageNumber - 2;
                to = from + 4;
                if (from < 1) {
                    from = 1;
                    to = 5;
                }
                if (to > this.totalPages) {
                    to = this.totalPages;
                    from = to - 4;
                }
            }

            if (this.totalPages >= 6) {
                if (this.options.pageNumber >= 3) {
                    html.push(
                        sprintf('<li class="page-item page-first%s">',
                            1 === this.options.pageNumber ? ' active' : ''),
                        '<a class="page-link" href="#">', 1, '</a>',
                        '</li>');

                    from++;
                }

                if (this.options.pageNumber >= 4) {
                    if (this.options.pageNumber == 4 || this.totalPages == 6 || this.totalPages == 7) {
                        from--;
                    } else {
                        html.push('<li class="page-item page-first-separator disabled">',
                            '<a class="page-link" href="#">...</a>',
                            '</li>');
                    }

                    to--;
                }
            }

            if (this.totalPages >= 7) {
                if (this.options.pageNumber >= (this.totalPages - 2)) {
                    from--;
                }
            }

            if (this.totalPages == 6) {
                if (this.options.pageNumber >= (this.totalPages - 2)) {
                    to++;
                }
            } else if (this.totalPages >= 7) {
                if (this.totalPages == 7 || this.options.pageNumber >= (this.totalPages - 3)) {
                    to++;
                }
            }

            for (i = from; i <= to; i++) {
                html.push(sprintf('<li class="page-item%s">',
                        i === this.options.pageNumber ? ' active' : ''),
                    '<a class="page-link" href="#">', i, '</a>',
                    '</li>');
            }

            if (this.totalPages >= 8) {
                if (this.options.pageNumber <= (this.totalPages - 4)) {
                    html.push('<li class="page-item page-last-separator disabled">',
                        '<a class="page-link" href="#">...</a>',
                        '</li>');
                }
            }

            if (this.totalPages >= 6) {
                if (this.options.pageNumber <= (this.totalPages - 3)) {
                    html.push(sprintf('<li class="page-item page-last%s">',
                            this.totalPages === this.options.pageNumber ? ' active' : ''),
                        '<a class="page-link" href="#">', this.totalPages, '</a>',
                        '</li>');
                }
            }

            html.push(
                sprintf('<li class="page-item page-next"><a class="page-link" href="#">%s</a></li>',
                    this.options.paginationNextText),
                '</ul>',
                '</div>');
        }
        this.$pagination.html(html.join(''));

        if (!this.options.onlyInfoPagination) {
            $pageList = this.$pagination.find('.page-list a');
            $pre = this.$pagination.find('.page-pre');
            $next = this.$pagination.find('.page-next');
            $number = this.$pagination.find('.page-item').not('.page-next, .page-pre');

            if (this.options.smartDisplay) {
                if (this.totalPages <= 1) {
                    this.$pagination.find('div.pagination').hide();
                }
                if (pageList.length < 2 || this.options.totalRows <= pageList[0]) {
                    this.$pagination.find('span.page-list').hide();
                }

                // when data is empty, hide the pagination
                this.$pagination[this.getData().length ? 'show' : 'hide']();
            }

            if (!this.options.paginationLoop) {
                if (this.options.pageNumber === 1) {
                    $pre.addClass('disabled');
                }
                if (this.options.pageNumber === this.totalPages) {
                    $next.addClass('disabled');
                }
            }

            if ($allSelected) {
                this.options.pageSize = this.options.formatAllRows();
            }
            // removed the events for last and first, onPageNumber executeds the same logic
            $pageList.off('click').on('click', $.proxy(this.onPageListChange, this));
            $pre.off('click').on('click', $.proxy(this.onPagePre, this));
            $next.off('click').on('click', $.proxy(this.onPageNext, this));
            $number.off('click').on('click', $.proxy(this.onPageNumber, this));
        }
    };

    KuiTable.prototype.updatePagination = function(event) {
        // Fix #171: IE disabled button can be clicked bug.
        if (event && $(event.currentTarget).hasClass('disabled')) {
            return;
        }

        if (!this.options.maintainSelected) {
            this.resetRows();
        }

        this.initPagination();
        if (this.options.sidePagination === 'server') {
            this.initServer();
        } else {
            this.initBody();
        }

        this.trigger('page-change', this.options.pageNumber, this.options.pageSize);
    };

    KuiTable.prototype.onPageListChange = function(event) {
        event.preventDefault();
        var $this = $(event.currentTarget);

        $this.parent().addClass('active').siblings().removeClass('active');
        this.options.pageSize = $this.text().toUpperCase() === this.options.formatAllRows().toUpperCase() ?
            this.options.formatAllRows() : +$this.text();
        this.$toolbar.find('.page-size').text(this.options.pageSize);

        this.updatePagination(event);
        return false;
    };

    KuiTable.prototype.onPagePre = function(event) {
        event.preventDefault();
        if ((this.options.pageNumber - 1) === 0) {
            this.options.pageNumber = this.options.totalPages;
        } else {
            this.options.pageNumber--;
        }
        this.updatePagination(event);
        return false;
    };

    KuiTable.prototype.onPageNext = function(event) {
        event.preventDefault();
        if ((this.options.pageNumber + 1) > this.options.totalPages) {
            this.options.pageNumber = 1;
        } else {
            this.options.pageNumber++;
        }
        this.updatePagination(event);
        return false;
    };

    KuiTable.prototype.onPageNumber = function(event) {
        event.preventDefault();
        if (this.options.pageNumber === +$(event.currentTarget).text()) {
            return;
        }
        this.options.pageNumber = +$(event.currentTarget).text();
        this.updatePagination(event);
        return false;
    };

    KuiTable.prototype.initRow = function(item, i, data, parentDom) {
        var that = this,
            key,
            html = [],
            style = {},
            csses = [],
            data_ = '',
            attributes = {},
            htmlAttributes = [];

        if ($.inArray(item, this.hiddenRows) > -1) {
            return;
        }

        style = calculateObjectValue(this.options, this.options.rowStyle, [item, i], style);

        if (style && style.css) {
            for (key in style.css) {
                csses.push(key + ': ' + style.css[key]);
            }
        }

        attributes = calculateObjectValue(this.options,
            this.options.rowAttributes, [item, i], attributes);

        if (attributes) {
            for (key in attributes) {
                htmlAttributes.push(sprintf('%s="%s"', key, escapeHTML(attributes[key])));
            }
        }

        if (item._data && !$.isEmptyObject(item._data)) {
            $.each(item._data, function(k, v) {
                // ignore data-index
                if (k === 'index') {
                    return;
                }
                data_ += sprintf(' data-%s="%s"', k, v);
            });
        }

        html.push('<tr',
            sprintf(' %s', htmlAttributes.join(' ')),
            sprintf(' id="%s"', $.isArray(item) ? undefined : item._id),
            sprintf(' class="%s"', style.classes || ($.isArray(item) ? undefined : item._class)),
            sprintf(' data-index="%s"', i),
            sprintf(' data-uniqueid="%s"', item[this.options.uniqueId]),
            sprintf('%s', data_),
            '>'
        );

        if (this.options.cardView) {
            html.push(sprintf('<td colspan="%s"><div class="card-views">', this.header.fields.length));
        }

        if (!this.options.cardView && this.options.detailView) {
            html.push('<td>');

            if (calculateObjectValue(null, this.options.detailFilter, [i, item])) {
                html.push('<a class="detail-icon" href="#">',
                    sprintf('<i class="%s %s"></i>', this.options.iconsPrefix, this.options.icons.detailOpen),
                    '</a>');
            }

            html.push('</td>');
        }

        $.each(this.header.fields, function(j, field) {
            var text = '',
                value_ = getItemField(item, field, that.options.escape),
                value = '',
                type = '',
                cellStyle = {},
                id_ = '',
                class_ = that.header.classes[j],
                data_ = '',
                rowspan_ = '',
                colspan_ = '',
                title_ = '',
                column = that.columns[j];

            if (that.fromHtml && typeof value_ === 'undefined') {
                if ((!column.checkbox) && (!column.radio)) {
                    return;
                }
            }

            if (!column.visible) {
                return;
            }

            if (that.options.cardView && (!column.cardVisible)) {
                return;
            }

            if (column.escape) {
                value_ = escapeHTML(value_);
            }

            style = sprintf('style="%s"', csses.concat(that.header.styles[j]).join('; '));

            // handle td's id and class
            if (item['_' + field + '_id']) {
                id_ = sprintf(' id="%s"', item['_' + field + '_id']);
            }
            if (item['_' + field + '_class']) {
                class_ = sprintf(' class="%s"', item['_' + field + '_class']);
            }
            if (item['_' + field + '_rowspan']) {
                rowspan_ = sprintf(' rowspan="%s"', item['_' + field + '_rowspan']);
            }
            if (item['_' + field + '_colspan']) {
                colspan_ = sprintf(' colspan="%s"', item['_' + field + '_colspan']);
            }
            if (item['_' + field + '_title']) {
                title_ = sprintf(' title="%s"', item['_' + field + '_title']);
            }
            cellStyle = calculateObjectValue(that.header,
                that.header.cellStyles[j], [value_, item, i, field], cellStyle);
            if (cellStyle.classes) {
                class_ = sprintf(' class="%s"', cellStyle.classes);
            }
            if (cellStyle.css) {
                var csses_ = [];
                for (var key in cellStyle.css) {
                    csses_.push(key + ': ' + cellStyle.css[key]);
                }
                style = sprintf('style="%s"', csses_.concat(that.header.styles[j]).join('; '));
            }

            value = calculateObjectValue(column,
                that.header.formatters[j], [value_, item, i, field], value_);

            if (item['_' + field + '_data'] && !$.isEmptyObject(item['_' + field + '_data'])) {
                $.each(item['_' + field + '_data'], function(k, v) {
                    // ignore data-index
                    if (k === 'index') {
                        return;
                    }
                    data_ += sprintf(' data-%s="%s"', k, v);
                });
            }

            if (column.checkbox || column.radio) {
                type = column.checkbox ? 'checkbox' : type;
                type = column.radio ? 'radio' : type;
                var c = type == "checkbox" ? "checkbox-custom" : "radio-custom";
                text = [sprintf(that.options.cardView ?
                        '<div class="card-view %s">' : '<td class="bs-checkbox %s">', column['class'] || ''),
                    '<span class="' + c + '"><input' +
                    sprintf(' data-index="%s"', i) +
                    sprintf(' name="%s"', that.options.selectItemName) +
                    sprintf(' type="%s"', type) +
                    sprintf(' value="%s"', item[that.options.idField]) +
                    sprintf(' checked="%s"', value === true || (value_ || value && value.checked) ? 'checked' : undefined) +
                    sprintf(' disabled="%s"', !column.checkboxEnabled || (value && value.disabled) ? 'disabled' : undefined) +
                    ' /> <label></label> </span>',
                    that.header.formatters[j] && typeof value === 'string' ? value : '',
                    that.options.cardView ? '</div>' : '</td>'
                ].join('');

                item[that.header.stateField] = value === true || (!!value_ || value && value.checked);
            } else {
                value = typeof value === 'undefined' || value === null ?
                    that.options.undefinedText : value;

                text = that.options.cardView ? ['<div class="card-view">',
                    that.options.showHeader ? sprintf('<span class="title" %s>%s</span>', style,
                        getPropertyFromOther(that.columns, 'field', 'title', field)) : '',
                    sprintf('<span class="value">%s</span>', value),
                    '</div>'
                ].join('') : [sprintf('<td%s %s %s %s %s %s %s>',
                        id_, class_, style, data_, rowspan_, colspan_, title_),
                    value,
                    '</td>'
                ].join('');

                // Hide empty data on Card view when smartDisplay is set to true.
                if (that.options.cardView && that.options.smartDisplay && value === '') {
                    // Should set a placeholder for event binding correct fieldIndex
                    text = '<div class="card-view"></div>';
                }
            }

            html.push(text);
        });

        if (this.options.cardView) {
            html.push('</div></td>');
        }
        html.push('</tr>');

        return html.join(' ');
    };

    KuiTable.prototype.initBody = function(fixedScroll) {
        var that = this,
            html = [],
            data = this.getData();

        this.trigger('pre-body', data);

        this.$body = this.$el.find('>tbody');
        if (!this.$body.length) {
            this.$body = $('<tbody></tbody>').appendTo(this.$el);
        }

        //Fix #389 Bootstrap-table-flatJSON is not working

        if (!this.options.pagination || this.options.sidePagination === 'server') {
            this.pageFrom = 1;
            this.pageTo = data.length;
        }

        var trFragments = $(document.createDocumentFragment());
        var hasTr;

        for (var i = this.pageFrom - 1; i < this.pageTo; i++) {
            var item = data[i];
            var tr = this.initRow(item, i, data, trFragments);
            hasTr = hasTr || !!tr;
            if (tr && tr !== true) {
                trFragments.append(tr);
            }
        }

        // show no records
        if (!hasTr) {
            trFragments.append('<tr class="no-records-found">' +
                sprintf('<td colspan="%s">%s</td>',
                    this.$header.find('th').length,
                    this.options.formatNoMatches()) +
                '</tr>');
        }

        this.$body.html(trFragments);

        if (!fixedScroll) {
            this.scrollTo(0);
        }

        // click to select by column
        this.$body.find('> tr[data-index] > td').off('click dblclick').on('click dblclick', function(e) {
            var $td = $(this),
                $tr = $td.parent(),
                item = that.data[$tr.data('index')],
                index = $td[0].cellIndex,
                fields = that.getVisibleFields(),
                field = fields[that.options.detailView && !that.options.cardView ? index - 1 : index],
                column = that.columns[that.fieldsColumnsIndex[field]],
                value = getItemField(item, field, that.options.escape);

            if ($td.find('.detail-icon').length) {
                return;
            }

            that.trigger(e.type === 'click' ? 'click-cell' : 'dbl-click-cell', field, value, item, $td);
            that.trigger(e.type === 'click' ? 'click-row' : 'dbl-click-row', item, $tr, field);

            // if click to select - then trigger the checkbox/radio click
            if (e.type === 'click' && that.options.clickToSelect && column.clickToSelect && that.options.ignoreClickToSelectOn(e.target)) {
                var $selectItem = $tr.find(sprintf('[name="%s"]', that.options.selectItemName));
                if ($selectItem.length) {
                    $selectItem[0].click(); // #144: .trigger('click') bug
                }
            }
        });

        this.$body.find('> tr[data-index] > td > .detail-icon').off('click').on('click', function(e) {
            e.preventDefault();

            var $this = $(this),
                $tr = $this.parent().parent(),
                index = $tr.data('index'),
                row = data[index]; // Fix #980 Detail view, when searching, returns wrong row

            // remove and update
            if ($tr.next().is('tr.detail-view')) {
                $this.find('i').attr('class', sprintf('%s %s', that.options.iconsPrefix, that.options.icons.detailOpen));
                that.trigger('collapse-row', index, row, $tr.next());
                $tr.next().remove();
            } else {
                $this.find('i').attr('class', sprintf('%s %s', that.options.iconsPrefix, that.options.icons.detailClose));
                $tr.after(sprintf('<tr class="detail-view"><td colspan="%s"></td></tr>', $tr.find('td').length));
                var $element = $tr.next().find('td');
                var content = calculateObjectValue(that.options, that.options.detailFormatter, [index, row, $element], '');
                if ($element.length === 1) {
                    $element.append(content);
                }
                that.trigger('expand-row', index, row, $element);
            }
            that.resetView();
            return false;
        });

        this.$selectItem = this.$body.find(sprintf('[name="%s"]', this.options.selectItemName));
        this.$selectItem.off('click').on('click', function(event) {
            event.stopImmediatePropagation();

            var $this = $(this),
                checked = $this.prop('checked'),
                row = that.data[$this.data('index')];

            if ($(this).is(':radio') || that.options.singleSelect) {
                $.each(that.options.data, function(i, row) {
                    row[that.header.stateField] = false;
                });
            }

            row[that.header.stateField] = checked;

            if (that.options.singleSelect) {
                that.$selectItem.not(this).each(function() {
                    that.data[$(this).data('index')][that.header.stateField] = false;
                });
                that.$selectItem.filter(':checked').not(this).prop('checked', false);
            }

            that.updateSelected();
            that.trigger(checked ? 'check' : 'uncheck', row, $this);
        });

        $.each(this.header.events, function(i, events) {
            if (!events) {
                return;
            }
            // fix bug, if events is defined with namespace
            if (typeof events === 'string') {
                events = calculateObjectValue(null, events);
            }

            var field = that.header.fields[i],
                fieldIndex = $.inArray(field, that.getVisibleFields());

            if (fieldIndex === -1) {
                return;
            }

            if (that.options.detailView && !that.options.cardView) {
                fieldIndex += 1;
            }

            for (var key in events) {
                that.$body.find('>tr:not(.no-records-found)').each(function() {
                    var $tr = $(this),
                        $td = $tr.find(that.options.cardView ? '.card-view' : 'td').eq(fieldIndex),
                        index = key.indexOf(' '),
                        name = key.substring(0, index),
                        el = key.substring(index + 1),
                        func = events[key];

                    $td.find(el).off(name).on(name, function(e) {
                        var index = $tr.data('index'),
                            row = that.data[index],
                            value = row[field];

                        func.apply(this, [e, value, row, index]);
                    });
                });
            }
        });

        this.updateSelected();
        this.resetView();

        this.trigger('post-body', data);
    };

    KuiTable.prototype.initServer = function(silent, query, url) {
        var that = this,
            data = {},
            index = $.inArray(this.options.sortName, this.header.fields),
            params = {
                searchText: this.searchText,
                sortName: this.options.sortName,
                sortOrder: this.options.sortOrder
            },
            request;

        if (this.header.sortNames[index]) {
            params.sortName = this.header.sortNames[index];
        }

        if (this.options.pagination && this.options.sidePagination === 'server') {
            params.pageSize = this.options.pageSize === this.options.formatAllRows() ?
                this.options.totalRows : this.options.pageSize;
            params.pageNumber = this.options.pageNumber;
        }

        if (!(url || this.options.url) && !this.options.ajax) {
            return;
        }

        if (this.options.queryParamsType === 'limit') {
            params = {
                search: params.searchText,
                sort: params.sortName,
                order: params.sortOrder
            };

            if (this.options.pagination && this.options.sidePagination === 'server') {
                params.offset = this.options.pageSize === this.options.formatAllRows() ?
                    0 : this.options.pageSize * (this.options.pageNumber - 1);
                params.limit = this.options.pageSize === this.options.formatAllRows() ?
                    this.options.totalRows : this.options.pageSize;
                if (params.limit === 0) {
                    delete params.limit;
                }
            }
        }

        if (!($.isEmptyObject(this.filterColumnsPartial))) {
            params.filter = JSON.stringify(this.filterColumnsPartial, null);
        }

        data = calculateObjectValue(this.options, this.options.queryParams, [params], data);

        $.extend(data, query || {});

        // false to stop request
        if (data === false) {
            return;
        }

        if (!silent) {
            this.$tableLoading.show();
        }
        request = $.extend({}, calculateObjectValue(null, this.options.ajaxOptions), {
            type: this.options.method,
            url: url || this.options.url,
            data: this.options.contentType === 'application/json' && this.options.method === 'post' ?
                JSON.stringify(data) : data,
            cache: this.options.cache,
            contentType: this.options.contentType,
            dataType: this.options.dataType,
            success: function(res) {
                res = calculateObjectValue(that.options, that.options.responseHandler, [res], res);

                that.load(res);
                that.trigger('load-success', res);
                if (!silent) that.$tableLoading.hide();
            },
            error: function(res) {
                var data = [];
                if (that.options.sidePagination === 'server') {
                    data = {};
                    data[that.options.totalField] = 0;
                    data[that.options.dataField] = [];
                }
                that.load(data);
                that.trigger('load-error', res.status, res);
                if (!silent) that.$tableLoading.hide();
            }
        });

        if (this.options.ajax) {
            calculateObjectValue(this, this.options.ajax, [request], null);
        } else {
            if (this._xhr && this._xhr.readyState !== 4) {
                this._xhr.abort();
            }
            this._xhr = $.ajax(request);
        }
    };

    KuiTable.prototype.initSearchText = function() {
        if (this.options.search) {
            this.searchText = '';
            if (this.options.searchText !== '') {
                var $search = this.$toolbar.find('.search input');
                $search.val(this.options.searchText);
                this.onSearch({
                    currentTarget: $search,
                    firedByInitSearchText: true
                });
            }
        }
    };

    KuiTable.prototype.getCaret = function() {
        var that = this;

        $.each(this.$header.find('th'), function(i, th) {
            $(th).find('.sortable').removeClass('desc asc').addClass($(th).data('field') === that.options.sortName ? that.options.sortOrder : 'both');
        });
    };

    KuiTable.prototype.updateSelected = function() {
        var checkAll = this.$selectItem.filter(':enabled').length &&
            this.$selectItem.filter(':enabled').length ===
            this.$selectItem.filter(':enabled').filter(':checked').length;

        this.$selectAll.add(this.$selectAll_).prop('checked', checkAll);

        this.$selectItem.each(function() {
            $(this).closest('tr')[$(this).prop('checked') ? 'addClass' : 'removeClass']('selected');
        });
    };

    KuiTable.prototype.updateRows = function() {
        var that = this;

        this.$selectItem.each(function() {
            that.data[$(this).data('index')][that.header.stateField] = $(this).prop('checked');
        });
    };

    KuiTable.prototype.resetRows = function() {
        var that = this;

        $.each(this.data, function(i, row) {
            that.$selectAll.prop('checked', false);
            that.$selectItem.prop('checked', false);
            if (that.header.stateField) {
                row[that.header.stateField] = false;
            }
        });
        this.initHiddenRows();
    };

    KuiTable.prototype.trigger = function(name) {
        var args = Array.prototype.slice.call(arguments, 1);

        name += '.bs.table';
        this.options[KuiTable.EVENTS[name]].apply(this.options, args);
        this.$el.trigger($.Event(name), args);

        this.options.onAll(name, args);
        this.$el.trigger($.Event('all.bs.table'), [name, args]);
    };

    KuiTable.prototype.resetHeader = function() {
        // fix #61: the hidden table reset header bug.
        // fix bug: get $el.css('width') error sometime (height = 500)
        clearTimeout(this.timeoutId_);
        this.timeoutId_ = setTimeout($.proxy(this.fitHeader, this), this.$el.is(':hidden') ? 100 : 0);
    };

    KuiTable.prototype.fitHeader = function() {
        var that = this,
            fixedBody,
            scrollWidth,
            focused,
            focusedTemp;

        if (that.$el.is(':hidden')) {
            that.timeoutId_ = setTimeout($.proxy(that.fitHeader, that), 100);
            return;
        }
        fixedBody = this.$tableBody.get(0);

        scrollWidth = fixedBody.scrollWidth > fixedBody.clientWidth &&
            fixedBody.scrollHeight > fixedBody.clientHeight + this.$header.outerHeight() ?
            getScrollBarWidth() : 0;

        this.$el.css('margin-top', -this.$header.outerHeight());

        focused = $(':focus');
        if (focused.length > 0) {
            var $th = focused.parents('th');
            if ($th.length > 0) {
                var dataField = $th.attr('data-field');
                if (dataField !== undefined) {
                    var $headerTh = this.$header.find("[data-field='" + dataField + "']");
                    if ($headerTh.length > 0) {
                        $headerTh.find(":input").addClass("focus-temp");
                    }
                }
            }
        }

        this.$header_ = this.$header.clone(true, true);
        this.$selectAll_ = this.$header_.find('[name="btSelectAll"]');
        this.$tableHeader.css({
                'margin-right': scrollWidth
            }).find('table').css('width', this.$el.outerWidth())
            .html('').attr('class', this.$el.attr('class'))
            .append(this.$header_);

        focusedTemp = $('.focus-temp:visible:eq(0)');
        if (focusedTemp.length > 0) {
            focusedTemp.focus();
            this.$header.find('.focus-temp').removeClass('focus-temp');
        }

        // fix bug: $.data() is not working as expected after $.append()
        this.$header.find('th[data-field]').each(function(i) {
            that.$header_.find(sprintf('th[data-field="%s"]', $(this).data('field'))).data($(this).data());
        });

        var visibleFields = this.getVisibleFields(),
            $ths = this.$header_.find('th');

        this.$body.find('>tr:first-child:not(.no-records-found) > *').each(function(i) {
            var $this = $(this),
                index = i;

            if (that.options.detailView && !that.options.cardView) {
                if (i === 0) {
                    that.$header_.find('th.detail').find('.fht-cell').width($this.innerWidth());
                }
                index = i - 1;
            }

            if (index === -1) {
                return;
            }

            var $th = that.$header_.find(sprintf('th[data-field="%s"]', visibleFields[index]));
            if ($th.length > 1) {
                $th = $($ths[$this[0].cellIndex]);
            }

            var zoomWidth = $th.width() - $th.find('.fht-cell').width();
            $th.find('.fht-cell').width($this.innerWidth() - zoomWidth);
        });

        this.horizontalScroll();
        this.trigger('post-header');
    };

    KuiTable.prototype.resetFooter = function() {
        var that = this,
            data = that.getData(),
            html = [];

        if (!this.options.showFooter || this.options.cardView) { //do nothing
            return;
        }

        if (!this.options.cardView && this.options.detailView) {
            html.push('<td><div class="th-inner">&nbsp;</div><div class="fht-cell"></div></td>');
        }

        $.each(this.columns, function(i, column) {
            var key,
                falign = '', // footer align style
                valign = '',
                csses = [],
                style = {},
                class_ = sprintf(' class="%s"', column['class']);

            if (!column.visible) {
                return;
            }

            if (that.options.cardView && (!column.cardVisible)) {
                return;
            }

            falign = sprintf('text-align: %s; ', column.falign ? column.falign : column.align);
            valign = sprintf('vertical-align: %s; ', column.valign);

            style = calculateObjectValue(null, that.options.footerStyle);

            if (style && style.css) {
                for (key in style.css) {
                    csses.push(key + ': ' + style.css[key]);
                }
            }

            html.push('<td', class_, sprintf(' style="%s"', falign + valign + csses.concat().join('; ')), '>');
            html.push('<div class="th-inner">');

            html.push(calculateObjectValue(column, column.footerFormatter, [data], '&nbsp;') || '&nbsp;');

            html.push('</div>');
            html.push('<div class="fht-cell"></div>');
            html.push('</div>');
            html.push('</td>');
        });

        this.$tableFooter.find('tr').html(html.join(''));
        this.$tableFooter.show();
        clearTimeout(this.timeoutFooter_);
        this.timeoutFooter_ = setTimeout($.proxy(this.fitFooter, this),
            this.$el.is(':hidden') ? 100 : 0);
    };

    KuiTable.prototype.fitFooter = function() {
        var that = this,
            $footerTd,
            elWidth,
            scrollWidth;

        clearTimeout(this.timeoutFooter_);
        if (this.$el.is(':hidden')) {
            this.timeoutFooter_ = setTimeout($.proxy(this.fitFooter, this), 100);
            return;
        }

        elWidth = this.$el.css('width');
        scrollWidth = elWidth > this.$tableBody.width() ? getScrollBarWidth() : 0;

        this.$tableFooter.css({
                'margin-right': scrollWidth
            }).find('table').css('width', elWidth)
            .attr('class', this.$el.attr('class'));

        $footerTd = this.$tableFooter.find('td');

        this.$body.find('>tr:first-child:not(.no-records-found) > *').each(function(i) {
            var $this = $(this);

            $footerTd.eq(i).find('.fht-cell').width($this.innerWidth());
        });

        this.horizontalScroll();
    };

    KuiTable.prototype.horizontalScroll = function() {
        var that = this;
        // horizontal scroll event
        // TODO: it's probably better improving the layout than binding to scroll event

        that.trigger('scroll-body');
        this.$tableBody.off('scroll').on('scroll', function() {
            if (that.options.showHeader && that.options.height) {
                that.$tableHeader.scrollLeft($(this).scrollLeft());
            }

            if (that.options.showFooter && !that.options.cardView) {
                that.$tableFooter.scrollLeft($(this).scrollLeft());
            }
        });
    };

    KuiTable.prototype.toggleColumn = function(index, checked, needUpdate) {
        if (index === -1) {
            return;
        }
        this.columns[index].visible = checked;
        this.initHeader();
        this.initSearch();
        this.initPagination();
        this.initBody();

        if (this.options.showColumns) {
            var $items = this.$toolbar.find('.keep-open input').prop('disabled', false);

            if (needUpdate) {
                $items.filter(sprintf('[value="%s"]', index)).prop('checked', checked);
            }

            if ($items.filter(':checked').length <= this.options.minimumCountColumns) {
                $items.filter(':checked').prop('disabled', true);
            }
        }
    };

    KuiTable.prototype.getVisibleFields = function() {
        var that = this,
            visibleFields = [];

        $.each(this.header.fields, function(j, field) {
            var column = that.columns[that.fieldsColumnsIndex[field]];

            if (!column.visible) {
                return;
            }
            visibleFields.push(field);
        });
        return visibleFields;
    };

    // PUBLIC FUNCTION DEFINITION
    // =======================

    KuiTable.prototype.resetView = function(params) {
        var padding = 0;

        if (params && params.height) {
            this.options.height = params.height;
        }

        this.$selectAll.prop('checked', this.$selectItem.length > 0 &&
            this.$selectItem.length === this.$selectItem.filter(':checked').length);

        if (this.options.height) {
            var toolbarHeight = this.$toolbar.outerHeight(true),
                paginationHeight = this.$pagination.outerHeight(true),
                height = this.options.height - toolbarHeight - paginationHeight;

            this.$tableContainer.css('height', height + 'px');
        }

        if (this.options.cardView) {
            // remove the element css
            this.$el.css('margin-top', '0');
            this.$tableContainer.css('padding-bottom', '0');
            this.$tableFooter.hide();
            return;
        }

        if (this.options.showHeader && this.options.height) {
            this.$tableHeader.show();
            this.resetHeader();
            padding += this.$header.outerHeight();
        } else {
            this.$tableHeader.hide();
            this.trigger('post-header');
        }

        if (this.options.showFooter) {
            this.resetFooter();
            if (this.options.height) {
                padding += this.$tableFooter.outerHeight() + 1;
            }
        }

        // Assign the correct sortable arrow
        this.getCaret();
        this.$tableContainer.css('padding-bottom', padding + 'px');
        this.trigger('reset-view');
    };

    KuiTable.prototype.getData = function(useCurrentPage) {
        var data = this.options.data;
        if (this.searchText || this.options.sortName || !$.isEmptyObject(this.filterColumns) || !$.isEmptyObject(this.filterColumnsPartial)) {
            data = this.data;
        }

        if (useCurrentPage) {
            return data.slice(this.pageFrom - 1, this.pageTo);
        }

        return data;
    };

    KuiTable.prototype.load = function(data) {
        var fixedScroll = false;

        // #431: support pagination
        if (this.options.pagination && this.options.sidePagination === 'server') {
            this.options.totalRows = data[this.options.totalField];
            fixedScroll = data.fixedScroll;
            data = data[this.options.dataField];
        } else if (!$.isArray(data)) { // support fixedScroll
            fixedScroll = data.fixedScroll;
            data = data.data;
        }

        this.initData(data);
        this.initSearch();
        this.initPagination();
        this.initBody(fixedScroll);
    };

    KuiTable.prototype.append = function(data) {
        this.initData(data, 'append');
        this.initSearch();
        this.initPagination();
        this.initSort();
        this.initBody(true);
    };

    KuiTable.prototype.prepend = function(data) {
        this.initData(data, 'prepend');
        this.initSearch();
        this.initPagination();
        this.initSort();
        this.initBody(true);
    };

    KuiTable.prototype.remove = function(params) {
        var len = this.options.data.length,
            i, row;

        if (!params.hasOwnProperty('field') || !params.hasOwnProperty('values')) {
            return;
        }

        for (i = len - 1; i >= 0; i--) {
            row = this.options.data[i];

            if (!row.hasOwnProperty(params.field)) {
                continue;
            }
            if ($.inArray(row[params.field], params.values) !== -1) {
                this.options.data.splice(i, 1);
                if (this.options.sidePagination === 'server') {
                    this.options.totalRows -= 1;
                }
            }
        }

        if (len === this.options.data.length) {
            return;
        }

        this.initSearch();
        this.initPagination();
        this.initSort();
        this.initBody(true);
    };

    KuiTable.prototype.removeAll = function() {
        if (this.options.data.length > 0) {
            this.options.data.splice(0, this.options.data.length);
            this.initSearch();
            this.initPagination();
            this.initBody(true);
        }
    };

    KuiTable.prototype.getRowByUniqueId = function(id) {
        var uniqueId = this.options.uniqueId,
            len = this.options.data.length,
            dataRow = null,
            i, row, rowUniqueId;

        for (i = len - 1; i >= 0; i--) {
            row = this.options.data[i];

            if (row.hasOwnProperty(uniqueId)) { // uniqueId is a column
                rowUniqueId = row[uniqueId];
            } else if (row._data.hasOwnProperty(uniqueId)) { // uniqueId is a row data property
                rowUniqueId = row._data[uniqueId];
            } else {
                continue;
            }

            if (typeof rowUniqueId === 'string') {
                id = id.toString();
            } else if (typeof rowUniqueId === 'number') {
                if ((Number(rowUniqueId) === rowUniqueId) && (rowUniqueId % 1 === 0)) {
                    id = parseInt(id);
                } else if ((rowUniqueId === Number(rowUniqueId)) && (rowUniqueId !== 0)) {
                    id = parseFloat(id);
                }
            }

            if (rowUniqueId === id) {
                dataRow = row;
                break;
            }
        }

        return dataRow;
    };

    KuiTable.prototype.removeByUniqueId = function(id) {
        var len = this.options.data.length,
            row = this.getRowByUniqueId(id);

        if (row) {
            this.options.data.splice(this.options.data.indexOf(row), 1);
        }

        if (len === this.options.data.length) {
            return;
        }

        this.initSearch();
        this.initPagination();
        this.initBody(true);
    };

    KuiTable.prototype.updateByUniqueId = function(params) {
        var that = this;
        var allParams = $.isArray(params) ? params : [params];

        $.each(allParams, function(i, params) {
            var rowId;

            if (!params.hasOwnProperty('id') || !params.hasOwnProperty('row')) {
                return;
            }

            rowId = $.inArray(that.getRowByUniqueId(params.id), that.options.data);

            if (rowId === -1) {
                return;
            }
            $.extend(that.options.data[rowId], params.row);
        });

        this.initSearch();
        this.initPagination();
        this.initSort();
        this.initBody(true);
    };

    KuiTable.prototype.refreshColumnTitle = function(params) {
        if (!params.hasOwnProperty('field') || !params.hasOwnProperty('title')) {
            return;
        }

        this.columns[this.fieldsColumnsIndex[params.field]].title =
            this.options.escape ? escapeHTML(params.title) : params.title;

        if (this.columns[this.fieldsColumnsIndex[params.field]].visible) {
            var header = this.options.height !== undefined ? this.$tableHeader : this.$header;
            header.find('th[data-field]').each(function(i) {
                if ($(this).data('field') === params.field) {
                    $($(this).find(".th-inner")[0]).text(params.title);
                    return false;
                }
            });
        }
    };

    KuiTable.prototype.insertRow = function(params) {
        if (!params.hasOwnProperty('index') || !params.hasOwnProperty('row')) {
            return;
        }
        this.options.data.splice(params.index, 0, params.row);
        this.initSearch();
        this.initPagination();
        this.initSort();
        this.initBody(true);
    };

    KuiTable.prototype.updateRow = function(params) {
        var that = this;
        var allParams = $.isArray(params) ? params : [params];

        $.each(allParams, function(i, params) {
            if (!params.hasOwnProperty('index') || !params.hasOwnProperty('row')) {
                return;
            }
            $.extend(that.options.data[params.index], params.row);
        });

        this.initSearch();
        this.initPagination();
        this.initSort();
        this.initBody(true);
    };

    KuiTable.prototype.initHiddenRows = function() {
        this.hiddenRows = [];
    };

    KuiTable.prototype.showRow = function(params) {
        this.toggleRow(params, true);
    };

    KuiTable.prototype.hideRow = function(params) {
        this.toggleRow(params, false);
    };

    KuiTable.prototype.toggleRow = function(params, visible) {
        var row, index;

        if (params.hasOwnProperty('index')) {
            row = this.getData()[params.index];
        } else if (params.hasOwnProperty('uniqueId')) {
            row = this.getRowByUniqueId(params.uniqueId);
        }

        if (!row) {
            return;
        }

        index = $.inArray(row, this.hiddenRows);

        if (!visible && index === -1) {
            this.hiddenRows.push(row);
        } else if (visible && index > -1) {
            this.hiddenRows.splice(index, 1);
        }
        this.initBody(true);
    };

    KuiTable.prototype.getHiddenRows = function(show) {
        var that = this,
            data = this.getData(),
            rows = [];

        $.each(data, function(i, row) {
            if ($.inArray(row, that.hiddenRows) > -1) {
                rows.push(row);
            }
        });
        this.hiddenRows = rows;
        return rows;
    };

    KuiTable.prototype.mergeCells = function(options) {
        var row = options.index,
            col = $.inArray(options.field, this.getVisibleFields()),
            rowspan = options.rowspan || 1,
            colspan = options.colspan || 1,
            i, j,
            $tr = this.$body.find('>tr'),
            $td;

        if (this.options.detailView && !this.options.cardView) {
            col += 1;
        }

        $td = $tr.eq(row).find('>td').eq(col);

        if (row < 0 || col < 0 || row >= this.data.length) {
            return;
        }

        for (i = row; i < row + rowspan; i++) {
            for (j = col; j < col + colspan; j++) {
                $tr.eq(i).find('>td').eq(j).hide();
            }
        }

        $td.attr('rowspan', rowspan).attr('colspan', colspan).show();
    };

    KuiTable.prototype.updateCell = function(params) {
        if (!params.hasOwnProperty('index') ||
            !params.hasOwnProperty('field') ||
            !params.hasOwnProperty('value')) {
            return;
        }
        this.data[params.index][params.field] = params.value;

        if (params.reinit === false) {
            return;
        }
        this.initSort();
        this.initBody(true);
    };

    KuiTable.prototype.updateCellById = function(params) {
        var that = this;
        if (!params.hasOwnProperty('id') ||
            !params.hasOwnProperty('field') ||
            !params.hasOwnProperty('value')) {
            return;
        }
        var allParams = $.isArray(params) ? params : [params];

        $.each(allParams, function(i, params) {
            var rowId;

            rowId = $.inArray(that.getRowByUniqueId(params.id), that.options.data);

            if (rowId === -1) {
                return;
            }
            that.data[rowId][params.field] = params.value;
        });

        if (params.reinit === false) {
            return;
        }
        this.initSort();
        this.initBody(true);
    };

    KuiTable.prototype.getOptions = function() {
        //Deep copy
        return $.extend(true, {}, this.options);
    };

    KuiTable.prototype.getSelections = function() {
        var that = this;

        return $.grep(this.options.data, function(row) {
            // fix #2424: from html with checkbox
            return row[that.header.stateField] === true;
        });
    };

    KuiTable.prototype.getAllSelections = function() {
        var that = this;

        return $.grep(this.options.data, function(row) {
            return row[that.header.stateField];
        });
    };

    KuiTable.prototype.checkAll = function() {
        this.checkAll_(true);
    };

    KuiTable.prototype.uncheckAll = function() {
        this.checkAll_(false);
    };

    KuiTable.prototype.checkInvert = function() {
        var that = this;
        var rows = that.$selectItem.filter(':enabled');
        var checked = rows.filter(':checked');
        rows.each(function() {
            $(this).prop('checked', !$(this).prop('checked'));
        });
        that.updateRows();
        that.updateSelected();
        that.trigger('uncheck-some', checked);
        checked = that.getSelections();
        that.trigger('check-some', checked);
    };

    KuiTable.prototype.checkAll_ = function(checked) {
        var rows;
        if (!checked) {
            rows = this.getSelections();
        }
        this.$selectAll.add(this.$selectAll_).prop('checked', checked);
        this.$selectItem.filter(':enabled').prop('checked', checked);
        this.updateRows();
        if (checked) {
            rows = this.getSelections();
        }
        this.trigger(checked ? 'check-all' : 'uncheck-all', rows);
    };

    KuiTable.prototype.check = function(index) {
        this.check_(true, index);
    };

    KuiTable.prototype.uncheck = function(index) {
        this.check_(false, index);
    };

    KuiTable.prototype.check_ = function(checked, index) {
        var $el = this.$selectItem.filter(sprintf('[data-index="%s"]', index)).prop('checked', checked);
        this.data[index][this.header.stateField] = checked;
        this.updateSelected();
        this.trigger(checked ? 'check' : 'uncheck', this.data[index], $el);
    };

    KuiTable.prototype.checkBy = function(obj) {
        this.checkBy_(true, obj);
    };

    KuiTable.prototype.uncheckBy = function(obj) {
        this.checkBy_(false, obj);
    };

    KuiTable.prototype.checkBy_ = function(checked, obj) {
        if (!obj.hasOwnProperty('field') || !obj.hasOwnProperty('values')) {
            return;
        }

        var that = this,
            rows = [];
        $.each(this.options.data, function(index, row) {
            if (!row.hasOwnProperty(obj.field)) {
                return false;
            }
            if ($.inArray(row[obj.field], obj.values) !== -1) {
                var $el = that.$selectItem.filter(':enabled')
                    .filter(sprintf('[data-index="%s"]', index)).prop('checked', checked);
                row[that.header.stateField] = checked;
                rows.push(row);
                that.trigger(checked ? 'check' : 'uncheck', row, $el);
            }
        });
        this.updateSelected();
        this.trigger(checked ? 'check-some' : 'uncheck-some', rows);
    };

    KuiTable.prototype.destroy = function() {
        this.$el.insertBefore(this.$container);
        $(this.options.toolbar).insertBefore(this.$el);
        this.$container.next().remove();
        this.$container.remove();
        this.$el.html(this.$el_.html())
            .css('margin-top', '0')
            .attr('class', this.$el_.attr('class') || ''); // reset the class
    };

    KuiTable.prototype.showLoading = function() {
        this.$tableLoading.show();
    };

    KuiTable.prototype.hideLoading = function() {
        this.$tableLoading.hide();
    };

    KuiTable.prototype.togglePagination = function() {
        this.options.pagination = !this.options.pagination;
        var button = this.$toolbar.find('button[name="paginationSwitch"] i');
        if (this.options.pagination) {
            button.attr("class", this.options.iconsPrefix + " " + this.options.icons.paginationSwitchDown);
        } else {
            button.attr("class", this.options.iconsPrefix + " " + this.options.icons.paginationSwitchUp);
        }
        this.updatePagination();
    };

    KuiTable.prototype.toggleFullscreen = function() {
        this.$el.closest('.table').toggleClass('fullscreen');
    };

    KuiTable.prototype.refresh = function(params) {
        if (params && params.url) {
            this.options.url = params.url;
        }
        if (params && params.pageNumber) {
            this.options.pageNumber = params.pageNumber;
        }
        if (params && params.pageSize) {
            this.options.pageSize = params.pageSize;
        }
        this.initServer(params && params.silent,
            params && params.query, params && params.url);
        this.trigger('refresh', params);
    };

    KuiTable.prototype.resetWidth = function() {
        if (this.options.showHeader && this.options.height) {
            this.fitHeader();
        }
        if (this.options.showFooter && !this.options.cardView) {
            this.fitFooter();
        }
    };

    KuiTable.prototype.showColumn = function(field) {
        this.toggleColumn(this.fieldsColumnsIndex[field], true, true);
    };

    KuiTable.prototype.hideColumn = function(field) {
        this.toggleColumn(this.fieldsColumnsIndex[field], false, true);
    };

    KuiTable.prototype.getHiddenColumns = function() {
        return $.grep(this.columns, function(column) {
            return !column.visible;
        });
    };

    KuiTable.prototype.getVisibleColumns = function() {
        return $.grep(this.columns, function(column) {
            return column.visible;
        });
    };

    KuiTable.prototype.toggleAllColumns = function(visible) {
        var that = this;
        $.each(this.columns, function(i, column) {
            that.columns[i].visible = visible;
        });

        this.initHeader();
        this.initSearch();
        this.initPagination();
        this.initBody();
        if (this.options.showColumns) {
            var $items = this.$toolbar.find('.keep-open input').prop('disabled', false);

            if ($items.filter(':checked').length <= this.options.minimumCountColumns) {
                $items.filter(':checked').prop('disabled', true);
            }
        }
    };

    KuiTable.prototype.showAllColumns = function() {
        this.toggleAllColumns(true);
    };

    KuiTable.prototype.hideAllColumns = function() {
        this.toggleAllColumns(false);
    };

    KuiTable.prototype.filterBy = function(columns) {
        this.filterColumns = $.isEmptyObject(columns) ? {} : columns;
        this.options.pageNumber = 1;
        this.initSearch();
        this.updatePagination();
    };

    KuiTable.prototype.scrollTo = function(value) {
        if (typeof value === 'string') {
            value = value === 'bottom' ? this.$tableBody[0].scrollHeight : 0;
        }
        if (typeof value === 'number') {
            this.$tableBody.scrollTop(value);
        }
        if (typeof value === 'undefined') {
            return this.$tableBody.scrollTop();
        }
    };

    KuiTable.prototype.getScrollPosition = function() {
        return this.scrollTo();
    };

    KuiTable.prototype.selectPage = function(page) {
        if (page > 0 && page <= this.options.totalPages) {
            this.options.pageNumber = page;
            this.updatePagination();
        }
    };

    KuiTable.prototype.prevPage = function() {
        if (this.options.pageNumber > 1) {
            this.options.pageNumber--;
            this.updatePagination();
        }
    };

    KuiTable.prototype.nextPage = function() {
        if (this.options.pageNumber < this.options.totalPages) {
            this.options.pageNumber++;
            this.updatePagination();
        }
    };

    KuiTable.prototype.toggleView = function() {
        this.options.cardView = !this.options.cardView;
        this.initHeader();
        // Fixed remove toolbar when click cardView button.
        //that.initToolbar();
        var $icon = this.$toolbar.find('button[name="toggle"] i');
        if (this.options.cardView) {
            $icon.removeClass(this.options.icons.toggleOff);
            $icon.addClass(this.options.icons.toggleOn);
        } else {
            $icon.removeClass(this.options.icons.toggleOn);
            $icon.addClass(this.options.icons.toggleOff);
        }
        this.initBody();
        this.trigger('toggle', this.options.cardView);
    };

    KuiTable.prototype.refreshOptions = function(options) {
        //If the objects are equivalent then avoid the call of destroy / init methods
        if (compareObjects(this.options, options, true)) {
            return;
        }
        this.options = $.extend(this.options, options);
        this.trigger('refresh-options', this.options);
        this.destroy();
        this.init();
    };

    KuiTable.prototype.resetSearch = function(text) {
        var $search = this.$toolbar.find('.search input');
        $search.val(text || '');
        this.onSearch({
            currentTarget: $search
        });
    };

    KuiTable.prototype.expandRow_ = function(expand, index) {
        var $tr = this.$body.find(sprintf('> tr[data-index="%s"]', index));
        if ($tr.next().is('tr.detail-view') === (expand ? false : true)) {
            $tr.find('> td > .detail-icon').click();
        }
    };

    KuiTable.prototype.expandRow = function(index) {
        this.expandRow_(true, index);
    };

    KuiTable.prototype.collapseRow = function(index) {
        this.expandRow_(false, index);
    };

    KuiTable.prototype.expandAllRows = function(isSubTable) {
        if (isSubTable) {
            var $tr = this.$body.find(sprintf('> tr[data-index="%s"]', 0)),
                that = this,
                detailIcon = null,
                executeInterval = false,
                idInterval = -1;

            if (!$tr.next().is('tr.detail-view')) {
                $tr.find('> td > .detail-icon').click();
                executeInterval = true;
            } else if (!$tr.next().next().is('tr.detail-view')) {
                $tr.next().find(".detail-icon").click();
                executeInterval = true;
            }

            if (executeInterval) {
                try {
                    idInterval = setInterval(function() {
                        detailIcon = that.$body.find("tr.detail-view").last().find(".detail-icon");
                        if (detailIcon.length > 0) {
                            detailIcon.click();
                        } else {
                            clearInterval(idInterval);
                        }
                    }, 1);
                } catch (ex) {
                    clearInterval(idInterval);
                }
            }
        } else {
            var trs = this.$body.children();
            for (var i = 0; i < trs.length; i++) {
                this.expandRow_(true, $(trs[i]).data("index"));
            }
        }
    };

    KuiTable.prototype.collapseAllRows = function(isSubTable) {
        if (isSubTable) {
            this.expandRow_(false, 0);
        } else {
            var trs = this.$body.children();
            for (var i = 0; i < trs.length; i++) {
                this.expandRow_(false, $(trs[i]).data("index"));
            }
        }
    };

    KuiTable.prototype.updateFormatText = function(name, text) {
        if (this.options[sprintf('format%s', name)]) {
            if (typeof text === 'string') {
                this.options[sprintf('format%s', name)] = function() {
                    return text;
                };
            } else if (typeof text === 'function') {
                this.options[sprintf('format%s', name)] = text;
            }
        }
        this.initToolbar();
        this.initPagination();
        this.initBody();
    };

    // BOOTSTRAP TABLE PLUGIN DEFINITION
    // =======================

    var allowedMethods = [
        'getOptions',
        'getSelections', 'getAllSelections', 'getData',
        'load', 'append', 'prepend', 'remove', 'removeAll',
        'insertRow', 'updateRow', 'updateCell', 'updateByUniqueId', 'removeByUniqueId',
        'getRowByUniqueId', 'showRow', 'hideRow', 'getHiddenRows',
        'mergeCells', 'refreshColumnTitle',
        'checkAll', 'uncheckAll', 'checkInvert',
        'check', 'uncheck',
        'checkBy', 'uncheckBy',
        'refresh',
        'resetView',
        'resetWidth',
        'destroy',
        'showLoading', 'hideLoading',
        'showColumn', 'hideColumn', 'getHiddenColumns', 'getVisibleColumns',
        'showAllColumns', 'hideAllColumns',
        'filterBy',
        'scrollTo',
        'getScrollPosition',
        'selectPage', 'prevPage', 'nextPage',
        'togglePagination',
        'toggleView',
        'refreshOptions',
        'resetSearch',
        'expandRow', 'collapseRow', 'expandAllRows', 'collapseAllRows',
        'updateFormatText', 'updateCellById'
    ];

    $.fn.kuiTable = function(option) {
        var value,
            args = Array.prototype.slice.call(arguments, 1);

        this.each(function() {
            var $this = $(this),
                data = $this.data('bootstrap.table'),
                options = $.extend({}, KuiTable.DEFAULTS, $this.data(),
                    typeof option === 'object' && option);

            if (typeof option === 'string') {
                if ($.inArray(option, allowedMethods) < 0) {
                    throw new Error("Unknown method: " + option);
                }

                if (!data) {
                    return;
                }

                value = data[option].apply(data, args);

                if (option === 'destroy') {
                    $this.removeData('bootstrap.table');
                }
            }

            if (!data) {
                $this.data('bootstrap.table', (data = new KuiTable(this, options)));
            }
        });

        return typeof value === 'undefined' ? this : value;
    };

    $.fn.kuiTable.Constructor = KuiTable;
    $.fn.kuiTable.defaults = KuiTable.DEFAULTS;
    $.fn.kuiTable.columnDefaults = KuiTable.COLUMN_DEFAULTS;
    $.fn.kuiTable.locales = KuiTable.LOCALES;
    $.fn.kuiTable.methods = allowedMethods;
    $.fn.kuiTable.utils = {
        kuiVersion: kuiVersion,
        sprintf: sprintf,
        compareObjects: compareObjects,
        calculateObjectValue: calculateObjectValue,
        getItemField: getItemField,
        objectKeys: objectKeys,
        isIEBrowser: isIEBrowser
    };

    // BOOTSTRAP TABLE INIT
    // =======================

    $(function() {
        $('[data-toggle="table"]').kuiTable();
    });
})(jQuery);

/**
 * @author: Dennis Hernández  bootstrap-table-mobile.js
 * @webSite: http://djhvscf.github.io/Blog
 * @version: v1.1.0
 */

! function($) {

    'use strict';

    var showHideColumns = function(that, checked) {
        if (that.options.columnsHidden.length > 0) {
            $.each(that.columns, function(i, column) {
                if (that.options.columnsHidden.indexOf(column.field) !== -1) {
                    if (column.visible !== checked) {
                        that.toggleColumn(that.fieldsColumnsIndex[column.field], checked, true);
                    }
                }
            });
        }
    };

    var resetView = function(that) {
        if (that.options.height || that.options.showFooter) {
            setTimeout(function() {
                that.resetView.call(that);
            }, 1);
        }
    };

    var changeView = function(that, width, height) {
        if (that.options.minHeight) {
            if ((width <= that.options.minWidth) && (height <= that.options.minHeight)) {
                conditionCardView(that);
            } else if ((width > that.options.minWidth) && (height > that.options.minHeight)) {
                conditionFullView(that);
            }
        } else {
            if (width <= that.options.minWidth) {
                conditionCardView(that);
            } else if (width > that.options.minWidth) {
                conditionFullView(that);
            }
        }

        resetView(that);
    };

    var conditionCardView = function(that) {
        changeTableView(that, false);
        showHideColumns(that, false);
    };

    var conditionFullView = function(that) {
        changeTableView(that, true);
        showHideColumns(that, true);
    };

    var changeTableView = function(that, cardViewState) {
        that.options.cardView = cardViewState;
        that.toggleView();
    };

    var debounce = function(func, wait) {
        var timeout;
        return function() {
            var context = this,
                args = arguments;
            var later = function() {
                timeout = null;
                func.apply(context, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    $.extend($.fn.kuiTable.defaults, {
        mobileResponsive: false,
        minWidth: 562,
        minHeight: undefined,
        heightThreshold: 100, // just slightly larger than mobile chrome's auto-hiding toolbar
        checkOnInit: true,
        columnsHidden: []
    });

    var KuiTable = $.fn.kuiTable.Constructor,
        _init = KuiTable.prototype.init;

    KuiTable.prototype.init = function() {
        _init.apply(this, Array.prototype.slice.apply(arguments));

        if (!this.options.mobileResponsive) {
            return;
        }

        if (!this.options.minWidth) {
            return;
        }

        if (this.options.minWidth < 100 && this.options.resizable) {
            console.log("可调整大小的扩展名处于活动状态时的最小宽度应大于或等于100");
            this.options.minWidth = 100;
        }

        var that = this,
            old = {
                width: $(window).width(),
                height: $(window).height()
            };

        $(window).on('resize orientationchange', debounce(function(evt) {
            // reset view if height has only changed by at least the threshold.
            var height = $(this).height(),
                width = $(this).width();

            if (Math.abs(old.height - height) > that.options.heightThreshold || old.width != width) {
                changeView(that, width, height);
                old = {
                    width: width,
                    height: height
                };
            }
        }, 200));

        if (this.options.checkOnInit) {
            var height = $(window).height(),
                width = $(window).width();
            changeView(this, width, height);
            old = {
                width: width,
                height: height
            };
        }
    };
}(jQuery);

(function(document, $) {
    'use strict';
    $["kui"]["hover"] = {
        '$instance': $(".kui-hover"),
        'storageKey': "kui.hover",
        "init": function() {
            var _this = $(this),
                svg = "<svg width=\"0\" height=\"0\"><defs><filter id=\"goo\"><feGaussianBlur in=\"SourceGraphic\" stdDeviation=\"10\" result=\"blur\"></feGaussianBlur>" +
                " <feColorMatrix in=\"blur\" mode=\"matrix\" values=\"1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9\" result=\"goo\"></feColorMatrix>" +
                " <feComposite in=\"SourceGraphic\" in2=\"goo\" operator=\"atop\"></feComposite></filter></defs></svg>";
            _this[0].$instance.append(svg);
            this['bind']();
        },
        'bind': function() {
            var _this = $(this),
                hover = _this[0].$instance["find"](".kui-hover-nav"),
                ua = navigator.userAgent;
            /Safari|iPhone/i.test(ua) && 0 == /chrome/i.test(ua) && hover.addClass("no-filter");
            var drags = {
                    down: !1,
                    x: 0,
                    y: 0,
                    winWid: 0,
                    winHei: 0,
                    clientX: 0,
                    clientY: 0
                },
                asideNav = hover[0],
                getCss = function(a, e) {
                    return a.currentStyle ? a.currentStyle[e] : document.defaultView.getComputedStyle(a, !1)[e]
                };
            hover.on("mousedown", function(a) {
                drags.down = !0,
                    drags.clientX = a.clientX,
                    drags.clientY = a.clientY,
                    drags.x = getCss(this, "right"),
                    drags.y = getCss(this, "top"),
                    drags.winHei = $(window).height(),
                    drags.winWid = $(window).width(),
                    $(document).on("mousemove", function(a) {
                        if (drags.winWid > 640 && (a.clientX < 120 || a.clientX > drags.winWid - 50)) //50px
                            return !1 /*,console.log(!1)*/ ;
                        if (a.clientY < 180 || a.clientY > drags.winHei - 120) //导航高度
                            return !1;
                        var e = a.clientX - drags.clientX,
                            t = a.clientY - drags.clientY;
                        asideNav.style.top = parseInt(drags.y) + t + "px";
                        asideNav.style.right = parseInt(drags.x) - e + "px";
                    })
            }).on("mouseup", function() {
                drags.down = !1, $(document).off("mousemove")
            });
        }
    };
    //run kuihover
    $(function() {
        $["kui"]["hover"].init();
    });

})(document, jQuery);
/**
 * 工具类
 */
(function($) {
    'use strict';
    $["kui"]["util"] = {
        "getUrlParam": function(name) {
            var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
            var r = window.location.search.substr(1).match(reg);
            if (r != null) return unescape(r[2]);
            return null;
        }
    };
})(jQuery);