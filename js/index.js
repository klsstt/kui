require(['jquery','art-template','text!header','text!devices','async!bmap','layer','k','k-blank'], function($,template,header,devices) {
	/*换肤*/
	$(function(){
		
	});
	
	$("#data").html(header);
    var data = {
			add: '增加',username:'欢迎光临',useraccount:'admin',userinfo:'个人信息',upaw:'修改密码',esc:'退出',
			list: ['文艺', '博客', '摄影', '电影', '民谣', '旅行', '吉他']
		};
	
	var html = template('header', data);
	$(".navbar-wrapper").html(html);
	
	$("#data").html(devices);
	data = {
			list: [{title:'出租车',id:'menu-article',list:[{title:'粤BAS21',id:11},{title:'粤BAS22',id:12},{title:'粤BAS25',id:13}]},{title:'图片管理',id:2,list:[{title:'图片管理1',id:21},{title:'图片管理2',id:22},{title:'图片管理3',id:33}]} ]
		};
	
	html = template('device', data);
	$(".k-aside").html(html);
	/*左侧菜单*/
	$(".k-aside").kfold({
		triggerType:true,
		titCell:'.menu_dropdown dl dt',
		mainCell:'.menu_dropdown dl dd',
	});	
	

	var map = new BMap.Map('allmap');
	map.centerAndZoom(new BMap.Point(121.491, 31.233), 11);
		//添加地图类型控件
	map.addControl(new BMap.MapTypeControl({
		mapTypes:[
            BMAP_NORMAL_MAP,
            BMAP_HYBRID_MAP
        ]}));	  
	map.setCurrentCity("北京");          // 设置地图显示的城市 此项是必须设置的
	map.enableScrollWheelZoom(true);     //开启鼠标滚轮缩放

});



function skin(e){
	var skin = $(e).attr("data-val");
	if(skin==null||skin==""){
		skin="default";
	}
	$.cookie("Huiskin",skin);
	window.location.reload();
}