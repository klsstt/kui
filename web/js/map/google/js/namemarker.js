/***************************************************************************/
NameMarker.prototype = new google.maps.OverlayView(); // 扩展OverlayView
// NameOverlay定义
function NameMarker(opts) {
  // 初始化参数：坐标、文字、地图
  if ((typeof opts.icon) != "undefined") {
  	this.icon_ = opts.icon;
	} else {
		this.icon_ = null;
	}
	this.point_ = opts.position;
	this.text_ = opts.text || "";
	this.map_ = opts.map;
//	this.icon_ = opts.icon;
    // 到onAdd时才需要创建div
	this.div_ = null;
    // 加入map
	this.setMap(this.map_);
}

NameMarker.prototype.onAdd = function () {
    // 创建一个div，其中包含了当前文字
	var div = document.createElement("div");
	div.id=this.point_;
	div.style.borderStyle = "none";
	div.style.borderWidth = "0px";
	div.style.position = "absolute";
	div.innerHTML = this.getHtml();
	this.div_ = div;
	var panes = this.getPanes();
	panes.overlayImage.appendChild(div);
};

NameMarker.prototype.draw = function () {
    var overlayProjection = this.getProjection();
	// 利用projection获得当前视图的坐标
	var center = overlayProjection.fromLatLngToDivPixel(this.point_);
    // 为简单，长宽是固定的，实际应该根据文字改变
	var div = this.div_;
	if (this.icon_ != null) {
		div.style.left = center.x - 10 +  "px";
	} else {
		div.style.left = center.x + 12 +  "px";
	}
	div.style.top = center.y - 7 + "px";
	div.style.width = "400px";
	div.style.height = "10px";
};

NameMarker.prototype.onRemove = function () {
	this.div_.parentNode.removeChild(this.div_);
	this.div_ = null;
};

NameMarker.prototype.update = function(obj){
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

NameMarker.prototype.setPosition = function (position) {
	if (this.point_ != position) {
		this.point_ = position;
		if (this.div_) {
			var center = this.getProjection().fromLatLngToDivPixel(position);
	  	this.div_.style.left = center.x + 16 +  "px";
			this.div_.style.top = center.y - 8 + "px";
		}
	}
};

NameMarker.prototype.setIcon = function (icon) {
	if (this.icon_ != obj.icon) {
		this.icon_ = obj.icon;
		this.flash();
	}
};

NameMarker.prototype.setName = function (text) {
	if (this.text_ != text) {
		this.text_ = text;
		
		this.flash();
	}
};

NameMarker.prototype.getHtml = function() {
	if (this.icon_ != null) {
		return "<img src='" + this.icon_ + "'/><span class='b'>" + this.text_ + "</span>";
	} else {
		return "<span class='b'>" + this.text_ + "</span>";
	}
}

NameMarker.prototype.flash = function () {
	this.div_.innerHTML = this.getHtml();
}