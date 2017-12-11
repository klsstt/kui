require(['jquery','art-template','text!header','text!example-page','bootstrap-select','layer','kui','example'], function($,template,header,epage) {
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
	initPage("page-index");
	function initPage(p){
		$("#data").html(epage);
		html = template(p);
		$("main").html(html);
	}
	$("a[jump]").click(function(e){
        var page=e.target.getAttribute("jump");
		initPage(page);
		if(page=="page-select"){
			$('[data-plugin=selectpicker]').selectpicker({
				'noneSelectedText': '没有选中任何项',
				'noneResultsText': "没有找到匹配项",
				'countSelectedText':"已选中{1}项中的{0}项",
				'maxOptionsText': ['超出限制 (最多选择{n}项)', '组选择超出限制(最多选择{n}组)'],
				'selectAllText': "选择全部",
				'deselectAllText': "取消全部选择",
				'doneButtonText': '关闭',
				'style': "btn-select",
				'iconBase':"fa",
				'tickIcon': "fa-check"
			  });
			$('[data-plugin=selectpicker-outline]').selectpicker({
				'noneSelectedText': '没有选中任何项',
				'noneResultsText': "没有找到匹配项",
				'countSelectedText':"已选中{1}项中的{0}项",
				'maxOptionsText': ['超出限制 (最多选择{n}项)', '组选择超出限制(最多选择{n}组)'],
				'selectAllText': "选择全部",
				'deselectAllText': "取消全部选择",
				'doneButtonText': '关闭',
				
				'iconBase':"fa",
				'tickIcon': "fa-check"
			});
			  
		}
	});
	

});



