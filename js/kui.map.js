/**
 * 哈希集合
 */
var Hashtable = (function(UNDEFINED) {
    var FUNCTION = "function",
        STRING = "string",
        UNDEF = "undefined";

    // Require Array.prototype.splice, Object.prototype.hasOwnProperty and encodeURIComponent. In environments not
    // having these (e.g. IE <= 5), we bail out now and leave Hashtable null.
    if (typeof encodeURIComponent == UNDEF ||
        Array.prototype.splice === UNDEFINED ||
        Object.prototype.hasOwnProperty === UNDEFINED) {
        return null;
    }

    function toStr(obj) {
        return (typeof obj == STRING) ? obj : "" + obj;
    }

    function hashObject(obj) {
        var hashCode;
        if (typeof obj == STRING) {
            return obj;
        } else if (typeof obj.hashCode == FUNCTION) {
            // Check the hashCode method really has returned a string
            hashCode = obj.hashCode();
            return (typeof hashCode == STRING) ? hashCode : hashObject(hashCode);
        } else {
            return toStr(obj);
        }
    }

    function merge(o1, o2) {
        for (var i in o2) {
            if (o2.hasOwnProperty(i)) {
                o1[i] = o2[i];
            }
        }
    }

    function equals_fixedValueHasEquals(fixedValue, variableValue) {
        return fixedValue.equals(variableValue);
    }

    function equals_fixedValueNoEquals(fixedValue, variableValue) {
        return (typeof variableValue.equals == FUNCTION) ?
            variableValue.equals(fixedValue) : (fixedValue === variableValue);
    }

    function createKeyValCheck(kvStr) {
        return function(kv) {
            if (kv === null) {
                throw new Error("null is not a valid " + kvStr);
            } else if (kv === UNDEFINED) {
                throw new Error(kvStr + " must not be undefined");
            }
        };
    }

    var checkKey = createKeyValCheck("key"),
        checkValue = createKeyValCheck("value");

    /*----------------------------------------------------------------------------------------------------------------*/

    function Bucket(hash, firstKey, firstValue, equalityFunction) {
        this[0] = hash;
        this.entries = [];
        this.addEntry(firstKey, firstValue);

        if (equalityFunction !== null) {
            this.getEqualityFunction = function() {
                return equalityFunction;
            };
        }
    }

    var EXISTENCE = 0,
        ENTRY = 1,
        ENTRY_INDEX_AND_VALUE = 2;

    function createBucketSearcher(mode) {
        return function(key) {
            var i = this.entries.length,
                entry, equals = this.getEqualityFunction(key);
            while (i--) {
                entry = this.entries[i];
                if (equals(key, entry[0])) {
                    switch (mode) {
                        case EXISTENCE:
                            return true;
                        case ENTRY:
                            return entry;
                        case ENTRY_INDEX_AND_VALUE:
                            return [i, entry[1]];
                    }
                }
            }
            return false;
        };
    }

    function createBucketLister(entryProperty) {
        return function(aggregatedArr) {
            var startIndex = aggregatedArr.length;
            for (var i = 0, entries = this.entries, len = entries.length; i < len; ++i) {
                aggregatedArr[startIndex + i] = entries[i][entryProperty];
            }
        };
    }

    Bucket.prototype = {
        getEqualityFunction: function(searchValue) {
            return (typeof searchValue.equals == FUNCTION) ? equals_fixedValueHasEquals : equals_fixedValueNoEquals;
        },

        getEntryForKey: createBucketSearcher(ENTRY),

        getEntryAndIndexForKey: createBucketSearcher(ENTRY_INDEX_AND_VALUE),

        removeEntryForKey: function(key) {
            var result = this.getEntryAndIndexForKey(key);
            if (result) {
                this.entries.splice(result[0], 1);
                return result[1];
            }
            return null;
        },

        addEntry: function(key, value) {
            this.entries.push([key, value]);
        },

        keys: createBucketLister(0),

        values: createBucketLister(1),

        getEntries: function(destEntries) {
            var startIndex = destEntries.length;
            for (var i = 0, entries = this.entries, len = entries.length; i < len; ++i) {
                // Clone the entry stored in the bucket before adding to array
                destEntries[startIndex + i] = entries[i].slice(0);
            }
        },

        containsKey: createBucketSearcher(EXISTENCE),

        containsValue: function(value) {
            var entries = this.entries,
                i = entries.length;
            while (i--) {
                if (value === entries[i][1]) {
                    return true;
                }
            }
            return false;
        }
    };

    /*----------------------------------------------------------------------------------------------------------------*/

    // Supporting functions for searching hashtable buckets

    function searchBuckets(buckets, hash) {
        var i = buckets.length,
            bucket;
        while (i--) {
            bucket = buckets[i];
            if (hash === bucket[0]) {
                return i;
            }
        }
        return null;
    }

    function getBucketForHash(bucketsByHash, hash) {
        var bucket = bucketsByHash[hash];

        // Check that this is a genuine bucket and not something inherited from the bucketsByHash's prototype
        return (bucket && (bucket instanceof Bucket)) ? bucket : null;
    }

    /*----------------------------------------------------------------------------------------------------------------*/

    function Hashtable() {
        var buckets = [];
        var bucketsByHash = {};
        var properties = {
            replaceDuplicateKey: true,
            hashCode: hashObject,
            equals: null
        };

        var arg0 = arguments[0],
            arg1 = arguments[1];
        if (arg1 !== UNDEFINED) {
            properties.hashCode = arg0;
            properties.equals = arg1;
        } else if (arg0 !== UNDEFINED) {
            merge(properties, arg0);
        }

        var hashCode = properties.hashCode,
            equals = properties.equals;

        this.properties = properties;

        this.put = function(key, value) {
            checkKey(key);
            checkValue(value);
            var hash = hashCode(key),
                bucket, bucketEntry, oldValue = null;

            // Check if a bucket exists for the bucket key
            bucket = getBucketForHash(bucketsByHash, hash);
            if (bucket) {
                // Check this bucket to see if it already contains this key
                bucketEntry = bucket.getEntryForKey(key);
                if (bucketEntry) {
                    // This bucket entry is the current mapping of key to value, so replace the old value.
                    // Also, we optionally replace the key so that the latest key is stored.
                    if (properties.replaceDuplicateKey) {
                        bucketEntry[0] = key;
                    }
                    oldValue = bucketEntry[1];
                    bucketEntry[1] = value;
                } else {
                    // The bucket does not contain an entry for this key, so add one
                    bucket.addEntry(key, value);
                }
            } else {
                // No bucket exists for the key, so create one and put our key/value mapping in
                bucket = new Bucket(hash, key, value, equals);
                buckets.push(bucket);
                bucketsByHash[hash] = bucket;
            }
            return oldValue;
        };

        this.get = function(key) {
            checkKey(key);

            var hash = hashCode(key);

            // Check if a bucket exists for the bucket key
            var bucket = getBucketForHash(bucketsByHash, hash);
            if (bucket) {
                // Check this bucket to see if it contains this key
                var bucketEntry = bucket.getEntryForKey(key);
                if (bucketEntry) {
                    // This bucket entry is the current mapping of key to value, so return the value.
                    return bucketEntry[1];
                }
            }
            return null;
        };

        this.containsKey = function(key) {
            checkKey(key);
            var bucketKey = hashCode(key);

            // Check if a bucket exists for the bucket key
            var bucket = getBucketForHash(bucketsByHash, bucketKey);

            return bucket ? bucket.containsKey(key) : false;
        };

        this.containsValue = function(value) {
            checkValue(value);
            var i = buckets.length;
            while (i--) {
                if (buckets[i].containsValue(value)) {
                    return true;
                }
            }
            return false;
        };

        this.clear = function() {
            buckets.length = 0;
            bucketsByHash = {};
        };

        this.isEmpty = function() {
            return !buckets.length;
        };

        var createBucketAggregator = function(bucketFuncName) {
            return function() {
                var aggregated = [],
                    i = buckets.length;
                while (i--) {
                    buckets[i][bucketFuncName](aggregated);
                }
                return aggregated;
            };
        };

        this.keys = createBucketAggregator("keys");
        this.values = createBucketAggregator("values");
        this.entries = createBucketAggregator("getEntries");

        this.remove = function(key) {
            checkKey(key);

            var hash = hashCode(key),
                bucketIndex, oldValue = null;

            // Check if a bucket exists for the bucket key
            var bucket = getBucketForHash(bucketsByHash, hash);

            if (bucket) {
                // Remove entry from this bucket for this key
                oldValue = bucket.removeEntryForKey(key);
                if (oldValue !== null) {
                    // Entry was removed, so check if bucket is empty
                    if (bucket.entries.length == 0) {
                        // Bucket is empty, so remove it from the bucket collections
                        bucketIndex = searchBuckets(buckets, hash);
                        buckets.splice(bucketIndex, 1);
                        delete bucketsByHash[hash];
                    }
                }
            }
            return oldValue;
        };

        this.size = function() {
            var total = 0,
                i = buckets.length;
            while (i--) {
                total += buckets[i].entries.length;
            }
            return total;
        };
    }

    Hashtable.prototype = {
        each: function(callback) {
            var entries = this.entries(),
                i = entries.length,
                entry;
            while (i--) {
                entry = entries[i];
                callback(entry[0], entry[1]);
            }
        },

        equals: function(hashtable) {
            var keys, key, val, count = this.size();
            if (count == hashtable.size()) {
                keys = this.keys();
                while (count--) {
                    key = keys[count];
                    val = hashtable.get(key);
                    if (val === null || val !== this.get(key)) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        },

        putAll: function(hashtable, conflictCallback) {
            var entries = hashtable.entries();
            var entry, key, value, thisValue, i = entries.length;
            var hasConflictCallback = (typeof conflictCallback == FUNCTION);
            while (i--) {
                entry = entries[i];
                key = entry[0];
                value = entry[1];

                // Check for a conflict. The default behaviour is to overwrite the value for an existing key
                if (hasConflictCallback && (thisValue = this.get(key))) {
                    value = conflictCallback(key, thisValue, value);
                }
                this.put(key, value);
            }
        },

        clone: function() {
            var clone = new Hashtable(this.properties);
            clone.putAll(this);
            return clone;
        }
    };

    Hashtable.prototype.toQueryString = function() {
        var entries = this.entries(),
            i = entries.length,
            entry;
        var parts = [];
        while (i--) {
            entry = entries[i];
            parts[i] = encodeURIComponent(toStr(entry[0])) + "=" + encodeURIComponent(toStr(entry[1]));
        }
        return parts.join("&");
    };

    return Hashtable;
})();

/**
 * 地图工具类
 */
(function($) {
    'use strict';
    var name = 'kmap';
    //地图属性
    $["kui"][name] = {
        /**
         * 自定义图层
         */
        overlayDiv: {
            _map: null,
            _html: "<div style='background:transparent url(images/kmap/blank.gif);position:absolute;left:0;top:0;width:100%;height:100%;z-index:1000' unselectable='on'></div>",
            _maskElement: null,
            _cursor: "default",
            _inUse: false,
            show: function(m) {
                if (!this._map) {
                    this._map = m
                }
                this._inUse = true;
                if (!this._maskElement) {
                    this._createMask(m)
                }
                this._maskElement.style.display = "block"
            },
            _createMask: function(o) {
                this._map = o;
                var _this = this;
                if (!this._map) {
                    return
                }
                var n = this._maskElement = this.k(this._map.getContainer(), this._html);
                var m = function(p) {
                    _this.b(p);
                    return _this.h(p)
                };
                this.d(n, "mouseup", function(p) {
                    if (p.button == 2) {
                        m(p)
                    }
                });
                this.d(n, "contextmenu", m);
                n.style.display = "none"
            },
            b: function(m) {
                var m = window.event || m;
                m.stopPropagation ? m.stopPropagation() : m.cancelBubble = true
            },
            h: function(m) {
                var m = window.event || m;
                m.preventDefault ? m.preventDefault() : m.returnValue = false;
                return false
            },
            d: function(m, n, o) {
                if (!m) {
                    return
                }
                n = n.replace(/^on/i, "").toLowerCase();
                if (m.addEventListener) {
                    m.addEventListener(n, o, false)
                } else {
                    if (m.attachEvent) {
                        m.attachEvent("on" + n, o)
                    }
                }
            },
            a: function(p, m, o) {
                var n,
                    q;
                if (p.insertAdjacentHTML) {
                    p.insertAdjacentHTML(m, o)
                } else {
                    n = p.ownerDocument.createRange();
                    m = m.toUpperCase();
                    if (m == "AFTERBEGIN" || m == "BEFOREEND") {
                        n.selectNodeContents(p);
                        n.collapse(m == "AFTERBEGIN")
                    } else {
                        q = m == "BEFOREBEGIN";
                        n[q ? "setStartBefore" : "setEndAfter"](p);
                        n.collapse(q)
                    }
                    n.insertNode(n.createContextualFragment(o))
                }
                return p
            },
            k: function(n, m) {
                this.a(n, "beforeEnd", m);
                return n.lastChild
            },
            getDrawPoint: function(p, r) {
                p = window.event || p;
                var m = p.layerX || p.offsetX || 0;
                var q = p.layerY || p.offsetY || 0;
                var o = p.target || p.srcElement;
                if (o != $.kui.kmap.overlayDiv.getDom(this._map) && r == true) {
                    while (o && o != this._map.getContainer()) {
                        if (!(o.clientWidth == 0 && o.clientHeight == 0 && o.offsetParent && o.offsetParent.nodeName.toLowerCase() == "td")) {
                            m += o.offsetLeft;
                            q += o.offsetTop
                        }
                        o = o.offsetParent
                    }
                }
                if (o != $.kui.kmap.overlayDiv.getDom(this._map) && o != this._map.getContainer()) {
                    return
                }
                if (typeof m === "undefined" || typeof q === "undefined") {
                    return
                }
                if (isNaN(m) || isNaN(q)) {
                    return
                }
                return this._map.pixelToPoint(new BMap.Pixel(m, q))
            },
            hide: function() {
                if (!this._map) {
                    return
                }
                this._inUse = false;
                if (this._maskElement) {
                    this._maskElement.style.display = "none"
                }
            },
            getDom: function(m) {
                if (!this._maskElement) {
                    this._createMask(m)
                }
                return this._maskElement
            },
            setCursor: function(m) {
                this._cursor = m || "default";
                if (this._maskElement) {
                    this._maskElement.style.cursor = this._cursor
                }
            }
        },
        urls: new Hashtable(),
        option: {
            id: null,
            key: null,
            url: null,
            type: null,
            width: '100%',
            height: '100%',
            lng: 116.404,
            lat: 39.915,
            clusterer: false,
            zoom: 11
        },
        map: null,
        init: function(option) {
            var _this = this;
            this.urls.put('baidu', 'http://api.map.baidu.com/getscript?v=2.0&ak={key}');
            this.urls.put('baidu_clusterer', 'http://api.map.baidu.com/library/MarkerClusterer/1.2/src/MarkerClusterer_min.js');
            this.urls.put('google', 'http://maps.google.cn/maps/api/js?v=3&key={key}&libraries=places');
            this.urls.put('google_zh', 'http://ditu.google.cn/maps/api/js?v=3&key={key}&libraries=places');
            if (typeof option == Object && option instanceof Object) {
                //处理对象数据
                _this.option = option;
                this.url = this.urlBt(option.key, this.urls.get(option.type));
                this.loadJs(_this.option.url)
            } else if (typeof option == "string") {
                //处理标签属性转换对象
                var mapobj = $("#" + option);
                _this.option = $["extend"](!![], {}, _this.option, mapobj['data']());
                _this.option.id = option;
                _this.option.url = this.urlBt(_this.option.key, this.urls.get(_this.option.type));
                console.log(_this.option);
                this.loadJs(_this);
            } else {
                console.log("无效参数");
            }
        },
        urlBt: function(key, url) {
            var begin = url.indexOf('{'),
                end = url.indexOf('}');
            if (begin > 0 && end > 0) {
                url = url.replace('{key}', key);
            }
            return url;
        },
        initBMap: function(option) {
            // 百度地图API功能
            var map = new BMap.Map(option.id); // 创建Map实例
            map.centerAndZoom(new BMap.Point(option.lng, option.lat), option.zoom); // 初始化地图,设置中心点坐标和地图级别
            map.enableScrollWheelZoom(true); //开启鼠标滚轮缩放
            console.log("已完百度地图初始化");
            //初始化标志物对象begin
            //自定义覆盖物拓展 定义kui map标志物
            $.kui.kmap.marker.prototype = new BMap.Overlay();
            $.kui.kmap.marker.IS_BAIDU_MAP = typeof BMap !== 'undefined';
            if ($.kui.kmap.marker.IS_BAIDU_MAP) {
                $.kui.kmap.marker.prototype.initialize = function(map) {
                    var div = document.createElement("div");
                    div.id = Math.random().toString().replace('.', '');
                    div.className = "kmarker";
                    div.style.borderStyle = "none";
                    div.style.borderWidth = "0px";
                    div.style.position = "absolute";
                    div.style.cursor = "pointer";
                    div.innerHTML = this.getHtml();
                    this.div_ = div;
                    var panes = this.map_.getPanes();
                    panes.floatShadow.appendChild(div);
                    return div;
                };
                $.kui.kmap.marker.prototype.setMap = function(nativeMap) {
                    if (nativeMap == null)
                        this.map_.removeOverlay(this);
                    else {
                        nativeMap.addOverlay(this);
                    }
                };
            } else {
                $.kui.kmap.marker.prototype.onAdd = function() {
                    // 创建一个div，其中包含了当前文字
                    var div = document.createElement("div");
                    div.id = Math.random().toString().replace('.', '');
                    div.className = "kmarker";
                    div.style.borderStyle = "none";
                    div.style.borderWidth = "0px";
                    div.style.position = "absolute";
                    div.innerHTML = this.getHtml();
                    this.div_ = div;
                    var panes = this.getPanes();
                    panes.overlayImage.appendChild(div);

                };
            }

            $.kui.kmap.marker.prototype.draw = function() {
                //var overlayProjection = this.getProjection();
                //var center = overlayProjection.fromLatLngToDivPixel(this.point_);
                // 利用projection获得当前视图的坐标
                var _this = this;
                var center = this.map_.pointToOverlayPixel(this.point_);
                // 为简单，长宽是固定的，实际应该根据文字改变
                var div = this.div_;
                if (null != div) {
                    if (this.icon_ != null) {
                        div.style.left = center.x - 10 + "px";
                    } else {
                        div.style.left = center.x + 28 + "px";
                    }
                    div.style.top = center.y - 7 + "px";
                    var width = 100;
                    if (this.icon_) {
                        width = this.icon_.width;
                    }
                    var text_width = this.text_.length * 20 + width; //每个字20px 加上图标宽度
                    div.style.width = text_width + "px";
                    //div.style.height = "10px";
                    div.onclick = function() {
                        console.log(div.id);
                        if (typeof _this.click_ == "function") {
                            _this.click_(_this.point_);
                        }

                    };
                }

            };
            $.kui.kmap.marker.prototype.onRemove = function() {
                this.div_.parentNode.removeChild(this.div_);
                this.div_ = null;
            };

            $.kui.kmap.marker.prototype.update = function(obj) {
                if ((typeof obj.position) != "undefined") {
                    this.setPosition(obj.position);
                }
                if ((typeof obj.icon) != "undefined") {
                    this.setIcon(obj.icon);
                }
                if ((typeof obj.text) != "undefined") {
                    this.setName(obj.text);
                }
            };

            $.kui.kmap.marker.prototype.setPosition = function(position) {
                if (this.point_ != position) {
                    this.point_ = position;
                    if (this.div_) {
                        //var center = this.getProjection().fromLatLngToDivPixel(position);
                        var center = this.map_.pointToOverlayPixel(position);
                        this.div_.style.left = center.x + 16 + "px";
                        this.div_.style.top = center.y - 8 + "px";
                    }
                }
            };
            $.kui.kmap.marker.prototype.getPosition = function() {
                return this.point_;
            };
            $.kui.kmap.marker.prototype.setIcon = function(obj) {
                if (null == this.icon_) {
                    this.icon_ = obj;
                } else {
                    if (this.icon_.url != obj.url) {
                        this.icon_ = obj;
                    }
                }
                this.flash();
            };

            $.kui.kmap.marker.prototype.setClick = function(cb) {
                if (typeof cb == "function") {
                    this.click_ = cb;
                }
            };
            $.kui.kmap.marker.prototype.setPopup = function(html) {
                if (this.popup_ != html) {
                    this.popup_ = html;
                    this.flash();
                }
            };

            $.kui.kmap.marker.prototype.setName = function(text) {
                if (this.text_ != text) {
                    this.text_ = text;

                    this.flash();
                }
            };

            $.kui.kmap.marker.prototype.getMap = function() {
                return this.map_;
            };

            $.kui.kmap.marker.prototype.getHtml = function() {
                if (this.icon_ != null) {
                    if (!this.icon_.width) {
                        this.icon_.width = '32';
                    }
                    if (!this.icon_.height) {
                        this.icon_.height = '32';
                    }
                    return "<img style='width:" + this.icon_.width + "px;height:" + this.icon_.height + "px;' src='" + this.icon_.url + "'/><span>" + this.text_ + "</span>";
                } else {
                    return "<span >" + this.text_ + "</span>";
                }
            }

            $.kui.kmap.marker.prototype.flash = function() {
                this.div_.innerHTML = this.getHtml(); //初始化标志物对象end
            }

            $.kui.kmap.overlayDiv.getDom(map).addEventListener("mousedown", $.kui.kmap.mapMouseDown); //自定义图层事件
            $.kui.kmap.overlayDiv.getDom(map).addEventListener("mousemove", $.kui.kmap.mapMouseMove);
            $.kui.kmap.overlayDiv.getDom(map).addEventListener("dblclick", $.kui.kmap.mapDblClick);

            return map;
        },
        initGoogle: function(option) {
            var googleOption = {
                zoom: e.option.zoom,
                scaleControl: true,
                panControl: true,
                center: new mapobject.maps.LatLng(option.lat, option.lng),
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                mapTypeControlOptions: { mapTypeIds: [google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.SATELLITE, 'OSM'] }
            }
            var map = new mapobject.maps.Map(option.id, googleOption); // 创建Map实例
            console.log("已完谷歌地图初始化");

            //拓展 自定义覆盖物
            $.kui.kmap.marker.prototype = new google.maps.OverlayView();
            return map;
        },
        loadJs: function(e) { //加载地图文件
            $.getScript(e.option.url, function() {
                console.log("已完成加载地图js文件");
                var initOptions = {
                    id: e.option.id,
                    lng: e.option.lng,
                    lat: e.option.lat,
                    zoom: e.option.zoom,
                }
                if ('baidu' == e.option.type) {
                    window.BMap_loadScriptTime = (new Date).getTime();
                    e.map = e.initBMap(initOptions);
                    if (e.option.clusterer) { //加载聚合支持库
                        $.getScript('http://api.map.baidu.com/library/TextIconOverlay/1.2/src/TextIconOverlay_min.js');
                        $.getScript(e.urls.get('baidu_clusterer'), function() {
                            console.log("百度地图聚合文件：已完成加载clusterer.js文件");
                        });
                    }
                    if (e.option.heat) { //加载热力图支持库
                        $.getScript('http://api.map.baidu.com/library/Heatmap/2.0/src/Heatmap_min.js', function() {
                            console.log("百度地图热力图文件：已完成加载热力图支持库Heatmap_min.js文件");
                        });
                    }
                }
                if ("google_zh" == e.option.type || "google" == e.option.type) {
                    e.map = e.initGoogle(initOptions);
                }
                e.resize(e);
            });
        },
        resize: function(e) { //重置页面
            $("#" + e.option.id).css("width", e.option.width);
            $("#" + e.option.id).css("height", e.option.height);
            $("#" + e.option.id).css("margin", "0");
            $("#" + e.option.id).css("overflow", "hidden");
            //$.kui.kmap.markerList.pop();
        },
        isSupportCanvas: function() {
            var elem = document.createElement('canvas');
            return !!(elem.getContext && elem.getContext('2d'));
        },
        //自定义覆盖物-标志
        marker: function(opts) {
            // 初始化参数：坐标、文字、地图
            if ((typeof opts.icon) != "undefined") {
                this.icon_ = opts.icon;
            } else {
                this.icon_ = null;
            }
            this.point_ = opts.position;
            this.text_ = opts.text || "";
            this.popup_ = opts.popup || ""; //弹窗信息
            this.click_ = opts.click || null; //点击事件
            this.map_ = opts.map;
            // 到onAdd时才需要创建div
            this.div_ = null;
            // 加入map
            this.setMap(this.map_);
        },
        markerList: new Hashtable(), //地图上的标记信息
        heatOverlay: null, //热力图图层
        findMarkerById: function(id) { //根据id查询数组中的点
            return $.kui.kmap.markerList.get(id);
        },
        insertMarker: function(option) { //将点保存至数组
            if (!option.id) {
                throw new Error('insertMarker err :marker id not null');
            }
            var markerOption = {
                label: null,
                icon: null
            }
            var type = $.kui.kmap.option.type,
                point = null,
                marker = $.kui.kmap.findMarkerById(option.id);
            if (marker != null) {
                throw new Error('insertMarker err : existing marker id:' + option.id);
            }
            if (type == "baidu") {
                point = new BMap.Point(option.lng, option.lat);
                marker = new $.kui.kmap.marker({ position: point, map: $.kui.kmap.map });
                if (option.icon) {
                    marker.setIcon(option.icon);
                }
                if (option.name) {
                    marker.setName(option.name);
                }
                if (option.click) {
                    marker.setClick(option.click);
                }
                if (option.zoom) {
                    $.kui.kmap.map.centerAndZoom(point, option.zoom);
                }
                if (option.popup) {
                    marker.setPopup("click", option.popup);
                }

            }

            if (type == "google_zh" || type == "google") {
                point = new mapobject.maps.LatLng(option.lng, option.lat);
                markerOption.position = point;
                if (option.icon) {
                    markerOption.icon = option.icon.url;
                }
                if (option.label) {
                    markerOption.label = option.label.text;
                }

                marker = new google.maps.Marker(point, markerOption);
                if (option.zoom) {
                    $.kui.kmap.map.setZoom(option.zoom);
                    $.kui.kmap.map.panTo(point);
                }
            }
            $.kui.kmap.markerList.put(option.id, marker);
            if ($.kui.kmap.option.clusterer) //开启聚合
                var markerClusterer = new BMapLib.MarkerClusterer($.kui.kmap.map, { markers: $.kui.kmap.markerList.values() });
        },
        updateMarker: function(option) { //更新标志信息
            if (!option.id) {
                throw new Error('updateMarker err :marker id not null');
            }
            var type = $.kui.kmap.option.type,
                point = null,
                marker = $.kui.kmap.findMarkerById(option.id);
            if (marker == null) {
                throw new Error('updateMarker err : marker not null id:' + option.id);
            }
            if (type == "baidu") {
                point = new BMap.Point(option.lng, option.lat);
                if (option.icon) {
                    marker.setIcon(option.icon);
                }
                if (option.label) {
                    marker.setName(option.name);
                }
                marker.setPosition(point);
                if (option.zoom) {
                    $.kui.kmap.map.centerAndZoom(point, option.zoom);
                }

            }
            if (type == "google_zh" || type == "google") {
                point = new mapobject.maps.LatLng(option.lng, option.lat);
                markerOption.position = point;
                if (option.icon) {
                    markerOption.icon = option.icon.url;
                    marker.setIcon(markerOption.icon);
                }
                if (option.label) {
                    markerOption.label = option.label.text;
                    marker.setLabel(markerOption.label);
                }
                marker.setPosition(point);
                if (option.zoom) {
                    $.kui.kmap.map.setZoom(option.zoom);
                    $.kui.kmap.map.panTo(point);
                }
            }
        },
        toMarker: function(id, zoom) { //定位标志
            var type = $.kui.kmap.option.type,
                marker = $.kui.kmap.findMarkerById(id);
            if (marker == null) {
                throw new Error('updateMarker err : marker not null id:' + id);
            }
            if (type == "baidu") {
                $.kui.kmap.map.centerAndZoom(marker.getPosition(), zoom);
            }
            if (type == "google_zh" || type == "google") {
                $.kui.kmap.map.setZoom(zoom);
                $.kui.kmap.map.panTo(marker.getPosition());

            }
        },
        romoveById: function(id) { //删除指定标志物
            var marker = $.kui.kmap.findMarkerById(id);
            if (marker == null) {
                throw new Error('updateMarker err : marker not null id:' + id);
            } else {
                marker.onRemove();
                $.kui.kmap.markerList.remove(id);
            }
        },
        empty: function() { //清空所有标志物
            $.kui.kmap.markerList.each(function(key, marker) {
                marker.onRemove();
            });
            $.kui.kmap.markerList.clear();
        },
        closeHeat: function() {
            $.kui.kmap.heatOverlay.hide();
        },
        openHeat: function() {
            //开启热力图
            if ($.kui.kmap.option.heat) {
                if ($.kui.kmap.isSupportCanvas()) {
                    if (null == $.kui.kmap.heatOverlay) {
                        //开启热力图
                        $.kui.kmap.heatOverlay = new BMapLib.HeatmapOverlay({ "radius": 20 });
                        $.kui.kmap.map.addOverlay($.kui.kmap.heatOverlay);
                        var options = [];
                        $.kui.kmap.markerList.each(function(key, marker) {
                            var option = marker.getPosition();
                            //option.count = parseInt(Math.random() * 100);
                            options.push(option);

                        });
                        $.kui.kmap.heatOverlay.setDataSet({ data: options });
                    }
                    $.kui.kmap.heatOverlay.show();
                } else {
                    console.log('热力图目前只支持有canvas支持的浏览器,您所使用的浏览器不能使用热力图功能~')
                }

            }
        },
        lastClickTime: new Date().getTime(), //记录最后一次点击时间，避免出现重复的信息提示
        mouseMoveTime: new Date().getTime(), //避免移动地图时，进行车辆居中显示

        addMarkerType: null, //0表示添加标注，1表示画线，2表示矩形，3表示多边形，4表示圆形，
        drawingMode: false, //绘图模式 false关闭
        drawingModeResult: null, //绘图返回结果
        drawingModeOptions: null, //图形样式

        markerRectangle: null, //矩形
        markerRectStart: null, //画矩形时开始位置
        markerRectBounds: null, //矩形区域范围
        //画多边形 折线
        markerPolygon: null, //多边形
        markerPolyPoint: new Array(), //多边形的点
        markerPolyPointBaidu: null, //百度地图 实际绘制的点
        markerPolyline: null, //折线

        markerCircle: null, //圆形
        markerCenterPoint: null, //圆的中心点
        markerRadius: null, //圆的半径
        //添加鼠标移动事件
        mapMouseMove: function(event) {
            if ($.kui.kmap.addMarkerType == 0) { //标志移动时
                var date = new Date();
                $.kui.kmap.mouseMoveTime = date.getTime();

                if ($.kui.kmap.markerList.size() <= 100) {
                    var latlng = event.point;
                    var markpoint = $.kui.kmap.map.pointToOverlayPixel(latlng); //overlay.getProjection().fromLatLngToDivPixel(latlng);
                    var strHtml = "",
                        num = 0; //个数
                    $.kui.kmap.markerList.each(function makeShow(id, marker) {
                        try {
                            if (num <= 10) {
                                if (marker.show && marker.movetip) {
                                    var point = $.kui.kmap.map.pointToOverlayPixel(marker.getPosition());
                                    if (point.x < (markpoint.x + 15) && point.x > (markpoint.x - 15) && point.y < (markpoint.y + 25) && point.y > (markpoint.y - 25)) {
                                        if (marker.getName() != "") {
                                            strHtml += marker.getName() + "<br />";
                                            num++;
                                        }
                                    }
                                }
                            }
                        } catch (e) {}
                    });

                    if (num > 0) {
                        $('#tip').css({ "left": mousePos.x + "px", "top": mousePos.y + "px" });
                        $('#tip').html(num > 10 ? strHtml + "......." : strHtml);
                    } else {
                        $('#tip').hide();
                    }
                }
            }
            if ($.kui.kmap.addMarkerType == 1) { //画线 移动时
                $.kui.kmap.movePolyline(event);
            }
            if ($.kui.kmap.addMarkerType == 2) { //矩形 移动时
                $.kui.kmap.moveRectangle(event);
            }
            if ($.kui.kmap.addMarkerType == 3) { //多边形 移动时
                $.kui.kmap.movePolygon(event);
                //$('#tip').css({ "left": (event.pixel.x + 20) + "px", "top": (event.pixel.y - 40) + "px" });
            }
            if ($.kui.kmap.addMarkerType == 4) { //圆形 移动时
                $.kui.kmap.moveCircle(event);
            }
        },
        //响应鼠标点击操作
        mapMouseDown: function(event) {
            //console.log($.kui.kmap.addMarkerType);
            if ($.kui.kmap.addMarkerType == 0) { //标志移动时
                var nowTime = isTimeout($.kui.kmap.lastClickTime, 200);
                if (nowTime == null) {
                    return;
                }
                $.kui.kmap.lastClickTime = nowTime;

            }
            if ($.kui.kmap.addMarkerType == 1) { //画线 移动时
                $.kui.kmap.addPolyline(event);
            }
            if ($.kui.kmap.addMarkerType == 2) { //矩形 移动时
                $.kui.kmap.addRectangle(event);
            }
            if ($.kui.kmap.addMarkerType == 3) { //多边形 移动时

                $.kui.kmap.addPolygon(event);
            }
            if ($.kui.kmap.addMarkerType == 4) { //圆形 移动时
                $.kui.kmap.addCircle(event);
            }

        },
        mapDblClick: function(event) { //鼠标双击操作 退出绘图模式
            //console.log($.kui.kmap.addMarkerType);
            if ($.kui.kmap.addMarkerType == 0) { //标志移动时

            }
            if ($.kui.kmap.addMarkerType == 1) { //画线 
                if ($.kui.kmap.markerPolyPoint.length >= 2) {
                    var temp = $.kui.kmap.getLatLngString($.kui.kmap.distinct($.kui.kmap.markerPolyPoint));
                    $.kui.kmap.drawingModeResult = temp;
                }
                if (null != $.kui.kmap.markerPolyline) {
                    $.kui.kmap.map.removeOverlay($.kui.kmap.markerPolyline);
                    $.kui.kmap.markerPolyline = null;
                    $.kui.kmap.markerPolyPoint = [];
                    $.kui.kmap.markerPolyPointBaidu = null;

                }
            }
            if ($.kui.kmap.addMarkerType == 2) { //矩形 

                if (null != $.kui.kmap.markerRectBounds) {
                    var temp = $.kui.kmap.getLatLngString($.kui.kmap.markerRectBounds);
                    $.kui.kmap.drawingModeResult = temp;
                }
                if (null != $.kui.kmap.markerRectangle) {
                    $.kui.kmap.map.removeOverlay($.kui.kmap.markerRectangle);
                    $.kui.kmap.markerRectangle = null;
                    $.kui.kmap.markerRectStart = null;
                    $.kui.kmap.markerRectBounds = null;
                }
            }
            if ($.kui.kmap.addMarkerType == 3) { //多边形 
                if ($.kui.kmap.markerPolyPoint.length > 2) {
                    console.log($.kui.kmap.distinct($.kui.kmap.markerPolyPoint));
                    var temp = $.kui.kmap.getLatLngString($.kui.kmap.distinct($.kui.kmap.markerPolyPoint));
                    $.kui.kmap.drawingModeResult = temp;
                }
                //绘制结束，删除事件 清理对象
                if (null != $.kui.kmap.markerPolygon) {
                    $.kui.kmap.map.removeOverlay($.kui.kmap.markerPolygon);
                    $.kui.kmap.markerPolygon = null;
                    $.kui.kmap.markerPolyPoint = [];
                    $.kui.kmap.markerPolyPointBaidu = null;
                }
            }
            if ($.kui.kmap.addMarkerType == 4) { //圆形 
                if ($.kui.kmap.markerCenterPoint && $.kui.kmap.markerRadius) {
                    $.kui.kmap.markerCenterPoint.radius = $.kui.kmap.markerRadius;
                    $.kui.kmap.drawingModeResult = $.kui.kmap.markerCenterPoint;
                }
                if (null != $.kui.kmap.markerCircle) {
                    $.kui.kmap.map.removeOverlay($.kui.kmap.markerCircle);
                    $.kui.kmap.markerCircle = null;
                    $.kui.kmap.markerCenterPoint = null;
                }
            }
            $.kui.kmap.drawingMode = false; //关闭绘图模式 
            $.kui.kmap.addMarkerType = null;
            $.kui.kmap.overlayDiv.hide();
            $('#tip').hide();
            $.kui.kmap.map.enableDoubleClickZoom();
            $.kui.kmap.map.enableDragging();
        },
        getLatLngBounds: function(start, end) { //根据起点终点绘制矩形
            var type = $.kui.kmap.option.type;
            if ('baidu' == type) {
                $.kui.kmap.markerRectBounds = [new BMap.Point(start.lng, start.lat),
                    new BMap.Point(end.lng, start.lat),
                    new BMap.Point(end.lng, end.lat),
                    new BMap.Point(start.lng, end.lat)
                ];
            }
            if (type == "google_zh" || type == "google") {
                var startPt_ = overlay.getProjection().fromLatLngToDivPixel(start);
                var endPt_ = overlay.getProjection().fromLatLngToDivPixel(end);
                var left = Math.min(startPt_.x, endPt_.x);
                var top = Math.min(startPt_.y, endPt_.y);
                var width = Math.abs(startPt_.x - endPt_.x);
                var height = Math.abs(startPt_.y - endPt_.y);
                var sw = overlay.getProjection().fromDivPixelToLatLng(new google.maps.Point(left, top + height));
                var ne = overlay.getProjection().fromDivPixelToLatLng(new google.maps.Point(left + width, top));
                $.kui.kmap.markerRectBounds = new google.maps.LatLngBounds(sw, ne);
            }
            return $.kui.kmap.markerRectBounds;
        },
        getLatLngString: function(points) { //把经纬度转换成用逗号隔开的字符串
            var lat = new Array();
            var lng = new Array();
            for (var i = 0; i < points.length; i += 1) {
                lat.push(points[i].lat.toFixed(6));
                lng.push(points[i].lng.toFixed(6));
            }
            return { lat: lat.toString(), lng: lng.toString() };
        },
        distance: function(lat1, lon1, lat2, lon2, len) { //获取地图上俩个点之间的距离
            var R = 6371 * 1000; // km (change this constant to get miles)
            var dLat = (lat2 - lat1) * Math.PI / 180;
            var dLon = (lon2 - lon1) * Math.PI / 180;
            var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            var d = R * c;
            return d + len;
        },
        distinct: function(arr) { //多坐标去重
            var res = [];
            var json = {};
            for (var i = 0; i < arr.length; i++) {　　　　
                if (!json[arr[i].lng.toString()]) {　　　　　　
                    res.push(arr[i]);
                    json[arr[i].lng.toString()] = 1;　　　　
                }　　
            }
            return res;
        },
        openDrawingMode: function(drawingType, callback, option) { //打开绘图模式
            if (!$.kui.kmap.drawingMode) {
                $.kui.kmap.drawingMode = true; //开启绘图模式
                $.kui.kmap.overlayDiv.show($.kui.kmap.map);
                $.kui.kmap.overlayDiv.setCursor("crosshair");
                $.kui.kmap.map.disableDoubleClickZoom(); //禁止地图双击放大
                $.kui.kmap.map.disableDragging(); //禁止地图拖拽
                $.kui.kmap.addMarkerType = drawingType;
                if (option) { //如果存在自定义图像样式，否则默认
                    $.kui.kmap.drawingModeOptions = $["extend"](!![], {}, option, $.kui.kmap.drawingModeOptions);
                } else {
                    $.kui.kmap.drawingModeOptions = $.kui.kmap.drawingModeOptions == null ? { //绘图初始化
                        fillColor: "#FF0000", // 填充色
                        fillOpacity: 0.3, // 填充色透明度
                        strokeColor: "#FF0000", // 线条颜色 黑色
                        strokeOpacity: 0.8, // 透明度 70%
                        strokeStyle: "solid",
                        strokeWeight: 1 // 宽度 5像素
                    } : $.kui.kmap.drawingModeOptions;
                }
                //添加鼠标提示工具
                var tipDiv = "<div id=\"tip\" class=\"tooltip right\" style=\"position: absolute; z-index: 10; \" role=\"tooltip\">" +
                    "<div class=\"tooltip-arrow\"></div>" +
                    "<div class=\"tooltip-inner\"></div></div>";
                $("#" + $.kui.kmap.option.id).append(tipDiv);
                //通过计时器 结束绘图时调用回调
                var cb = setInterval(function() {
                    if (!$.kui.kmap.drawingMode) { //绘图结束
                        callback($.kui.kmap.drawingModeResult);
                        clearInterval(cb);
                    }
                }, 1000);
            }
        },
        addPolyline: function(e) { //添加折线
            var q = /msie (\d+\.\d)/i.test(navigator.userAgent); //判断是否ie
            e = window.event || e;
            if (e.button != 1 && q || e.button != 0 && !q) {
                return;
            }
            if (q && $.kui.kmap.overlayDiv.getDom($.kui.kmap.map).setCapture) {
                $.kui.kmap.overlayDiv.getDom(p).setCapture(); //将鼠标事件锁定在指定的元素上
            }
            e.point = $.kui.kmap.overlayDiv.getDrawPoint(e, true);
            //console.log(e.point);
            $.kui.kmap.markerPolyPoint.push(e.point);
            $.kui.kmap.markerPolyPointBaidu = $.kui.kmap.markerPolyPoint.concat($.kui.kmap.markerPolyPoint[$.kui.kmap.markerPolyPoint.length - 1]);
            if ($.kui.kmap.markerPolyline == null) {
                //添加多边形
                $.kui.kmap.markerPolyline = new BMap.Polyline($.kui.kmap.markerPolyPointBaidu, $.kui.kmap.drawingModeOptions);
                $.kui.kmap.map.addOverlay($.kui.kmap.markerPolyline);
            } else {
                $.kui.kmap.markerPolyline.setPath($.kui.kmap.markerPolyPointBaidu);
            }
        },
        addRectangle: function(e) { //添加矩形
            var q = /msie (\d+\.\d)/i.test(navigator.userAgent); //判断是否ie
            e = window.event || e;
            if (e.button != 1 && q || e.button != 0 && !q || e.controlButton == "right") {
                return;
            }
            if (q && $.kui.kmap.overlayDiv.getDom($.kui.kmap.map).setCapture) {
                $.kui.kmap.overlayDiv.getDom(p).setCapture(); //将鼠标事件锁定在指定的元素上
            }
            if (null == $.kui.kmap.markerRectangle) {
                $.kui.kmap.markerRectStart = $.kui.kmap.overlayDiv.getDrawPoint(e, true);
                //根据起点终点获取矩形四个顶点
                var endPoint = $.kui.kmap.markerRectStart;
                //添加矩形
                $.kui.kmap.markerRectangle = new BMap.Polygon($.kui.kmap.getLatLngBounds($.kui.kmap.markerRectStart, endPoint), $.kui.kmap.drawingModeOptions);
                //console.log($.kui.kmap.markerRectBounds);
                $.kui.kmap.map.addOverlay($.kui.kmap.markerRectangle);
            }

        },
        addPolygon: function(e) { //添加多边形
            var q = /msie (\d+\.\d)/i.test(navigator.userAgent); //判断是否ie
            e = window.event || e;
            if (e.button != 1 && q || e.button != 0 && !q) {
                return;
            }
            if (q && $.kui.kmap.overlayDiv.getDom($.kui.kmap.map).setCapture) {
                $.kui.kmap.overlayDiv.getDom(p).setCapture(); //将鼠标事件锁定在指定的元素上
            }
            e.point = $.kui.kmap.overlayDiv.getDrawPoint(e, true);
            //console.log(e.point);
            $.kui.kmap.markerPolyPoint.push(e.point);
            $.kui.kmap.markerPolyPointBaidu = $.kui.kmap.markerPolyPoint.concat($.kui.kmap.markerPolyPoint[$.kui.kmap.markerPolyPoint.length - 1]);
            if ($.kui.kmap.markerPolygon == null) {
                //添加多边形
                $.kui.kmap.markerPolygon = new BMap.Polygon($.kui.kmap.markerPolyPointBaidu, $.kui.kmap.drawingModeOptions);
                $.kui.kmap.map.addOverlay($.kui.kmap.markerPolygon);
            } else {
                $.kui.kmap.markerPolygon.setPath($.kui.kmap.markerPolyPointBaidu);
            }
        },
        addCircle: function(e) { //添加多边形
            var q = /msie (\d+\.\d)/i.test(navigator.userAgent); //判断是否ie
            e = window.event || e;
            if (e.button != 1 && q || e.button != 0 && !q) {
                return;
            }
            if (q && $.kui.kmap.overlayDiv.getDom($.kui.kmap.map).setCapture) {
                $.kui.kmap.overlayDiv.getDom(p).setCapture(); //将鼠标事件锁定在指定的元素上
            }
            $.kui.kmap.markerCenterPoint = $.kui.kmap.overlayDiv.getDrawPoint(e, true); //圆形中心点
            if ($.kui.kmap.markerCircle == null) {
                $.kui.kmap.markerCircle = new BMap.Circle($.kui.kmap.markerCenterPoint, 0, $.kui.kmap.drawingModeOptions);
                $.kui.kmap.map.addOverlay($.kui.kmap.markerCircle);
            }

        },
        movePolyline: function(e) { //移动折线
            if ($.kui.kmap.markerPolyline != null) {
                e.point = $.kui.kmap.overlayDiv.getDrawPoint(e, true);
                $.kui.kmap.markerPolyline.setPositionAt($.kui.kmap.markerPolyPointBaidu.length - 1, e.point);
            }
        },
        moveRectangle: function(e) { //移动矩形
            if ($.kui.kmap.markerRectangle != null) {
                e.point = $.kui.kmap.overlayDiv.getDrawPoint(e, true);
                //根据起点终点获取矩形四个顶点
                $.kui.kmap.markerRectangle.setPath($.kui.kmap.getLatLngBounds($.kui.kmap.markerRectStart, e.point));
            }
        },
        movePolygon: function(e) { //移动多边形
            if ($.kui.kmap.markerPolygon != null) {
                e.point = $.kui.kmap.overlayDiv.getDrawPoint(e, true);
                $.kui.kmap.markerPolygon.setPositionAt($.kui.kmap.markerPolyPointBaidu.length - 1, e.point);
            }
        },
        moveCircle: function(e) { //移动圆形
            if ($.kui.kmap.markerCircle != null) {
                e.point = $.kui.kmap.overlayDiv.getDrawPoint(e, true);
                //$.kui.kmap.map.getDistance($.kui.kmap.markerCenterPoint, e.point) 百度自带测距方法，已注销
                $.kui.kmap.markerRadius = $.kui.kmap.distance($.kui.kmap.markerCenterPoint.lat, $.kui.kmap.markerCenterPoint.lng, e.point.lat, e.point.lng, 0)
                $.kui.kmap.markerCircle.setRadius($.kui.kmap.markerRadius);
            }
        },
    }
})(jQuery);