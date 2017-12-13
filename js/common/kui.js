/**** 
    * Module:jquery
    * Explain:拓展jquery
    * Last Modify:kangbolei 20171121
*****/
(function($, window) {
    'use strict';

    /* Check jquery */
    if(typeof($) === 'undefined') throw new Error('KUI requires jQuery');
 
     // KUI shared object
     if(!$.kui) $.kui = function(obj) {
         if($.isPlainObject(obj)) {
             $.extend($.kui, obj);
         }
     };

    var lastUuidAmend = 0;
    $.kui({
        uuid: function() {
            return(new Date()).getTime() * 1000 + (lastUuidAmend++) % 1000;
        },

        callEvent: function(func, event, proxy) {
            if($.isFunction(func)) {
                if(proxy !== undefined) {
                    func = $.proxy(func, proxy);
                }
                var result = func(event);
                if(event) event.result = result;
                return !(result !== undefined && (!result));
            }
            return 1;
        },

        clientLang: function() {
            var lang;
            var config = window.config;
            if(typeof(config) != 'undefined' && config.clientLang) {
                lang = config.clientLang;
            }
            if(!lang) {
                var hl = $('html').attr('lang');
                lang = hl ? hl : (navigator.userLanguage || navigator.userLanguage || 'zh_cn');
            }
            return lang.replace('-', '_').toLowerCase();
        },

        strCode: function(str) {
            var code = 0;
            if(str && str.length) {
                for(var i = 0; i < str.length; ++i) {
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

        if((model === undefined) && dotIndex > 0) {
            model = $this.data(name.substring(dotIndex + 1));
        }

        if(model && model.options) {
            var func = model.options[shortName];
            if($.isFunction(func)) {
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
        if(actions === false) return actions;
        if(!actions) return parentActions;

        if(actions === true) {
            actions = {add: true, "delete": true, edit: true, sort: true};
        } else if(typeof actions === 'string') {
            actions = actions.split(',');
        }
        var _actions;
        if($.isArray(actions)) {
            _actions = {};
            $.each(actions, function(idx, action) {
                if($.isPlainObject(action)) {
                    _actions[action.action] = action;
                } else {
                    _actions[action] = true;
                }
            });
            actions = _actions;
        }
        if($.isPlainObject(actions)) {
            _actions = {};
            $.each(actions, function(name, action) {
                if(action) {
                    _actions[name] = $.extend({type: name}, DETAULT_ACTIONS[name], $.isPlainObject(action) ? action : null);
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
        return $(template || action.template).addClass('tree-action').attr($.extend({'data-type': name, title: action.title || ''}, action.attr)).data('action', action);
    }

    // default options
    Tree.DEFAULTS = {
        animate: null,
        initialState: 'normal', // 'normal' | 'preserve' | 'expand' | 'collapse',
        toggleTemplate: '<i class="list-toggle fa"></i>',
        // sortable: false, //
    };

    Tree.prototype.add = function(rootEle, items, expand, disabledAnimate, notStore) {
        var $e = $(rootEle), $ul, options = this.options;
        if($e.is('li')) {
            $ul = $e.children('ul');
            if(!$ul.length) {
                $ul = $('<ul/>');
                $e.append($ul);
                this._initList($ul, $e);
            }
        } else {
            $ul = $e;
        }

        if($ul) {
            var that = this;
            if(!$.isArray(items)) {
                items = [items];
            }
            $.each(items, function(idx, item) {
                var $li = $('<li/>').data(item).appendTo($ul);
                if(item.id !== undefined) $li.attr('data-id', item.id);
                var $wrapper = options.itemWrapper ? $(options.itemWrapper === true ? '<div class="tree-item-wrapper"/>' : options.itemWrapper).appendTo($li) : $li;
                if(item.html) {
                    $wrapper.html(item.html)
                } else if($.isFunction(that.options.itemCreator)) {
                    var itemContent = that.options.itemCreator($li, item);
                    if(itemContent !== true && itemContent !== false) $wrapper.html(itemContent);
                } else if(item.url) {
                    $wrapper.append($('<a/>', {href: item.url}).text(item.title || item.name));
                } else {
                    $wrapper.append($('<span/>').text(item.title || item.name));
                }
                that._initItem($li, item.idx || idx, $ul, item);
                if(item.children && item.children.length) {
                    that.add($li, item.children);
                }
            });
            this._initList($ul);
            if(expand && !$ul.hasClass('tree')) {
                that.expand($ul.parent('li'), disabledAnimate, notStore);
            }
        }
    };

    Tree.prototype.reload = function(data) {
        var that = this;

        if(data) {
            that.$.empty();
            that.add(that.$, data);
        }

        if(that.isPreserve)
        {
            if(that.store.time) {
                that.$.find('li:not(.tree-action-item)').each(function() {
                    var $li= $(this);
                    that[that.store[$li.data('id')] ? 'expand' : 'collapse']($li, true, true);
                });
            }
        }
    };

    Tree.prototype._initList = function($list, $parentItem, idx, data) {
        var that = this;
        if(!$list.hasClass('tree')) {
            $parentItem = ($parentItem || $list.closest('li')).addClass('has-list');
            if(!$parentItem.find('.list-toggle').length) {
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
        if($children.length === 1 && !$children.find('ul').length)
        {
            $children.addClass('tree-single-item');
        }
        data = data || ($parentItem ? $parentItem.data() : null);
        var actions = formatActions(data ? data.actions : null, this.actions);
        if(actions) {
            if(actions.add && actions.add.templateInList !== false) {
                var $actionItem = $list.children('li.tree-action-item');
                if(!$actionItem.length) {
                    $('<li class="tree-action-item"/>').append(createActionEle(actions.add, 'add', actions.add.templateInList)).appendTo($list);
                } else {
                    $actionItem.detach().appendTo($list);
                }
            }
            if(actions.sort) {
                $list.sortable($.extend({
                    dragCssClass: 'tree-drag-holder', 
                    trigger: '.sort-handler', 
                    selector: 'li:not(.tree-action-item)',
                    finish: function(e) {
                        that.callEvent('action', {action: actions.sort, $list: $list, target: e.target, item: data});
                    }
                }, actions.sort.options, $.isPlainObject(this.options.sortable) ? this.options.sortable : null));
            }
        }
        if($parentItem && ($parentItem.hasClass('open') || (data && data.open))) {
            $parentItem.addClass('open in');
        }
    };

    Tree.prototype._initItem = function($item, idx, $parentList, data) {
        if(idx === undefined) {
            var $pre = $item.prev('li');
            idx = $pre.length ? ($pre.data('idx') + 1) : 1;
        }
        $parentList = $parentList || $item.closest('ul');
        $item.attr('data-idx', idx).removeClass('tree-single-item');
        if(!$item.data('id')) {
            var id = idx;
            if(!$parentList.hasClass('tree')) {
                id = $parentList.parent('li').data('id') + '-' + id;
            }
            $item.attr('data-id', id);
        }
        data = data || $item.data();
        var actions = formatActions(data.actions, this.actions);
        if(actions) {
            var $actions = $item.find('.tree-actions');
            if(!$actions.length) {
                $actions = $('<div class="tree-actions"/>').appendTo(this.options.itemWrapper ? $item.find('.tree-item-wrapper') : $item);
                $.each(actions, function(actionName, action) {
                    if(action) $actions.append(createActionEle(action, actionName));
                });
            }
        }

        var $children = $item.children('ul');
        if($children.length) {
            this._initList($children, $item, idx, data);
        }
    };

    Tree.prototype._init = function() {
        var options = this.options, that = this;
        this.actions = formatActions(options.actions);

        this.$.addClass('tree');
        if(options.animate) this.$.addClass('tree-animate');

        this._initList(this.$);

        var initialState = options.initialState;
        var isPreserveEnable = $.kui && $.kui.store && $.kui.store.enable;
        if(isPreserveEnable) {
            this.selector = name + '::' + (options.name || '') + '#' + (this.$.attr('id') || globalId++);
            this.store = $.kui.store[options.name ? 'get' : 'pageGet'](this.selector, {});
        }
        if(initialState === 'preserve') {
            if(isPreserveEnable) this.isPreserve = true;
            else this.options.initialState = initialState = 'normal';
        }

        // init data
        this.reload(options.data);
        if(isPreserveEnable) this.isPreserve = true;

        if(initialState === 'expand') {
            this.expand();
        } else if(initialState === 'collapse') {
            this.collapse();
        }

        // 绑定事件（Bind event)
        this.$.on('click', '.list-toggle,a[href="#"],.tree-toggle', function(e) {
            var $this = $(this);
            var $li = $this.parent('li');
            that.callEvent('hit', {target: $li, item: $li.data()});
            that.toggle($li);
            if($this.is('a')) e.preventDefault();
        }).on('click', '.tree-action', function() {
            var $action = $(this);
            var action = $action.data();
            if(action.action) action = action.action;
            if(action.type === 'sort') return;
            var $li = $action.closest('li:not(.tree-action-item)');
            that.callEvent('action', {action: action, target: this, $item: $li, item: $li.data()});
        });
    };

    Tree.prototype.preserve = function($li, id, expand) {
        if(!this.isPreserve) return;
        if($li) {
            id = id || $li.data('id');
            expand = expand === undefined ? $li.hasClass('open') : false;
            if(expand) this.store[id] = expand;
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
        if($li) {
            $li.addClass('open');
            if(!disabledAnimate && this.options.animate) {
                setTimeout(function() {
                    $li.addClass('in').slideDown("slow");
                }, 10);
            } else {
                $li.addClass('in');
            }
        } else {
            $li = this.$.find('li.has-list').addClass('open in');
        }
        if(!notStore) this.preserve($li);
        this.callEvent('expand', $li, this);
    };

    Tree.prototype.show = function($lis, disabledAnimate, notStore) {
        var that = this;
        $lis.each(function() {
            var $li = $(this);
            that.expand($li, disabledAnimate, notStore);
            if($li) {
                var $ul = $li.parent('ul');
                while($ul && $ul.length && !$ul.hasClass('tree')) {
                    var $parentLi = $ul.parent('li');
                    if($parentLi.length) {
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
        if($li) {
            if(!disabledAnimate && this.options.animate) {
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
        if(!notStore) this.preserve($li);
        this.callEvent('collapse', $li, this);
    };

    Tree.prototype.toggle = function($li) {
        var collapse = ($li && $li.hasClass('open')) || $li === false || ($li === undefined && this.$.find('li.has-list.open').length);
        this[collapse ? 'collapse' : 'expand']($li);
    };

    // Get and init options
    Tree.prototype.getOptions = function(options) {
        this.options = $.extend({}, Tree.DEFAULTS, this.$.data(), options);
        if(this.options.animate === null && this.$.hasClass('tree-animate')) {
            this.options.animate = true;
        }
        if(null!=this.options.initialstate) {
            this.options.initialState = this.options.initialstate;
        }
    };

    Tree.prototype.toData = function($ul, filter) {
        if($.isFunction($ul)) {
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
            if($children.length) data.children = that.toData($children);
            return $.isFunction(filter) ? filter(data, $li) : data;
        }).get();
    };

    // Call event helper
    Tree.prototype.callEvent = function(name, params) {
        var result;
        if($.isFunction(this.options[name])) {
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

            if(!data) $this.data(name, (data = new Tree(this, options)));

            if(typeof option == 'string') data[option](params);
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
            if((lsName in window) && window[lsName] && window[lsName].setItem) {
                this.enable = true;
                storage = window[lsName];
            }
        } catch(e){}
        if(!this.enable) {
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
                        if(i === index) {
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
        if($.isEmptyObject(this.page)) {
            this.remove(pageName);
        } else {
            var forDeletes = [],
                i;
            for(i in this.page) {
                var val = this.page[i];
                if(val === null)
                    forDeletes.push(i);
            }
            for(i = forDeletes.length - 1; i >= 0; i--) {
                delete this.page[forDeletes[i]];
            }
            this.set(pageName, this.page);
        }
    };

    /* Remove page data item */
    Store.prototype.pageRemove = function(key) {
        if(typeof this.page[key] != 'undefined') {
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
        return(defaultValue !== undefined && (val === null || val === undefined)) ? defaultValue : val;
    };

    /* Set page data */
    Store.prototype.pageSet = function(objOrKey, val) {
        if($.isPlainObject(objOrKey)) {
            $.extend(true, this.page, objOrKey);
        } else {
            this.page[this.serialize(objOrKey)] = val;
        }
        this.pageSave();
    };

    /* Check enable status */
    Store.prototype.check = function() {
        if(!this.enable) {
            if(!this.slience) throw new Error('Browser not support localStorage or enable status been set true.');
        }
        return this.enable;
    };

    /* Get length */
    Store.prototype.length = function() {
        if(this.check()) {
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
        if(typeof val === 'undefined' || val === null) {
            if(typeof defaultValue !== 'undefined') {
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
        if(val === undefined) return this.remove(key);
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
        for(var i = length - 1; i >= 0; i--) {
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
        if(typeof value === 'string') return value;
        return JSON.stringify(value);
    };

    /* Deserialize value, with JSON.parse if the given value is not a string */
    Store.prototype.deserialize = function(value) {
        if(typeof value !== 'string') return undefined;
        try {
            return JSON.parse(value);
        } catch(e) {
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

+ function($) {
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

        if($this.is('.disabled, :disabled')) return

        var $parent = getParent($this)
        var isActive = $parent.hasClass('open')

        clearMenus()

        if(!isActive) {
            if('ontouchstart' in document.documentElement && !$parent.closest('.navbar-nav').length) {
                // if mobile we we use a backdrop because click events don't delegate
                $('<div class="dropdown-backdrop"/>').insertAfter($(this)).on('click', clearMenus)
            }

            $parent.trigger(e = $.Event('show.' + kname))

            if(e.isDefaultPrevented()) return

            $parent
                .toggleClass('open')
                .trigger('shown.' + kname)

            $this.focus()
        }

        return false
    }

    Dropdown.prototype.keydown = function(e) {
        if(!/(38|40|27)/.test(e.keyCode)) return

        var $this = $(this)

        e.preventDefault()
        e.stopPropagation()

        if($this.is('.disabled, :disabled')) return

        var $parent = getParent($this)
        var isActive = $parent.hasClass('open')

        if(!isActive || (isActive && e.keyCode == 27)) {
            if(e.which == 27) $parent.find(toggle).focus()
            return $this.click()
        }

        var $items = $('[role=menu] li:not(.divider):visible a', $parent)

        if(!$items.length) return

        var index = $items.index($items.filter(':focus'))

        if(e.keyCode == 38 && index > 0) index-- // up
            if(e.keyCode == 40 && index < $items.length - 1) index++ // down
                if(!~index) index = 0

        $items.eq(index).focus()
    }

    function clearMenus() {
        $(backdrop).remove()
        $(toggle).each(function(e) {
            var $parent = getParent($(this))
            if(!$parent.hasClass('open')) return
            $parent.trigger(e = $.Event('hide.' + kname))
            if(e.isDefaultPrevented()) return
            $parent.removeClass('open').trigger('hidden.' + kname)
        })
    }

    function getParent($this) {
        var selector = $this.attr('data-target')

        if(!selector) {
            selector = $this.attr('href')
            selector = selector && /#/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
        }
        var $parent;
        try {
            $parent = selector && $(selector);
        } catch(e) {}
        return $parent && $parent.length ? $parent : $this.parent()
    }


    // 下拉插件定义（dropdown plugin definition）
    // ==========================

    var old = $.fn.dropdown

    $.fn.dropdown = function(option) {
        return this.each(function() {
            var $this = $(this)
            var data = $this.data('dropdown')

            if(!data) $this.data('dropdown', (data = new Dropdown(this)))
            if(typeof option == 'string') data[option].call($this)
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


+function(a) {
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
        e = d.is("input") ? "val": "html",
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
} (jQuery);


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
        if (fm["data"]('material') === !! []) {
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
        fm["data"]("material", !! []);
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
    })['on']("blur",".kui-form-material-file", function() {
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
(function (win, doc, $) {
	'use strict';
	$["kui"]["contentTabs"] = {
		'$instance': $(".kui-tree-menu"),
		'relative': 0,
		'init': function () {
			this['bind']();
			this["getPath"]();
		},
		'containerSize': function () {
			this["labelWidth"] = this["$label"]["width"]();
			this["view"] = this["$view"]["width"]();
		},
		'bind': function () {
			var _this = this,
			sc = $(".site-contabs"),
			ct = sc["find"]("ul.con-tabs"),
			li = this['$label'] = ct["find"]('li'),
			cs = this['$view'] = sc["find"](".contabs-scroll");
			this["containerSize"](li, cs);
			$(doc)['on']("click", 'a[data-pjax]', function (e) {
				var a = $(this),
				reg,
				text = a['text'](),
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
						'url': a['attr']("href")
					}, e);
				}
			});
			sc['on']("click.site.contabs", "button.pull-left", function () {
				_this["labelPosition"](ct, _this["labelWidth"], "right");
			})['on']("click.site.contabs", ".pull-right>.btn-icon", function () {
				var width = ct["width"]();
				_this["labelPosition"](ct, _this["labelWidth"], "left", _this["view"], width);
			})['on']("click.site.contabs", 'ul.con-tabs>li', function (e) {
				var target = $(e["target"]),
				contab = $(this);
				if (target['is']('i.wb-close-mini') && contab['is']('.active')) {
					_this["closeTab"]();
					e["preventDefault"]();
				} else if (target['is']('i.wb-close-mini')) {
					contab["remove"]();
					_this['labelSize']();
					_this['labelEvent'](ct, "media");
					e["preventDefault"]();
				} else if (contab['is']('.active')) {
					e["preventDefault"]();
				} else {
					contab["siblings"]('li')['removeClass']("active");
					contab["addClass"]("active");
					_this["enable"](contab);
				}
			});
			sc['on']('click.site.contabs',".pull-right li.reload-page", function () {
				var url = sc["find"]("ul.con-tabs>li.active>a")["attr"]("href");
				$["pjax"]({
					'url': url,
					'container': 'main',
					'replace': !![]
				});
			})['on']('click.site.contabs', ".pull-right li.close-other", function () {
				sc["find"]("ul.con-tabs>li")["filter"](function () {
					return !$(this)['is'](".active") && $(this)["index"]() !== 0;
				})["remove"]();
				ct["animate"]({
					'left': 0
				}, 100);
				_this['btnView']("hide");
			})['on']('click.site.contabs',".pull-right li.close-all", function () {
				var li = sc['find']("ul.con-tabs>li"),
				url = li['eq'](0)["find"]('a')["attr"]("href");
				li["filter"](function () {
					return $(this)["index"]() !== 0;
				})["remove"]();
				ct["animate"]({
					'left': 0
				}, 100);
				_this["btnView"]("hide");
				$["pjax"]({
					'url': url,
					'container':"main",
					'replace': !![]
				});
				li['eq'](0)["addClass"]("active");
			});
			$(win)['on']("resize", this["resize"]);
		},
		'resize': function () {
			var sContabs = $(".site-contabs"),
			cTabs = sContabs["find"]("ul.con-tabs");
			$["site"]['contentTabs']['throttle'](function () {
				$["site"]['contentTabs']["view"] = sContabs["find"](".contabs-scroll")["width"]();
				$["site"]["contentTabs"]["labelEvent"](cTabs, 'media');
			}, 200)();
		},
		'enable': function (e) {
			var url = $['trim'](e["find"]('a')['attr']('href')),
			temp_,
			a = this;
			var tempf = function () {
          var nTabs = $(".nav-tabs"),
          li;
          if (a['$instance']["parents"]('div.tab-pane.active')["attr"]('id') !== temp_) {
              li = nTabs["find"]("a[href='#" + temp_ + "34]")["parent"]('li');
              $("a[href='#'" + temp_ +"34]")["tab"]('show');
              nTabs['find']('li')["removeClass"]("active");
              li["addClass"]('active');
              if (li["parent"]('ul')["hasClass"]('dropdown-menu')) {
                  li['closest'](".dropdown")["addClass"]("active");
              }
          }
          a["$instance"]['find']("li.has-sub")['removeClass']("open");
          a["$instance"]["find"]('a')["parent"]('li')["removeClass"]("active");
          if (a["$instance"]["find"]('a[href=34' + url + '34]')["parents"]('li')["hasClass"]("has-sub")) {
            a["$instance"]["find"]("a[href=\"" + url + '34]')["parents"]('li.has-sub')["addClass"]('open');
          }
      };
      
			a["$instance"]["find"]('a')['each'](function () {
				var a = $(this);
				if (a["attr"]('href') === url) {
					temp_ = a["parents"](".tab-pane")['attr']('id');
					tempf();
					a["parent"]('li')["addClass"]("active");
					return ![];
				}
			});
		},
		'getPath': function () {
			var pname = location["pathname"],
			txt = $('main')["find"]('title')["text"]();
			if (pname !== $["ctx"] + '/') {
				this['buildTag']({
					'name': txt,
					'url': pname
				});
			}
			$("main")["find"]("title")["remove"]();
		},
		'buildTag': function (btag, _this) {
			var cTabs = $(".con-tabs");
			if (_this && this["checkTags"](btag["url"])) {
				_this["preventDefault"]();
				return;
			}
			btag['name'] = btag['name'] === '' ? "无标题" : btag["name"];
			$("title")["text"]($["trim"](btag["name"]));
			if (cTabs["find"]('a[href=' + btag["url"] + ']')["size"]() > 0) {
				return;
			}
			cTabs["find"]("li.active")["removeClass"]('active');
			cTabs['append']('<li class= active34><a data-pjax=main href=' + btag["url"] + "\" title=\"" + btag["name"] + '' + "\" rel=\"contents\"><span>" + btag["name"] + "</span><i class=\"icon wb-close-mini\"></i></a></li>");
			this['labelSize']();
			this["labelEvent"](cTabs, 'media', "add");
		},
		'checkTags': function (ctag) {
			var ctans = $('.con-tabs'),
			a = ctans["find"]("a[href='" + ctag + "']");
			var width = $(".con-tabs")["width"]();
			if (a["size"]() > 0) {
				if (a['closest']('li')["hasClass"]("active")) {
					this["app"](ctans, a["closest"]('li'), this["labelWidth"], this["view"], width);
					return !![];
				} else {
					ctans["find"]("li.active")['removeClass']("active");
					ctans['find']("a[href='" + ctag + ']')["closest"]('li')["addClass"]("active");
					this["app"](ctans, a['closest']('li'), this["labelWidth"], this["view"], width);
					return ![];
				}
			} else {
				return ![];
			}
		},
		'labelSize': function () {
			var size,
			width,
			ctans = $('.con-tabs');
			size = ctans["find"]('li')["size"]();
			width = this["labelWidth"] * size;
			ctans["css"]('width', width);
		},
		'labelEvent': function (value, value2) {
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
		'app': function (ani, o, n, npx, npx2) {
			var left_value = ani["position"]()["left"],
			size1 = o["prevAll"]('li')["size"]() * n,
			size2 = o["nextAll"]('li')["size"]() * n;
			if (-size1 < left_value) {
				if (size1 + left_value < npx) {
					return ![];
				}
				left_value =  - (size1 - npx + n);
			} else {
				if (-left_value < npx2 - size2) {
					return ![];
				}
				left_value =  - (npx2 - size2 - n);
			}
			ani["animate"]({
				'left': left_value
			}, 100);
		},
		'labelPosition': function (lablePostion, size, leftPx, left1, left2, par) {
			var _this = this,
			vLfet = lablePostlablePostion['position']()['left'],
			rela = function (n) {
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
		'throttle': function (e, n) {
			var _e = e,
			number,
			tbool = !![];
			return function () {
				var _arguments = arguments,
				_this = this;
				if (tbool) {
					_e["apply"](_this, _arguments);
					tbool = ![];
				}
				if (number) {
					return ![];
				}
				number = setTimeout(function () {
						clearTimeout(number);
						number = null;
						_e['apply'](_this, _arguments);
					}, n || 500);
			};
		},
		'closeTab': function () {
			var sc = $(".site-contabs"),
			active_li = sc['find']("ul.con-tabs>li.active"),
			url;
			this['$instance']["find"](".active")["removeClass"]("active");
			if (active_li["next"]('li')["size"]() > 0) {
				url = active_li["next"]('li')["find"]('a')['attr']("href");
				active_li["next"]('li')['addClass']("active");
			} else {
				url = active_li['prev']('li')["find"]('a')["attr"]('href');
				active_li['prev']('li')['addClass']('active');
			}
			active_li["remove"]();
			this["labelSize"]();
			this['labelEvent'](sc, "media");
			$['pjax']({
				'url': url,
				'container': 'main',
				'replace': !![]
			});
			this["$instance"]['find']("a[href='" + url + ']')["parent"]('li')['addClass']('active');
		},
		'btnView': function (display) {
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



//ajax访问远程资源模版
(function (document, $) {

    var kjax = function() {
       var url=null;
       var data=null;
       var temp=null;
       
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
    kjax.prototype.ajaxrequest=function(url, methodtype, con, parameter, functionName, obj) {
        var xmlhttp = this.getajaxHttp();
        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState == 4) {
                //HTTP响应已经完全接收才调用
                functionName(xmlhttp, obj);
            }
        };
        xmlhttp.open(methodtype, url, con);
        xmlhttp.send(parameter);
    };
     /**原生ajax系列-获取xmlHttp对象*/
    kjax.prototype.getajaxHttp=function () {
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

    kjax.prototype.atemplate=function(template_id,template_url,template_data,template_div){
        this.ajaxrequest(template_url, 'get', true, null, function (http, obj) {
            //编译模版
            $(template_div).html(http.responseText);
            $(template_id).html(template(template_id, template_data));
        }, null);
    };
   
  
    $.kui({
        kjax: new kjax()
    });
})(document, jQuery);