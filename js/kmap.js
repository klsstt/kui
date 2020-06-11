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
    //地图属性
    $['kmap'] = {
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
                if (o != $.kmap.overlayDiv.getDom(this._map) && r == true) {
                    while (o && o != this._map.getContainer()) {
                        if (!(o.clientWidth == 0 && o.clientHeight == 0 && o.offsetParent && o.offsetParent.nodeName.toLowerCase() == "td")) {
                            m += o.offsetLeft;
                            q += o.offsetTop
                        }
                        o = o.offsetParent
                    }
                }
                if (o != $.kmap.overlayDiv.getDom(this._map) && o != this._map.getContainer()) {
                    return
                }
                if (typeof m === "undefined" || typeof q === "undefined") {
                    return
                }
                if (isNaN(m) || isNaN(q)) {
                    return
                }
                return $.kmap.pixelToPoint({ x: m, y: q });
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
        /**
         * 包含标记的群集。
         *
         * @param {MarkerClusterer} markerClusterer The markerclusterer that this
         *     cluster is associated with.
         * @constructor
         * @ignore
         */
        Cluster: function(markerClusterer) {
            this.markerClusterer_ = markerClusterer;
            this.map_ = markerClusterer.getMap();
            this.gridSize_ = markerClusterer.getGridSize();
            this.minClusterSize_ = markerClusterer.getMinClusterSize();
            this.averageCenter_ = markerClusterer.isAverageCenter();
            this.center_ = null;
            this.markers_ = [];
            this.bounds_ = null;
            this.clusterIcon_ = new $.kmap.ClusterIcon(this, markerClusterer.getStyles(),
                markerClusterer.getGridSize());
        },
        /**
         *一个群集图标
         *
         * @param {Cluster} cluster 要关联的群集。
         * @param {Object} styles 具有样式属性的对象：
         *     'url':(字符串）图片网址。
         *'height':(数字）图像高度。
         *'width':(数字）图像宽度。
         *'anchor':( Array）标签文本的锚位置。
         *'textColor':(字符串）文本颜色。
         *'textSize':(数字）文字大小。
         *'backgroundPosition：（string）背景信息x，y。
         * @param {number=} opt_padding 可选填充以应用于群集图标。
         * @constructor
         * @extends google.maps.OverlayView
         * @ignore
         */
        ClusterIcon: function(cluster, styles, opt_padding) {
            this.styles_ = styles;
            this.padding_ = opt_padding || 0;
            this.cluster_ = cluster;
            this.center_ = null;
            this.map_ = cluster.getMap();
            this.div_ = null;
            this.sums_ = null;
            this.visible_ = false;

            this.setMap(this.map_);
        },
        /**
         * A Marker Clusterer that clusters markers.
         *
         * @param  map 要附加到的Google地图。
         * @param {Array.<$.kui.Marker>=} opt_markers 要添加的可选标记
         * @param {Object=} opt_options 支持以下选项：
         *'gridSize':( number）簇的网格大小（以像素为单位）。
         *'maxZoom':(数字）标记可以作为a的一部分的最大缩放级别集群。
         *'zoomOnClick':( boolean）是否单击a的默认行为群集是放大它。
         *'averageCenter':(布尔值）每个群集的中心是否应该是群集中所有标记的平均值。
         *'minimumClusterSize':( number）要在a中的最小标记数标记隐藏之前的簇和计数显示。
         *'styles':( object）具有样式属性的对象：
         *'url':(字符串）图片网址。
         *'height':(数字）图像高度。
         *'width':(数字）图像宽度。
         *'anchor':( Array）标签文本的锚位置。
         *'textColor':(字符串）文本颜色。
         *'textSize':(数字）文字大小。
         *'backgroundPosition':(字符串）背景x，y的位置。
         * @constructor
         * @extends OverlayView
         */
        MarkerClusterer: function(map, opt_markers, opt_options) {
            //MarkerClusterer实现了google.maps.OverlayView接口。 我们使用
                 //使用google.maps.OverlayView扩展功能以扩展MarkerClusterer
                 //因为在定义代码时它可能并不总是可用，所以我们
                 //在最后一刻寻找它。 如果它现在不存在那么
                 //没有必要继续:)

            this.map_ = map;

            /**
             * @type {Array.<google.maps.Marker>}
             * @private
             */
            this.markers_ = [];

            /**
             *  @type {Array.<Cluster>}
             */
            this.clusters_ = [];

            this.sizes = [53, 56, 66, 78, 90];

            /**
             * @private
             */
            this.styles_ = [];

            /**
             * @type {boolean}
             * @private
             */
            this.ready_ = false;

            var options = opt_options || {};

            /**
             * @type {number}
             * @private
             */
            this.gridSize_ = options['gridSize'] || 60;

            /**
             * @private
             */
            this.minClusterSize_ = options['minimumClusterSize'] || 2;


            /**
             * @type {?number}
             * @private
             */
            this.maxZoom_ = options['maxZoom'] || null;

            this.styles_ = options['styles'] || [];

            /**
             * @type {string}
             * @private
             */
            this.imagePath_ = options['imagePath'] ||
                this.MARKER_CLUSTER_IMAGE_PATH_;

            /**
             * @type {string}
             * @private
             */
            this.imageExtension_ = options['imageExtension'] ||
                this.MARKER_CLUSTER_IMAGE_EXTENSION_;

            /**
             * @type {boolean}
             * @private
             */
            this.zoomOnClick_ = true;

            if (options['zoomOnClick'] != undefined) {
                this.zoomOnClick_ = options['zoomOnClick'];
            }

            /**
             * @type {boolean}
             * @private
             */
            this.averageCenter_ = false;

            if (options['averageCenter'] != undefined) {
                this.averageCenter_ = options['averageCenter'];
            }

            this.setupStyles_();

            this.setMap2(map);
            this.setMap(map);

            /**
             * @type {number}
             * @private
             */
            this.prevZoom_ = this.map_.getZoom();

            //添加地图事件侦听器
            var that = this;
            if ("google_zh" == $.kmap.option.type || "google" == $.kmap.option.type) {
                google.maps.event.addListener(this.map_, 'zoom_changed', function() {
                    //确定地图类型并防止非法缩放级别
                    var zoom = that.map_.getZoom();
                    var minZoom = that.map_.minZoom || 0;
                    var maxZoom = Math.min(that.map_.maxZoom || 100,
                        that.map_.mapTypes[that.map_.getMapTypeId()].maxZoom);
                    zoom = Math.min(Math.max(zoom, minZoom), maxZoom);

                    if (that.prevZoom_ != zoom) {
                        that.prevZoom_ = zoom;
                        that.resetViewport();
                    }
                });

                google.maps.event.addListener(this.map_, 'idle', function() {
                    that.redraw();
                });

            }
            if ("baidu" == $.kmap.option.type) {
                this.map_.addEventListener('zoomstart', function() {
                    //确定地图类型并防止非法缩放级别
                    var zoom = that.map_.getZoom();
                    var minZoom = that.map_.minZoom || 0;
                    var maxZoom = Math.min(that.map_.maxZoom || 100,
                        that.map_.getMapType().getMaxZoom());
                    zoom = Math.min(Math.max(zoom, minZoom), maxZoom);

                    if (that.prevZoom_ != zoom) {
                        that.prevZoom_ = zoom;
                        that.resetViewport();
                    }
                });
                this.map_.addEventListener('zoomend', function(type, target) {
                    //console.log(type);
                    that.redraw();
                });
            }
            // 最后，添加标记
            if (opt_markers && (opt_markers.length || Object.keys(opt_markers).length)) {
                this.addMarkers(opt_markers, false);
            }
        },
        initMc: function() {
            //初始化Cluster

            /**
             * 确定是否已将标记添加到群集。
             *
             * @param {google.maps.Marker} marker 要检查的标记。
             * @return {boolean} 如果已添加标记，则为True。
             */
            $.kmap.Cluster.prototype.isMarkerAlreadyAdded = function(marker) {
                if (this.markers_.indexOf) {
                    return this.markers_.indexOf(marker) != -1;
                } else {
                    for (var i = 0, m; m = this.markers_[i]; i++) {
                        if (m == marker) {
                            return true;
                        }
                    }
                }
                return false;
            };


            /**
             * 在集群中添加标记。
             *
             * @param {google.maps.Marker} marker 要添加的标记。
             * @return {boolean} 如果添加了标记，则为True。
             */
            $.kmap.Cluster.prototype.addMarker = function(marker) {
                if (this.isMarkerAlreadyAdded(marker)) {
                    return false;
                }

                if (!this.center_) {
                    this.center_ = marker.getPosition();
                    this.calculateBounds_();
                } else {
                    if (this.averageCenter_) {
                        var l = this.markers_.length + 1;
                        var lat = (this.center_.lat() * (l - 1) + marker.getPosition().lat()) / l;
                        var lng = (this.center_.lng() * (l - 1) + marker.getPosition().lng()) / l;
                        this.center_ = new google.maps.LatLng(lat, lng);
                        this.calculateBounds_();
                    }
                }

                marker.isAdded = true;
                this.markers_.push(marker);

                var len = this.markers_.length;
                if (len < this.minClusterSize_) {
                    //未达到最小簇大小，因此显示标记。 && marker.getMap() != this.map_
                    marker.show();
                }

                if (len == this.minClusterSize_) {
                    //隐藏正在显示的标记。
                    for (var i = 0; i < len; i++) {
                        this.markers_[i].hide();
                    }
                }

                if (len >= this.minClusterSize_) {
                    //marker.setMap(null);
                    marker.hide();
                }

                this.updateIcon();
                return true;
            };


            /**
             * 返回与集群关联的标记clusterer。
             *
             * @return {MarkerClusterer} 关联的标记聚类器。
             */
            $.kmap.Cluster.prototype.getMarkerClusterer = function() {
                return this.markerClusterer_;
            };


            /**
             * 返回集群的边界。
             *
             * @return {google.maps.LatLngBounds} 群集边界。
             */
            $.kmap.Cluster.prototype.getBounds = function() {
                var bounds = null;
                switch ($.kmap.option.type) {
                    case 'baidu':
                        bounds = new BMap.Bounds(this.center_, this.center_);
                        break;
                    case 'google':
                    case 'google_zh':
                        bounds = new google.maps.LatLngBounds(this.center_, this.center_);
                        break;
                }
                var markers = this.getMarkers();
                for (var i = 0, marker; marker = markers[i]; i++) {
                    bounds.extend(marker.getPosition());
                }
                return bounds;
            };


            /**
             * 删除群集
             */
            $.kmap.Cluster.prototype.remove = function() {
                this.clusterIcon_.remove();
                this.markers_.length = 0;
                delete this.markers_;
            };


            /**
             * 返回集群的中心。
             *
             * @return {number} The cluster center.
             */
            $.kmap.Cluster.prototype.getSize = function() {
                return this.markers_.length;
            };


            /**
             * 返回集群的中心。
             *
             * @return {Array.<google.maps.Marker>} The cluster center.
             */
            $.kmap.Cluster.prototype.getMarkers = function() {
                return this.markers_;
            };


            /**
             * 返回集群的中心。
             *
             * @return {google.maps.LatLng} The cluster center.
             */
            $.kmap.Cluster.prototype.getCenter = function() {
                return this.center_;
            };


            /**
             * 使用网格计算集群的扩展边界。
             *
             * @private
             */
            $.kmap.Cluster.prototype.calculateBounds_ = function() {
                var type = $.kmap.option.type;
                var bounds = null;
                if ('baidu' == type) {
                    bounds = new BMap.Bounds(this.center_, this.center_);
                }
                if (type == "google_zh" || type == "google") {
                    bounds = new google.maps.LatLngBounds(this.center_, this.center_);
                }
                this.bounds_ = this.markerClusterer_.getExtendedBounds(bounds);
            };


            /**
             * 确定标记是否位于簇边界中。
             *
             * @param {google.maps.Marker} marker 要检查的标记。
             * @return {boolean} 如果标记位于边界内，则为True。
             */
            $.kmap.Cluster.prototype.isMarkerInClusterBounds = function(marker) {
                var isb = false;
                switch ($.kmap.option.type) {
                    case 'baidu':
                        isb = this.bounds_.containsPoint(marker.getPosition());
                        break;
                    case 'google':
                    case 'google_zh':
                        isb = this.bounds_.contains(marker.getPosition());
                        break;
                }
                return isb;
            };


            /**
             * 返回与集群关联的映射。
             *
             * @return {google.maps.Map} 地图。
             */
            $.kmap.Cluster.prototype.getMap = function() {
                return this.map_;
            };


            /**
             * 更新群集图标
             */
            $.kmap.Cluster.prototype.updateIcon = function() {
                var zoom = this.map_.getZoom();
                var mz = this.markerClusterer_.getMaxZoom();

                if (mz && zoom > mz) {
                    //缩放大于我们的最大缩放，因此显示群集中的所有标记。
                    for (var i = 0, marker; marker = this.markers_[i]; i++) {
                        marker.setMap(this.map_);
                    }
                    return;
                }

                if (this.markers_.length < this.minClusterSize_) {
                    //尚未达到最小簇大小。
                    this.clusterIcon_.hide();
                    return;
                }

                var numStyles = this.markerClusterer_.getStyles().length;
                var sums = this.markerClusterer_.getCalculator()(this.markers_, numStyles);
                this.clusterIcon_.setCenter(this.center_);
                this.clusterIcon_.setSums(sums);
                this.clusterIcon_.show();
            };


            //初始化ClusterIcon
            if ("google_zh" == $.kmap.option.type || "google" == $.kmap.option.type) {
                $.kmap.ClusterIcon.prototype = new google.maps.OverlayView();
            }


            if ("baidu" == $.kmap.option.type) {
                $.kmap.ClusterIcon.prototype = new BMap.Overlay();
                $.kmap.ClusterIcon.prototype.initialize = function() {
                    return this.onAdd(this);
                };
                $.kmap.ClusterIcon.prototype.setMap = function(nativeMap) {
                    if (nativeMap == null)
                        this.map_.removeOverlay(this);
                    else {
                        nativeMap.addOverlay(this);
                    }
                };
            }



            /**
             * 如果设置了该选项，则触发clusterclick事件并缩放。
             */
            $.kmap.ClusterIcon.prototype.triggerClusterClick = function() {
                var markerClusterer = this.cluster_.getMarkerClusterer();
                switch ($.kmap.option.type) {
                    case 'baidu':
                        //this.map_.trigger("zoomend", this.cluster_);

                        if (markerClusterer.isZoomOnClick()) {
                            //放大群集。
                            this.map_.setViewport(this.cluster_.getBounds(), { enableAnimation: true });
                            this.map_.zoomIn();
                        }
                        break;
                    case 'google':
                    case 'google_zh':
                        //触发 clusterclick 事件。
                        google.maps.event.trigger(markerClusterer, 'clusterclick', this.cluster_);
                        if (markerClusterer.isZoomOnClick()) {
                            //放大群集。
                            this.map_.fitBounds(this.cluster_.getBounds());
                        }
                        break;
                }


            };
            /**
             * 将群集图标添加到dom。
             * @ignore
             */
            $.kmap.ClusterIcon.prototype.onAdd = function(e) {
                var e = e != null ? e : this;
                e.div_ = document.createElement('DIV');
                if (e.visible_) {
                    var pos = e.getPosFromLatLng_(e.center_);
                    e.div_.style.cssText = e.createCss(pos);
                    e.div_.innerHTML = e.sums_.text;
                }
                switch ($.kmap.option.type) {
                    case 'baidu':
                        var panes = e.map_.getPanes();
                        panes.floatShadow.appendChild(e.div_);
                        e.div_.addEventListener('click', function() {
                            e.triggerClusterClick();
                        });
                        break;
                    case 'google':
                    case 'google_zh':

                        var panes = e.getPanes();
                        panes.overlayMouseTarget.appendChild(e.div_);
                        google.maps.event.addDomListener(e.div_, 'click', function() {
                            e.triggerClusterClick();
                        });
                        break;
                }

            };


            /**
             * 返回在divlng上放置div dending的位置。
             *
             * @param {google.maps.LatLng} latlng 在latlng的位置。
             * @return {google.maps.Point} 位置以像素为单位。
             * @private
             */
            $.kmap.ClusterIcon.prototype.getPosFromLatLng_ = function(latlng) {
                var pos = null;
                switch ($.kmap.option.type) {
                    case 'baidu':
                        pos = this.map_.pointToOverlayPixel(latlng);
                        pos.x -= parseInt(this.width_ / 2, 10);
                        pos.y -= parseInt(this.height_ / 2, 10);
                        break;
                    case 'google':
                    case 'google_zh':
                        pos = this.getProjection().fromLatLngToDivPixel(latlng);
                        pos.x -= parseInt(this.width_ / 2, 10);
                        pos.y -= parseInt(this.height_ / 2, 10);
                        break;
                }
                return pos;
            };


            /**
             * 画出图标。
             * @ignore
             */
            $.kmap.ClusterIcon.prototype.draw = function() {
                if (this.visible_) {
                    var pos = this.getPosFromLatLng_(this.center_);
                    this.div_.style.top = pos.y + 'px';
                    this.div_.style.left = pos.x + 'px';
                }
            };


            /**
             * 隐藏图标。
             */
            $.kmap.ClusterIcon.prototype.hide = function() {
                if (this.div_) {
                    this.div_.style.display = 'none';
                }
                this.visible_ = false;
            };


            /**
             * 定位并显示图标。
             */
            $.kmap.ClusterIcon.prototype.show = function() {
                if (this.div_) {
                    var pos = this.getPosFromLatLng_(this.center_);
                    this.div_.style.cssText = this.createCss(pos);
                    this.div_.style.display = '';
                }
                this.visible_ = true;
            };


            /**
             * 从地图中删除图标
             */
            $.kmap.ClusterIcon.prototype.remove = function() {
                switch ($.kmap.option.type) {
                    case 'baidu':
                        this.onRemove();
                        break;
                    case 'google':
                    case 'google_zh':
                        this.setMap(null);
                        break;
                }
            };


            /**
             * onRemove接口的实现。
             * @ignore
             */
            $.kmap.ClusterIcon.prototype.onRemove = function() {
                if (this.div_ && this.div_.parentNode) {
                    this.hide();
                    this.div_.parentNode.removeChild(this.div_);
                    this.div_ = null;
                }
            };


            /**
             * 设置图标的总和。
             *
             * @param {Object} sums 总和包含：
             *   'text': (string) 要在图标中显示的文本。
             *   'index': (number) 图标的样式索引。
             */
            $.kmap.ClusterIcon.prototype.setSums = function(sums) {
                this.sums_ = sums;
                this.text_ = sums.text;
                this.index_ = sums.index;
                if (this.div_) {
                    this.div_.innerHTML = sums.text;
                }

                this.useStyle();
            };


            /**
             * 将图标设置为样式。
             */
            $.kmap.ClusterIcon.prototype.useStyle = function() {
                var index = Math.max(0, this.sums_.index - 1);
                index = Math.min(this.styles_.length - 1, index);
                var style = this.styles_[index];
                this.url_ = style['url'];
                this.height_ = style['height'];
                this.width_ = style['width'];
                this.textColor_ = style['textColor'];
                this.anchor_ = style['anchor'];
                this.textSize_ = style['textSize'];
                this.backgroundPosition_ = style['backgroundPosition'];
            };


            /**
             * 设置图标的中心。
             *
             * @param {google.maps.LatLng} center The latlng to set as the center.
             */
            $.kmap.ClusterIcon.prototype.setCenter = function(center) {
                this.center_ = center;
            };


            /**
             * 根据图标的位置创建css文本。
             * @param {google.maps.Point} pos The position.
             * @return {string} The css style text.
             */
            $.kmap.ClusterIcon.prototype.createCss = function(pos) {
                var style = [];
                style.push('background-image:url(' + this.url_ + ');');
                var backgroundPosition = this.backgroundPosition_ ? this.backgroundPosition_ : '0 0';
                style.push('background-position:' + backgroundPosition + ';');

                if (typeof this.anchor_ === 'object') {
                    if (typeof this.anchor_[0] === 'number' && this.anchor_[0] > 0 &&
                        this.anchor_[0] < this.height_) {
                        style.push('height:' + (this.height_ - this.anchor_[0]) +
                            'px; padding-top:' + this.anchor_[0] + 'px;');
                    } else {
                        style.push('height:' + this.height_ + 'px; line-height:' + this.height_ +
                            'px;');
                    }
                    if (typeof this.anchor_[1] === 'number' && this.anchor_[1] > 0 &&
                        this.anchor_[1] < this.width_) {
                        style.push('width:' + (this.width_ - this.anchor_[1]) +
                            'px; padding-left:' + this.anchor_[1] + 'px;');
                    } else {
                        style.push('width:' + this.width_ + 'px; text-align:center;');
                    }
                } else {
                    style.push('height:' + this.height_ + 'px; line-height:' +
                        this.height_ + 'px; width:' + this.width_ + 'px; text-align:center;');
                }

                var txtColor = this.textColor_ ? this.textColor_ : 'black';
                var txtSize = this.textSize_ ? this.textSize_ : 11;

                style.push('cursor:pointer; top:' + pos.y + 'px; left:' +
                    pos.x + 'px; color:' + txtColor + '; position:absolute; font-size:' +
                    txtSize + 'px; font-family:Arial,sans-serif; font-weight:bold');
                return style.join('');
            };


            //初始化MarkerClusterer


            if ("google_zh" == $.kmap.option.type || "google" == $.kmap.option.type) {
                $.kmap.MarkerClusterer.prototype = new google.maps.OverlayView();
            }
            if ("baidu" == $.kmap.option.type) {
                $.kmap.MarkerClusterer.prototype = new BMap.Overlay();
                $.kmap.MarkerClusterer.prototype.initialize = function() {
                    return this.onAdd(this);
                };
                $.kmap.MarkerClusterer.prototype.setMap = function(nativeMap) {
                    if (nativeMap == null)
                        this.map_.removeOverlay(this);
                    else {
                        nativeMap.addOverlay(this);
                    }
                };
            }
            /**
             * 标记群集图像路径。
             *
             * @type {string}
             * @private
             */
            $.kmap.MarkerClusterer.prototype.MARKER_CLUSTER_IMAGE_PATH_ = '../images/m';


            /**
             * 标记群集图像路径。
             *
             * @type {string}
             * @private
             */
            $.kmap.MarkerClusterer.prototype.MARKER_CLUSTER_IMAGE_EXTENSION_ = 'png';


            /**
             * 由其他人扩展对象原型。
             *
             * @param {Object} obj1 要扩展的对象。
             * @param {Object} obj2 用于扩展的对象。
             * @return {Object} 新的扩展对象。
             * @ignore
             */
            $.kmap.MarkerClusterer.prototype.extend = function(obj1, obj2) {
                return (function(object) {
                    for (var property in object.prototype) {
                        this.prototype[property] = object.prototype[property];
                    }
                    return this;
                }).apply(obj1, [obj2]);
            };


            /**
             * 接口方法的实现。
             * @ignore
             */
            $.kmap.MarkerClusterer.prototype.onAdd = function() {
                this.setReady_(true);
            };
            /**
             * 接口方法的实现。
             * @ignore
             */
            $.kmap.MarkerClusterer.prototype.draw = function() {};

            /**
             * 设置样式对象。
             *
             * @private
             */
            $.kmap.MarkerClusterer.prototype.setupStyles_ = function() {
                if (this.styles_.length) {
                    return;
                }

                for (var i = 0, size; size = this.sizes[i]; i++) {
                    this.styles_.push({
                        url: this.imagePath_ + (i) + '.' + this.imageExtension_,
                        height: size,
                        width: size
                    });
                }
            };

            /**
             * 使地图适合群集器中标记的边界。
             */
            $.kmap.MarkerClusterer.prototype.fitMapToMarkers = function() {
                var markers = this.getMarkers();
                var bounds = new google.maps.LatLngBounds();
                for (var i = 0, marker; marker = markers[i]; i++) {
                    bounds.extend(marker.getPosition());
                }

                this.map_.fitBounds(bounds);
            };


            /**
             * 设置样式。
             *
             *  @param {Object} styles 要设置的样式。
             */
            $.kmap.MarkerClusterer.prototype.setStyles = function(styles) {
                this.styles_ = styles;
            };


            /**
             *  Gets the styles.
             *
             *  @return {Object} The styles object.
             */
            $.kmap.MarkerClusterer.prototype.getStyles = function() {
                return this.styles_;
            };


            /**
             * 是否设置了放大点击。
             *
             * @return {boolean} True if zoomOnClick_ is set.
             */
            $.kmap.MarkerClusterer.prototype.isZoomOnClick = function() {
                return this.zoomOnClick_;
            };

            /**
             *是否设定了平均中心。
             *
             * @return {boolean} True if averageCenter_ is set.
             */
            $.kmap.MarkerClusterer.prototype.isAverageCenter = function() {
                return this.averageCenter_;
            };


            /**
             *  返回clusterer中的标记数组。
             *
             *  @return {Array.<google.maps.Marker>} The markers.
             */
            $.kmap.MarkerClusterer.prototype.getMarkers = function() {
                return this.markers_;
            };


            /**
             *  返回聚类器中的标记数
             *
             *  @return {Number} The number of markers.
             */
            $.kmap.MarkerClusterer.prototype.getTotalMarkers = function() {
                return this.markers_.length;
            };


            /**
             * 设置clusterer的最大缩放。
             *
             *  @param {number} maxZoom The max zoom level.
             */
            $.kmap.MarkerClusterer.prototype.setMaxZoom = function(maxZoom) {
                this.maxZoom_ = maxZoom;
            };


            /**
             * 获取clusterer的最大缩放。
             *
             *  @return {number} The max zoom level.
             */
            $.kmap.MarkerClusterer.prototype.getMaxZoom = function() {
                return this.maxZoom_;
            };


            /**
             *  用于计算群集图标图像的功能。
             *
             *  @param {Array.<google.maps.Marker>} markers 群集中的标记。
             *  @param {number} numStyles 可用的样式数量。
             *  @return {Object} 对象属性：'text'（字符串）和'index'（数字）。
             *  @private
             */
            $.kmap.MarkerClusterer.prototype.calculator_ = function(markers, numStyles) {
                var index = 0;
                var count = markers.length;
                var dv = count;
                while (dv !== 0) {
                    dv = parseInt(dv / 10, 10);
                    index++;
                }

                index = Math.min(index, numStyles);
                return {
                    text: count,
                    index: index
                };
            };


            /**
             *设置计算器功能。
             *
             * @param {function(Array, number)} calculator The function to set as the
             *     calculator. The function should return a object properties:
             *     'text' (string) and 'index' (number).
             *
             */
            $.kmap.MarkerClusterer.prototype.setCalculator = function(calculator) {
                this.calculator_ = calculator;
            };


            /**
             *获得计算器功能。
             *
             * @return {function(Array, number)} the calculator function.
             */
            $.kmap.MarkerClusterer.prototype.getCalculator = function() {
                return this.calculator_;
            };


            /**
             * 将一组标记添加到clusterer。
             *
             * @param {Array.<google.maps.Marker>} markers 要添加的标记。
             * @param {boolean=} opt_nodraw 是否重绘群集。
             */
            $.kmap.MarkerClusterer.prototype.addMarkers = function(markers, opt_nodraw) {
                if (markers.length) {
                    for (var i = 0, marker; marker = markers[i]; i++) {
                        this.pushMarkerTo_(marker);
                    }
                } else if (Object.keys(markers).length) {
                    for (var marker in markers) {
                        this.pushMarkerTo_(markers[marker]);
                    }
                }
                if (!opt_nodraw) {
                    this.redraw();
                }
            };
            /**
             * 更新标记
             *
             * @param {Array.<google.maps.Marker>} markers 要更新的标记。
             * @param {boolean=} opt_nodraw 是否重绘群集。
             */
            $.kmap.MarkerClusterer.prototype.updateMarkers = function(markers, opt_nodraw) {

                this.markers_ = markers;
                this.resetViewport();
                if (!opt_nodraw) {
                    this.redraw();
                }
            };

            /**
             * 将标记推送到群集器。
             *
             * @param {google.maps.Marker} marker 要添加的标记。
             * @private
             */
            $.kmap.MarkerClusterer.prototype.pushMarkerTo_ = function(marker) {
                marker.isAdded = false;
                switch ($.kmap.option.type) {
                    case 'baidu':
                        break;
                    case 'google':
                    case 'google_zh':
                        if (marker['draggable']) {
                            //如果标记是可拖动的，则添加一个监听器，以便我们更新集群
                                     //拖动结束
                            var that = this;
                            google.maps.event.addListener(marker, 'dragend', function() {
                                marker.isAdded = false;
                                that.repaint();
                            });
                        }
                        break;
                }
                this.markers_.push(marker);
            };


            /**
             * 将标记添加到群集器并根据需要重绘。
             *
             * @param {google.maps.Marker} marker 要添加的标记。
             * @param {boolean=} opt_nodraw 是否重绘群集。
             */
            $.kmap.MarkerClusterer.prototype.addMarker = function(marker, opt_nodraw) {
                this.pushMarkerTo_(marker);
                if (!opt_nodraw) {
                    this.redraw();
                }
            };


            /**
             * 删除标记，如果删除则返回true，否则返回false
             *
             * @param {google.maps.Marker} marker 要删除的标记
             * @return {boolean} 是否删除了标记
             * @private
             */
            $.kmap.MarkerClusterer.prototype.removeMarker_ = function(marker) {
                var index = -1;
                if (this.markers_.indexOf) {
                    index = this.markers_.indexOf(marker);
                } else {
                    for (var i = 0, m; m = this.markers_[i]; i++) {
                        if (m == marker) {
                            index = i;
                            break;
                        }
                    }
                }

                if (index == -1) {
                    //标记不在我们的标记列表中。
                    return false;
                }

                marker.setMap(null);

                this.markers_.splice(index, 1);

                return true;
            };


            /**
             * 从群集中删除标记。
             *
             * @param {google.maps.Marker} marker 要删除的标记。
             * @param {boolean=} opt_nodraw 可选布尔值，不强制重绘。
             * @return {boolean} 如果删除了标记，则为True。
             */
            $.kmap.MarkerClusterer.prototype.removeMarker = function(marker, opt_nodraw) {
                var removed = this.removeMarker_(marker);

                if (!opt_nodraw && removed) {
                    this.resetViewport();
                    this.redraw();
                    return true;
                } else {
                    return false;
                }
            };


            /**
             * 从群集中删除一系列标记。
             *
             * @param {Array.<google.maps.Marker>} markers 要删除的标记。
             * @param {boolean=} opt_nodraw 可选布尔值，不强制重绘。
             */
            $.kmap.MarkerClusterer.prototype.removeMarkers = function(markers, opt_nodraw) {
                var removed = false;

                for (var i = 0, marker; marker = markers[i]; i++) {
                    var r = this.removeMarker_(marker);
                    removed = removed || r;
                }

                if (!opt_nodraw && removed) {
                    this.resetViewport();
                    this.redraw();
                    return true;
                }
            };


            /**
             * 设置clusterer的就绪状态。
             *
             * @param {boolean} ready The state.
             * @private
             */
            $.kmap.MarkerClusterer.prototype.setReady_ = function(ready) {
                if (!this.ready_) {
                    this.ready_ = ready;
                    this.createClusters_();
                }
            };


            /**
             * 返回聚类器中的聚类数。
             *
             * @return {number} The number of clusters.
             */
            $.kmap.MarkerClusterer.prototype.getTotalClusters = function() {
                return this.clusters_.length;
            };


            /**
             * 返回与群集器关联的Google地图。
             *
             * @return {google.maps.Map} The map.
             */
            $.kmap.MarkerClusterer.prototype.getMap = function() {
                return this.map_;
            };


            /**
             * 设置与群集器关联的Google地图。
             *
             * @param {google.maps.Map} map The map.
             */
            $.kmap.MarkerClusterer.prototype.setMap2 = function(map) {
                this.map_ = map;
            };


            /**
             * 返回网格的大小。
             *
             * @return {number} The grid size.
             */
            $.kmap.MarkerClusterer.prototype.getGridSize = function() {
                return this.gridSize_;
            };


            /**
             * 设置网格的大小。
             *
             * @param {number} size The grid size.
             */
            $.kmap.MarkerClusterer.prototype.setGridSize = function(size) {
                this.gridSize_ = size;
                console.log('size:' + size);
            };


            /**
             * 返回最小簇大小。
             *
             * @return {number} The grid size.
             */
            $.kmap.MarkerClusterer.prototype.getMinClusterSize = function() {
                return this.minClusterSize_;
            };

            /**
             * 设置最小簇大小。
             *
             * @param {number} size The grid size.
             */
            $.kmap.MarkerClusterer.prototype.setMinClusterSize = function(size) {
                this.minClusterSize_ = size;
            };

            /**
 
                * 对单个值进行边界处理。
            
                * @param {Number} i 要处理的数值
            
                * @param {Number} min 下边界值
            
                * @param {Number} max 上边界值
            
                *
            
                * @return {Number} 返回不越界的数值
            
                */

            $.kmap.MarkerClusterer.prototype.getRange = function(i, mix, max) {

                mix && (i = Math.max(i, mix));

                max && (i = Math.min(i, max));

                return i;

            };
            /**
 
                * 按照百度地图支持的世界范围对bounds进行边界处理
 
                * @param {BMap.Bounds} bounds BMap.Bounds的实例化对象
 
                *
 
                * @return {BMap.Bounds} 返回不越界的视图范围
 
                */

            $.kmap.MarkerClusterer.prototype.cutBoundsInRange = function(bounds) {

                var maxX = this.getRange(bounds.getNorthEast().lng, -180, 180);

                var minX = this.getRange(bounds.getSouthWest().lng, -180, 180);

                var maxY = this.getRange(bounds.getNorthEast().lat, -74, 74);

                var minY = this.getRange(bounds.getSouthWest().lat, -74, 74);

                return new BMap.Bounds(new BMap.Point(minX, minY), new BMap.Point(maxX, maxY));

            };
            /**
             * 按网格大小扩展边界对象。
             *
             * @param {google.maps.LatLngBounds} bounds 扩展的界限。
             * @return {google.maps.LatLngBounds} 扩展范围。
             */
            $.kmap.MarkerClusterer.prototype.getExtendedBounds = function(bounds) {
                switch ($.kmap.option.type) {
                    case 'baidu':
                        bounds = this.cutBoundsInRange(bounds);

                        var pixelNE = this.getMap().pointToPixel(bounds.getNorthEast());

                        var pixelSW = this.getMap().pointToPixel(bounds.getSouthWest());

                        pixelNE.x += this.gridSize_;

                        pixelNE.y -= this.gridSize_;

                        pixelSW.x -= this.gridSize_;

                        pixelSW.y += this.gridSize_;

                        var newNE = this.getMap().pixelToPoint(pixelNE);

                        var newSW = this.getMap().pixelToPoint(pixelSW);

                        bounds = new BMap.Bounds(newSW, newNE);
                        break;
                    case 'google':
                    case 'google_zh':
                        var projection = this.getProjection() == null ? $.kmap.overlay.getProjection() : this.getProjection();
                        //将边界转换为latlng。
                        var tr = new google.maps.LatLng(bounds.getNorthEast().lat(),
                            bounds.getNorthEast().lng());
                        var bl = new google.maps.LatLng(bounds.getSouthWest().lat(),
                            bounds.getSouthWest().lng());

                        //将点转换为像素，并按网格大小扩展。
                        var trPix = projection.fromLatLngToDivPixel(tr);
                        trPix.x += this.gridSize_;
                        trPix.y -= this.gridSize_;

                        var blPix = projection.fromLatLngToDivPixel(bl);
                        blPix.x -= this.gridSize_;
                        blPix.y += this.gridSize_;

                        //将像素点转换回LatLng
                        var ne = projection.fromDivPixelToLatLng(trPix);
                        var sw = projection.fromDivPixelToLatLng(blPix);

                        //扩展边界以包含新边界。
                        bounds.extend(ne);
                        bounds.extend(sw);
                        break;
                }
                return bounds;
            };


            /**
             * 确定标记是否包含在边界中。
             *
             * @param {google.maps.Marker} marker 要检查的标记。
             * @param {google.maps.LatLngBounds} bounds 要检查的界限。
             * @return {boolean} 如果标记位于边界内，则为True。
             * @private
             */
            $.kmap.MarkerClusterer.prototype.isMarkerInBounds_ = function(marker, bounds) {
                return bounds.contains(marker.getPosition());
            };


            /**
             * 清除群集器中的所有群集和标记。
             */
            $.kmap.MarkerClusterer.prototype.clearMarkers = function() {
                this.resetViewport(true);

                // 将标记设置为空数组。
                this.markers_ = [];
            };


            /**
             * 清除所有现有集群并重新创建它们。
             * @param {boolean} opt_hide 还要隐藏标记。
             */
            $.kmap.MarkerClusterer.prototype.resetViewport = function(opt_hide) {
                //删除所有群集
                for (var i = 0, cluster; cluster = this.clusters_[i]; i++) {
                    cluster.remove();
                }

                //将标记重置为不添加且不可见。
                for (var i = 0, marker; marker = this.markers_[i]; i++) {
                    marker.isAdded = false;
                    if (opt_hide) {
                        marker.setMap(null);
                    }
                }

                this.clusters_ = [];
            };

            /**
             *
             */
            $.kmap.MarkerClusterer.prototype.repaint = function() {
                var oldClusters = this.clusters_.slice();
                this.clusters_.length = 0;
                this.resetViewport();
                this.redraw();

                //删除旧群集。
                     //在超时时间执行此操作，以便首先绘制其他群集。
                window.setTimeout(function() {
                    for (var i = 0, cluster; cluster = oldClusters[i]; i++) {
                        cluster.remove();
                    }
                }, 0);
            };


            /**
             * 重绘群集。
             */
            $.kmap.MarkerClusterer.prototype.redraw = function() {
                this.createClusters_();
            };


            /**
             * 以km为单位计算两个latlng位置之间的距离。
             * @see http://www.movable-type.co.uk/scripts/latlong.html
             *
             * @param {google.maps.LatLng} p1 The first lat lng point.
             * @param {google.maps.LatLng} p2 The second lat lng point.
             * @return {number} 两点之间的距离以km为单位。
             * @private
             */
            $.kmap.MarkerClusterer.prototype.distanceBetweenPoints_ = function(p1, p2) {
                if (!p1 || !p2) {
                    return 0;
                }
                var d = 0;
                switch ($.kmap.option.type) {
                    case 'baidu':
                        d = $.kmap.distance(p1.lat, p1.lng, p2.lat, p2.lng, 0) / 1000;
                        break;
                    case 'google':
                    case 'google_zh':
                        d = $.kmap.distance(p1.lat(), p1.lng(), p2.lat(), p2.lng(), 0) / 1000;
                        break;
                }
                return d;
            };


            /**
             * 将标记添加到群集，或创建新群集。
             *
             * @param {google.maps.Marker} marker 要添加的标记。
             * @private
             */
            $.kmap.MarkerClusterer.prototype.addToClosestCluster_ = function(marker) {
                var distance = 40000; //有些人数众多
                var clusterToAddTo = null;
                var pos = marker.getPosition();
                for (var i = 0, cluster; cluster = this.clusters_[i]; i++) {
                    var center = cluster.getCenter();
                    if (center) {
                        var d = this.distanceBetweenPoints_(center, marker.getPosition());
                        if (d < distance) {
                            distance = d;
                            clusterToAddTo = cluster;
                        }
                    }
                }

                if (clusterToAddTo && clusterToAddTo.isMarkerInClusterBounds(marker)) {
                    clusterToAddTo.addMarker(marker);
                } else {
                    var cluster = new $.kmap.Cluster(this);
                    cluster.addMarker(marker);
                    this.clusters_.push(cluster);
                }
            };


            /**
             *创建群集。
             *
             * @private
             */
            $.kmap.MarkerClusterer.prototype.createClusters_ = function() {
                if (!this.ready_) {
                    return;
                }
                switch ($.kmap.option.type) {
                    case 'baidu':
                        var mapBounds = new BMap.Bounds(this.getMap().getBounds().getSouthWest(),
                            this.getMap().getBounds().getNorthEast());
                        var bounds = this.getExtendedBounds(mapBounds);
                        for (var i = 0, marker; marker = this.markers_[i]; i++) {
                            if (!marker.isAdded && bounds.containsPoint(marker.getPosition())) {
                                this.addToClosestCluster_(marker);
                            }
                        }
                        break;
                    case 'google':
                    case 'google_zh':
                        //获取我们当前的地图视图边界。
                             //创建一个新的边界对象，这样我们就不会影响地图。
                        var mapBounds = new google.maps.LatLngBounds(this.getMap().getBounds().getSouthWest(),
                            this.getMap().getBounds().getNorthEast());
                        var bounds = this.getExtendedBounds(mapBounds);

                        for (var i = 0, marker; marker = this.markers_[i]; i++) {
                            if (!marker.isAdded && this.isMarkerInBounds_(marker, bounds)) {
                                this.addToClosestCluster_(marker);
                            }
                        }
                        break;
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
            popup: false,
            clusterer: false,
            heat: false,
            zoom: 11
        },
        map: null,
        iframe: null,
        window_: null,
        init: function(option, key, type) {
            var _this = this;
            this.urls.put('baidu', 'http://api.map.baidu.com/getscript?v=2.0&ak={key}');
            this.urls.put('google', 'http://maps.google.com/maps/api/js?v=3&key={key}&libraries=places');
            this.urls.put('google_zh', 'http://ditu.google.cn/maps/api/js?v=3&key={key}&libraries=places');
            if (typeof option == "object") {
                //处理对象数据
                _this.option = option;
                _this.option.key = typeof key == "string" ? key : _this.option.key;
                _this.option.type = typeof type == "string" ? type : _this.option.type;
                _this.option.url = this.urlBt(option.key, this.urls.get(option.type));
                this.loadJs(_this)
            } else if (typeof option == "string") {
                //处理标签属性转换对象
                var mapobj = $("#" + option);
                _this.option = $["extend"](!![], {}, _this.option, mapobj['data']());
                _this.option.key = typeof key == "string" ? key : _this.option.key;
                _this.option.type = typeof type == "string" ? type : _this.option.type;
                _this.option.id = option;
                _this.option.url = this.urlBt(_this.option.key, this.urls.get(_this.option.type));
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
        initMap: function(option) {
            var map = null;
            //初始化地图
            if ("google_zh" == option.type || "google" == option.type) {
                var mapobj = google.maps;
                var googleOption = {
                    zoom: option.zoom,
                    scaleControl: true,
                    panControl: true,
                    center: new mapobj.LatLng(option.lat, option.lng),
                    mapTypeId: mapobj.MapTypeId.ROADMAP,
                    mapTypeControlOptions: { mapTypeIds: [mapobj.MapTypeId.ROADMAP, mapobj.MapTypeId.SATELLITE, 'OSM'] }
                }
                map = new mapobj.Map(document.getElementById(option.id), googleOption); // 创建Map实例
                $.kmap.overlay = new mapobj.OverlayView(); //谷歌自定义视图
                $.kmap.overlay.draw = function() {};
                $.kmap.overlay.setMap(map);
                console.log("已完谷歌地图初始化");
                //拓展 自定义覆盖物
                $.kmap.marker.prototype = new mapobj.OverlayView();

            }

            if ("baidu" == option.type) {
                //自定义覆盖物拓展 定义kui map标志物
                $.kmap.marker.prototype = new BMap.Overlay();
                // 百度地图API功能
                map = new BMap.Map(option.id); // 创建Map实例
                map.centerAndZoom(new BMap.Point(option.lng, option.lat), option.zoom); // 初始化地图,设置中心点坐标和地图级别
                map.enableScrollWheelZoom(true); //开启鼠标滚轮缩放
                console.log("已完百度地图初始化");
                $.kmap.marker.prototype.initialize = function(map) {
                    return $.kmap.marker.prototype.onAdd(this);
                };
                $.kmap.marker.prototype.setMap = function(nativeMap) {
                    if (nativeMap == null)
                        this.map_.removeOverlay(this);
                    else {
                        nativeMap.addOverlay(this);
                    }
                };
            }
            if (option.drawingModeMulti) { //是否开启几何图形自动清理
                $.kmap.drawingModeMulti = option.drawingModeMulti;
            }
            //添加自定义标志物层
            $.kmap.marker.prototype.onAdd = function(e) {
                var e = e != null ? e : this;
                var div = document.createElement("div");
                div.id = Math.random().toString().replace('.', '');
                div.className = "kmarker";
                div.style.borderStyle = "none";
                div.style.borderWidth = "0px";
                div.style.position = "absolute";
                div.style.cursor = "pointer";
                div.innerHTML = e.getMarker();
                e.div_ = div;
                e.appendChildMap(e, div);
                //创建信息弹窗
                if (e.text_) {
                    var popup = document.createElement("div");
                    popup.style.position = "absolute";
                    popup.style.minWidth = "150px";
                    if ($.kmap.option.popup) { //是否默认显示弹窗
                        popup.style.display = "black";
                    } else {
                        popup.style.display = "none";
                    }
                    var html = '<div class="panel">' +
                        '<div class="panel-heading">' +
                        '<h3 class="panel-title">' + e.title_ + '</h3>' +
                        '<div class="panel-actions">' +
                        '<a class="panel-action fa fa-close" data-toggle="panel-close" aria-hidden="true"></a>' +
                        '</div>' +
                        '</div>' +
                        '<div class="panel-body">' +
                        '<p>' + e.text_ + '</p>' +
                        '</div>' +
                        '</div>';
                    div.parentNode.append(popup);
                    popup.innerHTML = html;
                    e.popup_ = popup;
                    $(document).on("click", "[data-toggle=panel-close]", function() {
                        var panel = $(this)['closest'](".panel").parent();
                        $(panel).hide();
                    });

                } else if (e.html_) {
                    var popup = document.createElement("div");
                    popup.className = "kmarker-popup";
                    popup.style.position = "absolute";
                    popup.style.backgroundColor = "#fff";
                    popup.style.minWidth = "150px";
                    if ($.kmap.option.popup) { //是否默认显示弹窗
                        popup.style.display = "black";
                    } else {
                        popup.style.display = "none";
                    }
                    div.parentNode.append(popup);
                    popup.innerHTML = e.html_;
                    e.popup_ = popup;
                }
                return div;
            };
            //移动自定义标志物层
            $.kmap.marker.prototype.draw = function() {
                //var overlayProjection = this.getProjection();
                //var center = overlayProjection.fromLatLngToDivPixel(this.point_);
                // 利用projection获得当前视图的坐标
                var _this = this;
                var center = $.kmap.pointToPixel(this.point_);
                // 为简单，长宽是固定的，实际应该根据文字改变
                var div = this.div_,
                    marker_width = null,
                    popup = this.popup_; //marker 弹窗信息
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
                    marker_width = this.title_.length * 20 + width; //每个字20px 加上图标宽度
                    div.style.width = marker_width + "px";
                    //div.style.height = "10px";
                    div.onclick = function(e) {
                        console.log(div.id);
                        if (typeof _this.click_ == "function") {
                            _this.click_({ point: _this.point_, id: div.id });
                        }
                        if (popup) {
                            $(popup).show();
                            var center = $.kmap.pointToPixel(_this.point_);
                            var x = marker_width / 2;
                            this.offsetHeight_ = popup.offsetHeight == 0 ? this.offsetHeight_ : popup.offsetHeight;
                            var y = this.offsetHeight_ + 10;
                            popup.style.left = center.x + x + "px";
                            popup.style.top = center.y - y + "px";
                        }

                    };
                }
                if (null != popup) {
                    var x = marker_width / 2;
                    this.offsetHeight_ = popup.offsetHeight == 0 ? this.offsetHeight_ : popup.offsetHeight;
                    var y = this.offsetHeight_ + 10;
                    popup.style.left = center.x + x + "px";
                    popup.style.top = center.y - y + "px";
                }

            };
            //删除自定义标志物层
            $.kmap.marker.prototype.onRemove = function() {
                if (this.div_ && this.div_.parentNode) {
                    if (this.popup_) {
                        this.div_.parentNode.removeChild(this.popup_);
                        this.popup_ = null;
                    }
                    this.div_.parentNode.removeChild(this.div_);
                    this.div_ = null;

                }
            };
            $.kmap.marker.prototype.hide = function() {
                if (this.div_) {
                    this.div_.style.visibility = "hidden";
                }
            };
            $.kmap.marker.prototype.show = function() {
                if (this.div_) {
                    this.div_.style.visibility = "visible";
                }
            };
            $.kmap.marker.prototype.update = function(obj) {
                if ((typeof obj.position) != "undefined") {
                    this.setPosition(obj.position);
                }
                if ((typeof obj.icon) != "undefined") {
                    this.setIcon(obj.icon);
                }
                if ((typeof obj.title) != "undefined") {
                    this.setTitle(obj.title);
                }
            };

            $.kmap.marker.prototype.setPosition = function(position) {
                if (this.point_ != position) {
                    this.point_ = position;
                    if (this.div_) {
                        //var center = this.getProjection().fromLatLngToDivPixel(position);
                        var center = $.kmap.pointToPixel(position);
                        if (this.icon_ != null) {
                            this.div_.style.left = center.x - 10 + "px";
                        } else {
                            this.div_.style.left = center.x + 28 + "px";
                        }
                        this.div_.style.top = center.y - 7 + "px";
                        /*  this.div_.style.left = center.x + 16 + "px";
                         this.div_.style.top = center.y - 8 + "px"; */
                    }
                    if (this.popup_) {
                        //var center = this.getProjection().fromLatLngToDivPixel(position);
                        var center = $.kmap.pointToPixel(position);
                        var marker_width = this.div_.offsetWidth;
                        this.offsetHeight_ = this.popup_.offsetHeight == 0 ? this.offsetHeight_ : this.popup_.offsetHeight;
                        var x = marker_width / 2;
                        var y = this.offsetHeight_ + 10;
                        this.popup_.style.left = center.x + x + "px";
                        this.popup_.style.top = center.y - y + "px";
                    }
                }
            };
            $.kmap.marker.prototype.getPosition = function() {
                return this.point_;
            };
            $.kmap.marker.prototype.setIcon = function(obj) {
                if (null == this.icon_) {
                    this.icon_ = obj;
                } else {
                    if (this.icon_.url != obj.url) {
                        this.icon_ = obj;
                    }
                }
                this.flash();
            };

            $.kmap.marker.prototype.setClick = function(cb) {
                if (typeof cb == "function") {
                    this.click_ = cb;
                }
            };

            $.kmap.marker.prototype.getText = function() {
                return this.text_;
            };

            $.kmap.marker.prototype.setText = function(text) {
                if (text != this.text_) {
                    this.text_ = text;
                    if (this.popup_) {
                        var html = '<div class="panel">' +
                            '<div class="panel-heading">' +
                            '<h3 class="panel-title">' + this.title_ + '</h3>' +
                            '<div class="panel-actions">' +
                            '<a class="panel-action fa fa-close" data-toggle="panel-close" aria-hidden="true"></a>' +
                            '</div>' +
                            '</div>' +
                            '<div class="panel-body">' +
                            '<p>' + this.text_ + '</p>' +
                            '</div>' +
                            '</div>';
                        this.popup_.innerHTML = html;
                    }
                }
            };

            $.kmap.marker.prototype.getHtml = function() {
                return this.html_;
            }

            $.kmap.marker.prototype.setHtml = function(html) {
                if (this.html_ != html) {
                    this.html_ = html;
                    if (this.popup_) {
                        this.popup_.innerHTML = this.html_;
                    }
                }
            };

            $.kmap.marker.prototype.setTitle = function(title) {
                if (this.title_ != title) {
                    this.title_ = title;
                    this.flash();
                }
            };

            $.kmap.marker.prototype.getMap = function() {
                return this.map_;
            };

            $.kmap.marker.prototype.getMarker = function() {
                if (this.icon_ != null) {
                    if (!this.icon_.width) {
                        this.icon_.width = '32';
                    }
                    if (!this.icon_.height) {
                        this.icon_.height = '32';
                    }
                    return "<img style='width:" + this.icon_.width + "px;height:" + this.icon_.height + "px;' src='" + this.icon_.url + "'/><span>" + this.title_ + "</span>";
                } else {
                    return "<span >" + this.title_ + "</span>";
                }
            };

            $.kmap.marker.prototype.flash = function() {
                if (this.div_) {
                    this.div_.innerHTML = this.getMarker(); //初始化标志物对象end
                }
            };
            $.kmap.marker.prototype.appendChildMap = function(e, div) { //将marker层输出至地图窗格上
                switch ($.kmap.option.type) {
                    case 'baidu':
                        var panes = e.map_.getPanes();
                        panes.floatShadow.appendChild(div);
                        break;
                    case 'google':
                    case 'google_zh':
                        var panes = e.getPanes();
                        panes.overlayImage.appendChild(div);
                        break;
                }
            };
            //拓展map对象方法拓展map对象方法
            map.getContainer = function() {
                return document.getElementById($.kmap.option.id);
            };
            $.kmap.overlayDiv._map = null;
            $.kmap.overlayDiv._maskElement = null;
            $.kmap.overlayDiv.getDom(map).addEventListener("mousedown", $.kmap.mapMouseDown); //自定义图层事件
            $.kmap.overlayDiv.getDom(map).addEventListener("mousemove", $.kmap.mapMouseMove);
            $.kmap.overlayDiv.getDom(map).addEventListener("dblclick", $.kmap.mapDblClick);

            return map;
        },
        loadJs: function(e) { //加载地图文件
            //清理已加载地图对象 &libraries=visualization
            window.google = window.BMap = null;
            $.kmap.empty(); //清空标志物
            $.kmap.markerListClusterer = null; //重置聚合
            if ("google_zh" == e.option.type || "google" == e.option.type) {
                if (e.option.heat) { //加载热力图支持库
                    e.option.url = e.option.url + '&libraries=visualization';
                    console.log("google地图开启热力图支持库");
                }

                $.getScript(e.option.url, function() {
                    console.log("已完成google地图js文件加载");
                    e.map = e.initMap(e.option);
                    if (e.option.clusterer) { //加载聚合支持库
                        e.initMc();
                    }
                    e.resize();
                });
            }
            if ('baidu' == e.option.type) {
                $.getScript(e.option.url, function() {
                    console.log("已完成百度地图js文件加载");
                    window.BMap_loadScriptTime = (new Date).getTime();
                    /* if (e.option.clusterer) { //加载聚合支持库
                        $.getScript('http://api.map.baidu.com/library/TextIconOverlay/1.2/src/TextIconOverlay_min.js');
                        $.getScript('http://api.map.baidu.com/library/MarkerClusterer/1.2/src/MarkerClusterer_min.js');
                        console.log("百度地图热开启聚合支持库");
                    } */
                    if (e.option.heat) { //加载热力图支持库
                        $.getScript('http://api.map.baidu.com/library/Heatmap/2.0/src/Heatmap_min.js', function() {
                            console.log("百度地图热开启热力图支持库");
                        });
                    }

                    e.map = e.initMap(e.option);

                    if (e.option.clusterer) { //加载聚合支持库
                        e.initMc();
                    }
                    e.resize();
                });
            }

        },
        resize: function() { //重置页面
            $("#" + $.kmap.option.id).css("width", $.kmap.option.width);
            $("#" + $.kmap.option.id).css("height", $.kmap.option.height);
            $("#" + $.kmap.option.id).css("margin", "0");
            $("#" + $.kmap.option.id).css("overflow", "hidden");
        },
        isSupportCanvas: function() {
            var elem = document.createElement('canvas');
            return !!(elem.getContext && elem.getContext('2d'));
        },
        //自定义覆盖物-标志
        marker: function(opts) {
            this.overlay = this;
            // 初始化参数：坐标、文字、地图
            if ((typeof opts.icon) != "undefined") {
                this.icon_ = opts.icon;
            } else {
                this.icon_ = null;
            }
            this.point_ = opts.position;
            this.title_ = opts.title || ""; //标志标题
            this.popup_ = opts.popup || null; //弹窗层对象
            this.text_ = opts.text || null; //标志内容
            this.html_ = opts.html || null; //标志html代码
            this.offsetHeight_ = null; //弹窗高度
            this.click_ = opts.click || null; //点击事件
            this.map_ = opts.map;
            // 到onAdd时才需要创建div
            this.div_ = null;
            // 加入map
            this.setMap(this.map_);
        },
        markerList: new Hashtable(), //地图上的标记信息
        markerListClusterer: null, //聚合图层
        heatOverlay: null, //热力图图层
        findMarkerById: function(id) { //根据id查询数组中的点
            return $.kmap.markerList.get(id);
        },
        insertMarker: function(option) { //将点保存至数组
            if (!option.id) {
                throw new Error('insertMarker err :marker id not null');
            }
            if (!option.lng) {
                throw new Error('insertMarker err :marker lng not null');
            }
            if (!option.lat) {
                throw new Error('insertMarker err :marker lat not null');
            }


            var type = $.kmap.option.type,
                position = $.kmap.getPoint(option),
                marker = $.kmap.findMarkerById(option.id);
            if (marker != null) {
                throw new Error('insertMarker err : existing marker id:' + option.id);
            }
            option.position = position;
            option.map = $.kmap.map;
            marker = new $.kmap.marker(option);

            $.kmap.markerList.put(option.id, marker);

            if (option.zoom) {
                $.kmap.toMarker(option.id, option.zoom);
            }


            if ($.kmap.option.clusterer) { //开启聚合
                if ($.kmap.markerListClusterer == null) {
                    $.kmap.markerListClusterer = new $.kmap.MarkerClusterer($.kmap.map, $.kmap.markerList.values(), { imagePath: 'images/kmap/m' });
                } else {
                    $.kmap.markerListClusterer.addMarkers($.kmap.markerList.values(), false);
                }
            }

        },
        updateMarker: function(option) { //更新标志信息
            if (!option.id) {
                throw new Error('updateMarker err :marker id not null');
            }
            if (!option.lng) {
                throw new Error('insertMarker err :marker lng not null');
            }
            if (!option.lat) {
                throw new Error('insertMarker err :marker lat not null');
            }
            var point = null,
                marker = $.kmap.findMarkerById(option.id);
            if (marker == null) {
                throw new Error('updateMarker err : marker not null id:' + option.id);
            }
            point = $.kmap.getPoint(option);
            if (option.icon) {
                marker.setIcon(option.icon);
            }
            if (option.title) {
                marker.setTitle(option.title);
            }
            if (option.text) {
                marker.setText(option.text);
            }
            if (option.html) {
                marker.setHtml(option.html);
            }
            marker.setPosition(point);
            if (option.zoom) {
                $.kmap.toMarker(option.id, option.zoom);
            }
            if ($.kmap.option.clusterer) { //开启聚合
                $.kmap.markerListClusterer.updateMarkers($.kmap.markerList.values(), false);

            }
        },
        toMarker: function(id, zoom) { //定位标志
            var type = $.kmap.option.type,
                marker = $.kmap.findMarkerById(id);
            if (marker == null) {
                throw new Error('updateMarker err : marker not null id:' + id);
            }
            if (type == "baidu") {
                $.kmap.map.centerAndZoom(marker.getPosition(), zoom);
            }
            if (type == "google_zh" || type == "google") {
                $.kmap.map.setZoom(zoom);
                $.kmap.map.panTo(marker.getPosition());

            }
        },
        toPoint: function(point, zoom) { //定位 根据经纬度
            var type = $.kmap.option.type;
            if (point == null) {
                throw new Error('updateMarker err : point not null ');
            }
            if (type == "baidu") {
                $.kmap.map.panTo(point, { noAnimation: false });
                if (zoom) {
                    $.kmap.map.setZoom(zoom);
                }

            }
            if (type == "google_zh" || type == "google") {
                if (zoom) {
                    $.kmap.map.setZoom(zoom);
                }
                $.kmap.map.panTo(point);

            }
        },
        romoveById: function(id) { //删除指定标志物
            var marker = $.kmap.findMarkerById(id);
            if (marker == null) {
                throw new Error('updateMarker err : marker not null id:' + id);
            } else {
                marker.onRemove();
                $.kmap.markerList.remove(id);
            }
        },
        empty: function() { //清空所有标志物
            $.kmap.markerList.each(function(key, marker) {
                marker.onRemove();
            });
            $.kmap.markerList.clear();
        },
        closeHeat: function(isEmpty) {
            switch ($.kmap.option.type) {
                case 'baidu':
                    if (isEmpty) {
                        $.kmap.removeOverlay($.kmap.heatOverlay);
                        $.kmap.heatOverlay = null;
                    } else {
                        $.kmap.heatOverlay.hide();
                    }

                    break;
                case 'google':
                case 'google_zh':
                    if (isEmpty) {
                        $.kmap.removeOverlay($.kmap.heatOverlay);
                        $.kmap.heatOverlay = null;
                    } else {
                        $.kmap.heatOverlay.setMap($.kmap.heatOverlay.getMap() ? null : $.kmap.map);
                    }
                    break;
            }
        },
        openHeat: function() {
            //开启热力图
            if ($.kmap.option.heat) {
                if ($.kmap.isSupportCanvas()) {
                    switch ($.kmap.option.type) {
                        case 'baidu':
                            if (null == $.kmap.heatOverlay) {
                                //开启热力图
                                $.kmap.heatOverlay = new BMapLib.HeatmapOverlay({ "radius": 20 });
                                $.kmap.map.addOverlay($.kmap.heatOverlay);
                                var options = [];
                                $.kmap.markerList.each(function(key, marker) {
                                    var option = marker.getPosition();
                                    //option.count = parseInt(Math.random() * 100);
                                    options.push(option);

                                });
                                $.kmap.heatOverlay.setDataSet({ data: options });
                            }
                            $.kmap.heatOverlay.show();
                            break;
                        case 'google':
                        case 'google_zh':
                            if (null == $.kmap.heatOverlay) {
                                var options = [];
                                $.kmap.markerList.each(function(key, marker) {
                                    var option = marker.getPosition();
                                    //option.count = parseInt(Math.random() * 100);
                                    options.push(option);

                                });
                                $.kmap.heatOverlay = new google.maps.visualization.HeatmapLayer({
                                    data: options,
                                    map: $.kmap.map
                                });
                            } else {
                                $.kmap.heatOverlay.setMap($.kmap.heatOverlay.getMap() ? null : $.kmap.map);
                            }

                            break;
                    }
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
        drawingModeMulti: false, //是否自动关闭图层
        drawingModeKey: null, //地图上的几何图形 不关闭图层时，保存多个图层信息id
        drawingModeMap: new Hashtable(), //地图上的几何图形 不关闭图层时，保存多个图层信息

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
            if ($.kmap.addMarkerType == 0) { //标志移动时
                var date = new Date();
                $.kmap.mouseMoveTime = date.getTime();

                if ($.kmap.markerList.size() <= 100) {
                    var latlng = event.point;
                    var markpoint = $.kmap.map.pointToOverlayPixel(latlng); //overlay.getProjection().fromLatLngToDivPixel(latlng);
                    var strHtml = "",
                        num = 0; //个数
                    $.kmap.markerList.each(function makeShow(id, marker) {
                        try {
                            if (num <= 10) {
                                if (marker.show && marker.movetip) {
                                    var point = $.kmap.map.pointToOverlayPixel(marker.getPosition());
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

                    /*  if (num > 0) {
                         $('#tip').css({ "left": mousePos.x + "px", "top": mousePos.y + "px" });
                         $('#tip').html(num > 10 ? strHtml + "......." : strHtml);
                     } else {
                         $('#tip').hide();
                     } */
                }
            }
            if ($.kmap.addMarkerType == 1) { //画线 移动时
                $.kmap.movePolyline(event);
            }
            if ($.kmap.addMarkerType == 2) { //矩形 移动时
                $.kmap.moveRectangle(event);
            }
            if ($.kmap.addMarkerType == 3) { //多边形 移动时
                $.kmap.movePolygon(event);
                //$('#tip').css({ "left": (event.pixel.x + 20) + "px", "top": (event.pixel.y - 40) + "px" });
            }
            if ($.kmap.addMarkerType == 4) { //圆形 移动时
                $.kmap.moveCircle(event);
            }
        },
        //响应鼠标点击操作
        mapMouseDown: function(event) {
            //console.log($.kmap.addMarkerType);
            if ($.kmap.addMarkerType == 0) { //标志移动时
                var nowTime = isTimeout($.kmap.lastClickTime, 200);
                if (nowTime == null) {
                    return;
                }
                $.kmap.lastClickTime = nowTime;

            }
            if ($.kmap.addMarkerType == 1) { //画线 移动时
                $.kmap.addPolyline(event);
            }
            if ($.kmap.addMarkerType == 2) { //矩形 移动时
                $.kmap.addRectangle(event);
            }
            if ($.kmap.addMarkerType == 3) { //多边形 移动时

                $.kmap.addPolygon(event);
            }
            if ($.kmap.addMarkerType == 4) { //圆形 移动时
                $.kmap.addCircle(event);
            }

        },
        mapDblClick: function(event) { //鼠标双击操作 退出绘图模式
            //console.log($.kmap.addMarkerType);
            if ($.kmap.addMarkerType == 0) { //标志移动时

            }
            if ($.kmap.addMarkerType == 1) { //画线 
                if ($.kmap.markerPolyPoint.length >= 2) {
                    var temp = $.kmap.getLatLngString($.kmap.distinct($.kmap.markerPolyPoint));
                    $.kmap.drawingModeResult = temp;
                }
                if (null != $.kmap.markerPolyline) {
                    if ($.kmap.drawingModeMulti) {
                        $.kmap.removeOverlay($.kmap.markerPolyline);
                    } else {
                        if ($.kmap.drawingModeKey) {
                            $.kmap.drawingModeMap.put($.kmap.drawingModeKey, $.kmap.markerPolyline);
                        }
                    }
                    $.kmap.markerPolyline = null;
                    $.kmap.markerPolyPoint = [];
                    $.kmap.markerPolyPointBaidu = null;

                }
            }
            if ($.kmap.addMarkerType == 2) { //矩形 

                if (null != $.kmap.markerRectBounds) {
                    var temp = "";
                    switch ($.kmap.option.type) {
                        case 'baidu':
                            temp = $.kmap.getLatLngString($.kmap.markerRectBounds);
                            break;
                        case 'google':
                        case 'google_zh':
                            var latlngList = new Array();
                            latlngList.push($.kmap.markerRectBounds.getSouthWest());
                            latlngList.push($.kmap.markerRectBounds.getNorthEast());
                            temp = $.kmap.getLatLngString(latlngList);
                            break;
                    }
                    $.kmap.drawingModeResult = temp;
                }
                if (null != $.kmap.markerRectangle) {
                    if ($.kmap.drawingModeMulti) {
                        $.kmap.removeOverlay($.kmap.markerRectangle);
                    } else {
                        if ($.kmap.drawingModeKey) {
                            $.kmap.drawingModeMap.put($.kmap.drawingModeKey, $.kmap.markerRectangle);
                        }
                    }
                    $.kmap.markerRectangle = null;
                    $.kmap.markerRectStart = null;
                    $.kmap.markerRectBounds = null;
                }
            }
            if ($.kmap.addMarkerType == 3) { //多边形 
                if ($.kmap.markerPolyPoint.length > 2) {
                    //console.log($.kmap.distinct($.kmap.markerPolyPoint));
                    var temp = $.kmap.getLatLngString($.kmap.distinct($.kmap.markerPolyPoint));
                    $.kmap.drawingModeResult = temp;
                }
                //绘制结束，删除事件 清理对象
                if (null != $.kmap.markerPolygon) {
                    if ($.kmap.drawingModeMulti) {
                        $.kmap.removeOverlay($.kmap.markerPolygon);
                    } else {
                        if ($.kmap.drawingModeKey) {
                            $.kmap.drawingModeMap.put($.kmap.drawingModeKey, $.kmap.markerPolygon);
                        }
                    }
                    $.kmap.markerPolygon = null;
                    $.kmap.markerPolyPoint = [];
                    $.kmap.markerPolyPointBaidu = null;
                }
            }
            if ($.kmap.addMarkerType == 4) { //圆形 
                if ($.kmap.markerCenterPoint && $.kmap.markerRadius) {
                    var temp = $.kmap.getLatLngString([$.kmap.markerCenterPoint]);
                    temp.radius = $.kmap.markerRadius;
                    $.kmap.drawingModeResult = temp;
                }
                if (null != $.kmap.markerCircle) {
                    if ($.kmap.drawingModeMulti) {
                        $.kmap.removeOverlay($.kmap.markerCircle);
                    } else {
                        if ($.kmap.drawingModeKey) {
                            $.kmap.drawingModeMap.put($.kmap.drawingModeKey, $.kmap.markerCircle);
                        }
                    }
                    $.kmap.markerCircle = null;
                    $.kmap.markerCenterPoint = null;
                }
            }
            $.kmap.drawingMode = false; //关闭绘图模式 
            $.kmap.addMarkerType = null;
            $.kmap.overlayDiv.hide();
            //$('#tip').hide();
            $.kmap.setMapOptions({ doubleClickZoom: true, dragging: true }); //禁止地图双击放大和拖拽
        },
        getLatLngBounds: function(start, end) { //根据起点终点绘制矩形
            var type = $.kmap.option.type;
            if ('baidu' == type) {
                $.kmap.markerRectBounds = [new BMap.Point(start.lng, start.lat),
                    new BMap.Point(end.lng, start.lat),
                    new BMap.Point(end.lng, end.lat),
                    new BMap.Point(start.lng, end.lat)
                ];
            }
            if (type == "google_zh" || type == "google") {
                var startPt_ = $.kmap.pointToPixel(start);
                var endPt_ = $.kmap.pointToPixel(end);
                var left = Math.min(startPt_.x, endPt_.x);
                var top = Math.min(startPt_.y, endPt_.y);
                var width = Math.abs(startPt_.x - endPt_.x);
                var height = Math.abs(startPt_.y - endPt_.y);
                var sw = $.kmap.pixelToPoint(new google.maps.Point(left, top + height));
                var ne = $.kmap.pixelToPoint(new google.maps.Point(left + width, top));
                $.kmap.markerRectBounds = new google.maps.LatLngBounds(sw, ne);
            }
            return $.kmap.markerRectBounds;
        },
        /**
         * points 入参必须是数组
         */
        getLatLngString: function(points) { //把经纬度转换成用逗号隔开的字符串
            var lat = new Array();
            var lng = new Array();
            switch ($.kmap.option.type) {
                case 'baidu':
                    for (var i = 0; i < points.length; i += 1) {
                        lat.push(points[i].lat.toFixed(6));
                        lng.push(points[i].lng.toFixed(6));
                    }
                    break;
                case 'google':
                case 'google_zh':
                    for (var i = 0; i < points.length; i += 1) {
                        lat.push(points[i].lat().toFixed(6));
                        lng.push(points[i].lng().toFixed(6));
                    }
                    break;
            }
            return { lat: lat.toString(), lng: lng.toString() };
        },
        distance: function(lat1, lon1, lat2, lon2, len) { //获取地图上俩个点之间的距离
            var R = 6371 * 1000; // 单位是m (change this constant to get miles)
            var dLat = (lat2 - lat1) * Math.PI / 180;
            var dLon = (lon2 - lon1) * Math.PI / 180;
            var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            var d = R * c;
            return d + len;
        },
        // 坐标转像素点
        latLng2Pixel: function(latLng) {
            var scale = Math.pow(2, $.kmap.map.zoom);
            var proj = $.kmap.map.getProjection();
            var bounds = $.kmap.map.getBounds();
            var nw = proj.fromLatLngToPoint(new google.maps.LatLng(bounds.getNorthEast().lat(), bounds.getSouthWest().lng()));
            var point = proj.fromLatLngToPoint(latLng);

            return new google.maps.Point(Math.floor((point.x - nw.x) * scale), Math.floor((point.y - nw.y) * scale));
        },
        pixel2LatLng: function(pixel) {
            switch ($.kmap.option.type) {
                case 'baidu':
                    var m = pixel.layerX || pixel.offsetX || 0;
                    var q = pixel.layerY || pixel.offsetY || 0;
                    var o = pixel.target || pixel.srcElement;
                    if (o != $.kmap.overlayDiv.getDom(this._map)) {
                        while (o && o != this._map.getContainer()) {
                            if (!(o.clientWidth == 0 && o.clientHeight == 0 && o.offsetParent && o.offsetParent.nodeName.toLowerCase() == "td")) {
                                m += o.offsetLeft;
                                q += o.offsetTop
                            }
                            o = o.offsetParent
                        }
                    }
                    if (o != $.kmap.overlayDiv.getDom(this._map) && o != this._map.getContainer()) {
                        return
                    }
                    if (typeof m === "undefined" || typeof q === "undefined") {
                        return
                    }
                    if (isNaN(m) || isNaN(q)) {
                        return
                    }
                    return $.kmap.pixelToPoint({ x: m, y: q });
                case 'google':
                case 'google_zh':
                    var scale = Math.pow(2, $.kmap.map.zoom);
                    var proj = $.kmap.map.getProjection();
                    var bounds = $.kmap.map.getBounds();
                    var nw = proj.fromLatLngToPoint(new google.maps.LatLng(bounds.getNorthEast().lat(), bounds.getSouthWest().lng()));
                    var point = new google.maps.Point();
                    point.x = pixel.layerX / scale + nw.x;
                    point.y = pixel.layerY / scale + nw.y;
                    return proj.fromPointToLatLng(point);

            }

        },
        pixelToPoint: function(pixel) { //根据覆盖物容器的坐标获取对应的地理坐标
            if (!pixel) {
                return;
            }
            var point = null;
            switch ($.kmap.option.type) {
                case 'baidu':
                    point = $.kmap.map.overlayPixelToPoint(pixel);
                    //var temp = $.kmap.map.pixelToPoint(pixel);
                    //console.log('pixelToPoint:' + temp.lng + ',' + temp.lat);
                    //console.log('overlayPixelToPoint:' + point.lng + ',' + point.lat);
                    break;
                case 'google':
                case 'google_zh':
                    point = $.kmap.overlay.getProjection().fromDivPixelToLatLng(pixel);
                    break;

            }
            return point;
        },
        pointToPixel: function(point) { //根据地理坐标获取对应的覆盖物容器的坐标，此方法用于自定义覆盖物
            if (!point) {
                return;
            }
            var pixel = null;
            switch ($.kmap.option.type) {
                case 'baidu':
                    pixel = $.kmap.map.pointToOverlayPixel(point);
                    break;
                case 'google':
                case 'google_zh':
                    if (typeof point.lat == "function") {
                        pixel = $.kmap.overlay.getProjection().fromLatLngToDivPixel(point);
                    } else {
                        pixel = $.kmap.overlay.getProjection().fromLatLngToDivPixel(new google.maps.LatLng(point.lat, point.lng));
                    }
                    break;

            }
            return pixel;
        },
        getPoint: function(point) {
            //根据地图类型返回对应的经纬度
            var point_ = null;
            switch ($.kmap.option.type) {
                case 'baidu':
                    point_ = point == null ? null : new BMap.Point(point.lng, point.lat);
                    break;
                case 'google':
                case 'google_zh':
                    point_ = point == null ? null : new google.maps.LatLng(point.lat, point.lng);
                    break;

            }
            return point_;
        },
        distinct: function(arr) { //多坐标去重
            switch ($.kmap.option.type) {
                case 'baidu':
                    var res = [];
                    var json = {};
                    for (var i = 0; i < arr.length; i++) {　　　　
                        if (!json[arr[i].lng.toString()]) {　　　　　　
                            res.push(arr[i]);
                            json[arr[i].lng.toString()] = 1;　　　　
                        }　　
                    }
                    break;
                case 'google':
                case 'google_zh':
                    var res = [];
                    var json = {};
                    for (var i = 0; i < arr.length; i++) {　　　　
                        if (!json[arr[i].lng().toString()]) {　　　　　　
                            res.push(arr[i]);
                            json[arr[i].lng().toString()] = 1;　　　　
                        }　　
                    }
                    break;
            }

            return res;
        },
        removeOverlay: function(overlay) {
            if (overlay) {
                switch ($.kmap.option.type) {
                    case 'baidu':
                        $.kmap.map.removeOverlay(overlay);
                        break;
                    case 'google':
                    case 'google_zh':
                        overlay.setMap(null);
                        break;
                }
            }

        },
        setMapOptions: function(options) { //修改地图属性
            switch ($.kmap.option.type) {
                case 'baidu':
                    if (options && options.doubleClickZoom)
                        $.kmap.map.enableDoubleClickZoom(); //启用地图双击放大
                    else
                        $.kmap.map.disableDoubleClickZoom();

                    if (options && options.dragging)
                        $.kmap.map.enableDragging(); //启用地图拖拽
                    else
                        $.kmap.map.disableDragging(); //禁止地图拖拽
                    break;
                case 'google':
                case 'google_zh':
                    var googleOptions = {};
                    if (options && null != options.doubleClickZoom)
                        googleOptions.disableDoubleClickZoom = options.doubleClickZoom; //true启用地图双击放大 

                    if (options && null != options.dragging)
                        googleOptions.draggable = options.dragging; //true启用地图拖拽

                    $.kmap.map.setOptions(googleOptions);
                    break;

            }
        },
        openDrawingMode: function(drawingType, callback, option) { //打开绘图模式
            if (!$.kmap.drawingMode) {
                $.kmap.drawingMode = true; //开启绘图模式
                $.kmap.overlayDiv.show($.kmap.map);
                $.kmap.overlayDiv.setCursor("crosshair");
                $.kmap.setMapOptions({ doubleClickZoom: false, dragging: false }); //禁止地图双击放大和拖拽
                $.kmap.addMarkerType = drawingType;
                if (option) { //如果存在自定义图像样式，否则默认
                    $.kmap.drawingModeOptions = $["extend"](!![], {}, option, $.kmap.drawingModeOptions);
                } else {
                    $.kmap.drawingModeOptions = $.kmap.drawingModeOptions == null ? { //绘图初始化
                        fillColor: "#FF0000", // 填充色
                        fillOpacity: 0.3, // 填充色透明度
                        strokeColor: "#FF0000", // 线条颜色 黑色
                        strokeOpacity: 0.8, // 透明度 70%
                        strokeStyle: "solid",
                        strokeWeight: 1 // 宽度 5像素
                    } : $.kmap.drawingModeOptions;
                }
                if ($.kmap.drawingModeOptions.drawingModeKey) {
                    $.kmap.drawingModeKey = $.kmap.drawingModeOptions.drawingModeKey;
                }
                //添加鼠标提示工具
                //var tipDiv = "<div id=\"tip\" class=\"tooltip right\" style=\"position: absolute; z-index: 10; \" role=\"tooltip\">" +
                //   "<div class=\"tooltip-arrow\"></div>" +
                //    "<div class=\"tooltip-inner\"></div></div>";
                // $("#" + $.kmap.option.id).append(tipDiv);
                //通过计时器 结束绘图时调用回调
                var cb = setInterval(function() {
                    if (!$.kmap.drawingMode) { //绘图结束
                        clearInterval(cb);
                        callback($.kmap.drawingModeResult);

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
            if (q && $.kmap.overlayDiv.getDom($.kmap.map).setCapture) {
                $.kmap.overlayDiv.getDom(p).setCapture(); //将鼠标事件锁定在指定的元素上
            }
            //e.point = $.kmap.overlayDiv.getDrawPoint(e, true);
            e.point = $.kmap.pixel2LatLng(e);
            $.kmap.markerPolyPoint.push(e.point);
            $.kmap.markerPolyPointBaidu = $.kmap.markerPolyPoint.concat($.kmap.markerPolyPoint[$.kmap.markerPolyPoint.length - 1]);
            if ($.kmap.markerPolyline == null) {
                switch ($.kmap.option.type) {
                    case 'baidu':
                        //添加多边形
                        $.kmap.markerPolyline = new BMap.Polyline($.kmap.markerPolyPointBaidu, $.kmap.drawingModeOptions);
                        $.kmap.map.addOverlay($.kmap.markerPolyline);
                        break;
                    case 'google':
                    case 'google_zh':
                        $.kmap.markerPolyline = new google.maps.Polyline($.kmap.drawingModeOptions);
                        $.kmap.markerPolyline.setMap($.kmap.map);
                        break;
                }
            } else {
                switch ($.kmap.option.type) {
                    case 'baidu':
                        $.kmap.markerPolyline.setPath($.kmap.markerPolyPointBaidu);
                        break;
                    case 'google':
                    case 'google_zh':
                        $.kmap.markerPolyline.setPath($.kmap.markerPolyPoint);
                        break;
                }

            }
        },
        addRectangle: function(e) { //添加矩形
            var q = /msie (\d+\.\d)/i.test(navigator.userAgent); //判断是否ie
            e = window.event || e;
            if (e.button != 1 && q || e.button != 0 && !q || e.controlButton == "right") {
                return;
            }
            if (q && $.kmap.overlayDiv.getDom($.kmap.map).setCapture) {
                $.kmap.overlayDiv.getDom(p).setCapture(); //将鼠标事件锁定在指定的元素上
            }
            if (null == $.kmap.markerRectangle) {
                $.kmap.markerRectStart = $.kmap.pixel2LatLng(e); // $.kmap.overlayDiv.getDrawPoint(e, true);
                //根据起点终点获取矩形四个顶点
                var endPoint = $.kmap.markerRectStart;
                switch ($.kmap.option.type) {
                    case 'baidu':
                        //添加矩形
                        $.kmap.markerRectangle = new BMap.Polygon($.kmap.getLatLngBounds($.kmap.markerRectStart, endPoint), $.kmap.drawingModeOptions);
                        $.kmap.map.addOverlay($.kmap.markerRectangle);
                        break;
                    case 'google':
                    case 'google_zh':
                        //添加矩形
                        $.kmap.drawingModeOptions.map = $.kmap.map;
                        $.kmap.drawingModeOptions.clickable = false;
                        $.kmap.markerRectangle = new google.maps.Rectangle($.kmap.drawingModeOptions);
                        //$.kmap.markerRectangle.setBounds($.kmap.getLatLngBounds($.kmap.markerRectStart, endPoint));
                        //$.kmap.markerRectangle.setMap($.kmap.map);
                        break;
                }
            }

        },
        addPolygon: function(e) { //添加多边形
            var q = /msie (\d+\.\d)/i.test(navigator.userAgent); //判断是否ie
            e = window.event || e;
            if (e.button != 1 && q || e.button != 0 && !q) {
                return;
            }
            if (q && $.kmap.overlayDiv.getDom($.kmap.map).setCapture) {
                $.kmap.overlayDiv.getDom(p).setCapture(); //将鼠标事件锁定在指定的元素上
            }
            //e.point = $.kmap.overlayDiv.getDrawPoint(e, true);
            e.point = $.kmap.pixel2LatLng(e);
            //console.log(e.point);
            $.kmap.markerPolyPoint.push(e.point);
            switch ($.kmap.option.type) {
                case 'baidu':
                    $.kmap.markerPolyPointBaidu = $.kmap.markerPolyPoint.concat($.kmap.markerPolyPoint[$.kmap.markerPolyPoint.length - 1]);
                    if ($.kmap.markerPolygon == null) {
                        //添加多边形
                        $.kmap.markerPolygon = new BMap.Polygon($.kmap.markerPolyPointBaidu, $.kmap.drawingModeOptions);
                        $.kmap.map.addOverlay($.kmap.markerPolygon);
                    } else {
                        $.kmap.markerPolygon.setPath($.kmap.markerPolyPointBaidu);
                    }
                    break;
                case 'google':
                case 'google_zh':
                    if ($.kmap.markerPolygon == null) {
                        //添加多边形
                        $.kmap.markerPolygon = new google.maps.Polygon($.kmap.drawingModeOptions);
                        $.kmap.markerPolygon.setMap($.kmap.map);
                    } else {
                        $.kmap.markerPolygon.setPath($.kmap.markerPolyPoint);
                    }

                    break;
            }
        },
        addCircle: function(e) { //添加圆形
            var q = /msie (\d+\.\d)/i.test(navigator.userAgent); //判断是否ie
            e = window.event || e;
            if (e.button != 1 && q || e.button != 0 && !q) {
                return;
            }
            if (q && $.kmap.overlayDiv.getDom($.kmap.map).setCapture) {
                $.kmap.overlayDiv.getDom(p).setCapture(); //将鼠标事件锁定在指定的元素上
            }
            if (null == $.kmap.markerCenterPoint) { //第一次获取中心点，后面点击无效
                $.kmap.markerCenterPoint = $.kmap.pixel2LatLng(e); //废弃方法： $.kmap.overlayDiv.getDrawPoint(e, true); //圆形中心点
            }
            switch ($.kmap.option.type) {
                case 'baidu':
                    if ($.kmap.markerCircle == null) {
                        $.kmap.markerCircle = new BMap.Circle($.kmap.markerCenterPoint, 0, $.kmap.drawingModeOptions);
                        $.kmap.map.addOverlay($.kmap.markerCircle);
                    }
                    break;
                case 'google':
                case 'google_zh':
                    if ($.kmap.markerCircle == null) {
                        $.kmap.drawingModeOptions.center = $.kmap.markerCenterPoint;
                        $.kmap.drawingModeOptions.radius = 0;
                        $.kmap.markerCircle = new google.maps.Circle($.kmap.drawingModeOptions);
                        $.kmap.markerCircle.setMap($.kmap.map);
                    }
                    break;
            }
        },
        movePolyline: function(e) { //移动折线
            if ($.kmap.markerPolyline != null) {
                //e.point = $.kmap.overlayDiv.getDrawPoint(e, true);
                e.point = $.kmap.pixel2LatLng(e);
                switch ($.kmap.option.type) {
                    case 'baidu':
                        $.kmap.markerPolyline.setPositionAt($.kmap.markerPolyPointBaidu.length - 1, e.point);
                        break;
                    case 'google':
                    case 'google_zh':
                        var point = new Array();
                        for (var i = 0; i < $.kmap.markerPolyPoint.length; i += 1) {
                            point.push($.kmap.markerPolyPoint[i]);
                        }
                        point.push(e.point);
                        $.kmap.markerPolyline.setPath(point);
                        break;
                }
            }
        },
        moveRectangle: function(e) { //移动矩形
            if ($.kmap.markerRectangle != null) {
                e.point = $.kmap.pixel2LatLng(e);
                switch ($.kmap.option.type) {
                    case 'baidu':
                        //e.point = $.kmap.overlayDiv.getDrawPoint(e, true);
                        //根据起点终点获取矩形四个顶点
                        $.kmap.markerRectangle.setPath($.kmap.getLatLngBounds($.kmap.markerRectStart, e.point));
                        break;
                    case 'google':
                    case 'google_zh':
                        var bounds = $.kmap.getLatLngBounds($.kmap.markerRectStart, e.point);
                        //console.log(bounds);
                        $.kmap.markerRectangle.setBounds(bounds);
                        break;
                }
            }
        },
        movePolygon: function(e) { //移动多边形
            if ($.kmap.markerPolygon != null) {
                e.point = $.kmap.pixel2LatLng(e);
                switch ($.kmap.option.type) {
                    case 'baidu':
                        $.kmap.markerPolygon.setPositionAt($.kmap.markerPolyPointBaidu.length - 1, e.point);
                        break;
                    case 'google':
                    case 'google_zh':
                        var point = new Array();
                        for (var i = 0; i < $.kmap.markerPolyPoint.length; i += 1) {
                            point.push($.kmap.markerPolyPoint[i]);
                        }
                        point.push(e.point);
                        $.kmap.markerPolygon.setPath(point);
                        break;
                }
            }
        },
        moveCircle: function(e) { //移动圆形
            if ($.kmap.markerCircle != null) {
                e.point = $.kmap.pixel2LatLng(e);
                //e.point = $.kmap.overlayDiv.getDrawPoint(e, true);
                switch ($.kmap.option.type) {
                    case 'baidu':
                        //$.kmap.map.getDistance($.kmap.markerCenterPoint, e.point) 百度自带测距方法，已注销
                        $.kmap.markerRadius = $.kmap.distance($.kmap.markerCenterPoint.lat, $.kmap.markerCenterPoint.lng, e.point.lat, e.point.lng, 0)
                        $.kmap.markerCircle.setRadius($.kmap.markerRadius);
                        break;
                    case 'google':
                    case 'google_zh':
                        $.kmap.markerRadius = $.kmap.distance($.kmap.markerCenterPoint.lat(), $.kmap.markerCenterPoint.lng(), e.point.lat(), e.point.lng(), 0)
                        $.kmap.markerCircle.setRadius($.kmap.markerRadius);
                        break;
                }
            }
        },
        showPolyline: function(points) { //展示折线
            var markerPolyline = null;
            if (!points || points.length < 2) {
                console.log("points not null or points size < 2 ");
                return markerPolyline;
            }
            switch ($.kmap.option.type) {
                case 'baidu':
                    //添加多边形
                    markerPolyline = new BMap.Polyline(points, $.kmap.drawingModeOptions);
                    $.kmap.map.addOverlay(markerPolyline);
                    //markerPolyline.setPath(points);
                    break;
                case 'google':
                case 'google_zh':
                    markerPolyline = new google.maps.Polyline($.kmap.drawingModeOptions);
                    markerPolyline.setMap($.kmap.map);
                    markerPolyline.setPath(points);
                    break;
            }
            return markerPolyline;
        },
        showRectangle: function(start, end) { //展示矩形
            var markerRectangle = null;
            if (!start || !end) {
                console.log("start and end not null ");
                return markerRectangle;
            }
            var bounds = $.kmap.getLatLngBounds(start, end);
            switch ($.kmap.option.type) {
                case 'baidu':
                    //添加矩形
                    markerRectangle = new BMap.Polygon(bounds, $.kmap.drawingModeOptions);
                    $.kmap.map.addOverlay(markerRectangle);
                    //markerRectangle.setPath(bounds);
                    break;
                case 'google':
                case 'google_zh':
                    //添加矩形
                    $.kmap.drawingModeOptions.map = $.kmap.map;
                    $.kmap.drawingModeOptions.clickable = false;
                    markerRectangle = new google.maps.Rectangle($.kmap.drawingModeOptions);
                    markerRectangle.setBounds(bounds);
                    break;
            }
            return markerRectangle;
        },
        showPolygon: function(points) { //展示多边形
            var markerPolygon = null;
            if (!points || points.length < 3) {
                console.log("points not null or points size < 2 ");
                return markerPolygon;
            }
            switch ($.kmap.option.type) {
                case 'baidu':
                    //添加多边形
                    markerPolygon = new BMap.Polygon(points, $.kmap.drawingModeOptions);
                    $.kmap.map.addOverlay(markerPolygon);
                    //markerPolygon.setPath(points);
                    break;
                case 'google':
                case 'google_zh':
                    //添加多边形
                    markerPolygon = new google.maps.Polygon($.kmap.drawingModeOptions);
                    markerPolygon.setMap($.kmap.map);
                    markerPolygon.setPath(points);
                    break;
            }
            return markerPolygon;
        },
        showCircle: function(center, radius) { //展示圆形
            var markerCircle = null;
            if (radius <= 0) {
                console.log("radius 必须大于0");
                return markerCircle;
            }
            if (!center) {
                console.log("center not null");
                return markerCircle;
            }
            switch ($.kmap.option.type) {
                case 'baidu':
                    markerCircle = new BMap.Circle(center, 0, $.kmap.drawingModeOptions);
                    $.kmap.map.addOverlay(markerCircle);
                    markerCircle.setRadius(radius);
                    break;
                case 'google':
                case 'google_zh':
                    $.kmap.drawingModeOptions.center = center;
                    $.kmap.drawingModeOptions.radius = 0;
                    markerCircle = new google.maps.Circle($.kmap.drawingModeOptions);
                    markerCircle.setMap($.kmap.map);
                    markerCircle.setRadius(radius);
                    break;
            }
            return markerCircle;
        },
    }
})(jQuery);