function getUrlParameter(name){
	if(location.search==''){
		return '';
	}
	
	var o={};
	var search=location.search.replace(/\?/,'');//只替换第一个问号,如果参数中带有问号,当作普通文本
	var s=search.split('&');
	for(var i=0;i<s.length;i++){
		o[s[i].split('=')[0]]=s[i].split('=')[1];
	}
	var ret = '';
	if (o[name]!=undefined) {
		ret = o[name];
	}
	s=ret.split('%26');
	if (s.length > 0) {
		return s[0];
	} else {
		return ret;
	}
}

// JavaScript Document
function loadjscssfile(filename,filetype){
	if(filetype == "js"){
	    var fileref = document.createElement('script');
	    fileref.setAttribute("type","text/javascript");
	    fileref.setAttribute("src",filename);
	}else if(filetype == "css"){
	
	    var fileref = document.createElement('link');
	    fileref.setAttribute("rel","stylesheet");
	    fileref.setAttribute("type","text/css");
	    fileref.setAttribute("href",filename);
	}
   if(typeof fileref != "undefined"){
        document.getElementsByTagName("head")[0].appendChild(fileref);
    }   
}

var initZoom = null;
var initJingDu = null;
var initWeiDu = null;
var initParseAddress = true;
var isChrome = false;
	
//初始化
function initCommon(themePath) {
	var theme = getUrlParameter("theme");
	if (theme == "") {
		theme = "default";
	}
	loadjscssfile(themePath + theme + ".css","css");
	
	var language = getUrlParameter("lang");
	if (language == "english") {
		lang = new languageEnglish();
	} else if (language == "chinese") {
		lang = new languageChinese();
	} else if (language == "thai") {
		lang = new languageThai();
	} else if (language == "chinese traditional") {
		lang = new languageTw();
	} else if (language == "turkey") {
		lang = new languageTurkey();
	} else if (language == "spanish") {
		lang = new languageSpanish();
	} else if (language == "arabic") {
		lang = new languageArabic();		
	} else if (language == "portugues") {
		lang = new languagePortugues();
	} else {
		lang = new languageEnglish();
	}
	document.getElementById('spanMap3').innerText = lang.mapBaidu;
	document.getElementById('spanMap0').innerText = lang.mapGoogle;
	document.getElementById('spanMap1').innerText = lang.mapMapInfo;

	initZoom = getUrlParameter("zoom");
	initJingDu = getUrlParameter("jingDu");
	initWeiDu = getUrlParameter("weiDu");
	var tool = getUrlParameter("tool");
	
	$("#zoomIn").attr("title", lang.tipZoomIn);
	$("#zoomOut").attr("title", lang.tipZoomOut);
	$("#addCircle").attr("title", lang.tipAddCircle);
	$("#distance").attr("title", lang.tipDistance);
	
	$("#addPoint").attr("title", lang.addPoint);
	$("#addRectangle").attr("title", lang.addRectangle);
	$("#addPolygon").attr("title", lang.addPolygon);
	$("#addLine").attr("title", lang.addLine);

	$("#btnSearch").attr("title", lang.btnSearch);
	$("#btnFullScreen").attr("title", lang.fullScreen);
	$("#btnCenter").attr("title", lang.btnCenter);
	$("#btnExpand").attr("title", lang.expand);
	$("#btnLjfx").attr("title", lang.btnLjfx);
	
	$("#ljfx").val(lang.ljfx);
	$("#fx").val(lang.fx);
	if (parseInt(tool)) {
		
		$("#zoomIn").show();
		$("#zoomOut").show();
		$("#addCircle").show();
		$("#distance").show();
		
		$("#addPoint").show();
		$("#addRectangle").show();
		$("#addPolygon").show();
		$("#addLine").show();
		
		$("#btnSearch").show();
		$("#btnFullScreen").show();
		$("#btnCenter").show();
		$("#btnExpand").show();
		
		$("#selectMap").show();
		
		$("#btnLjfx").show();
	}
	
	if ( parseInt(getUrlParameter("parseAddress")) > 0 ) {
		initParseAddress = true;
	} else {
		initParseAddress = false;
	}
	isChrome = false;//window.navigator.userAgent.indexOf("Chrome") !== -1 ? true : false;
	var maptype = getUrlParameter("maptype");
	if ( maptype != null && maptype != "") {
		var mapValid = maptype.split(",");
		for (var i = 0; i < mapValid.length; ++ i) {
			$("#liMap" + mapValid[i]).css("display", "block");
			//$("#liMap" + mapValid[i]).show();			
		}
	}
}

function showMapSelect() {
	document.getElementById('mapMenu').className = "h2_cat_type active_cat_type";
}

function hideMapSelect() {
	document.getElementById('mapMenu').className = "h2_cat_type";
}

function showAddressTip(tip) {
	document.getElementById("overVehicleAddress").innerHTML=tip;
}