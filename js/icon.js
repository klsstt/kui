require(['jquery','art-template','text!header','text!example-page','layer','kui','example','prettify'], function($,template,header,epage) {
	/*换肤*/
	$(function(){
		
    });
   
	var data=null;
	var html=null;
	//加载header模块
	$("#data").html(header);
    data = {
			add: '增加',welcome:'欢迎光临',account:'admin',userinfo:'个人信息',upaw:'修改密码',esc:'退出',
			list: ['文艺', '博客', '摄影', '电影', '民谣', '旅行', '吉他']
		};
	
	html = template('header', data);
	$("header").html(html);
	
	//加载首页内容

	function initPage(p){
		$("#data").html(epage);
		html = template(p);
		$(".kui-content").html(html);
	}
	$("a[jump]").click(function(e){
        var page=e.target.getAttribute("jump");
		initPage(page);
    });
    $(".kui-content").show();
   // prettyPrint();
});


