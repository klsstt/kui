require(['jquery','art-template','text!header','text!aside','layer','k','k-blank'], function($,template,header,aside) {
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
	
	$("#data").html(aside);
	 var data = {
			list: [{title:'页面模版',id:'menu-article',list:[{title:'表格',id:11,url:'table.html'},{title:'资讯管理2',id:12},{title:'资讯管理3',id:13}]},{title:'图片管理',id:2,list:[{title:'图片管理1',id:21},{title:'图片管理2',id:22},{title:'图片管理3',id:33}]} ]
		};
	
	var html = template('aside', data);
	$(".k-aside").html(html);
	/*左侧菜单*/
	$(".k-aside").kfold({
		titCell:'.menu_dropdown dl dt',
		mainCell:'.menu_dropdown dl dd',
	});	
	
});


function skin(e){
	var skin = $(e).attr("data-val");
	if(skin==null||skin==""){
		skin="default";
	}
	$.cookie("Huiskin",skin);
	window.location.reload();
}