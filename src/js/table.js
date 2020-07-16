require(['jquery','jdataTables','art-template','text!header','text!aside','layer','k','k-blank','ztree','tableExport','store'], function(jQuery,datatable,template,header,aside) {
	/*换肤*/
	$(function(){
		
	});
	
	$("#data").html(header);
	var account=$.k_store.get("account");
    var data = {
			index:'定位服务',add: '增加',username:'欢迎光临',useraccount:account,userinfo:'个人信息',upaw:'修改密码',esc:'退出',
			list: ['文艺', '博客', '摄影', '电影', '民谣', '旅行', '吉他']
		};
	
	var html = template('header', data);
	$(".navbar-wrapper").html(html);
	
	$("#data").html(aside);
	 var data = {
			list: [{title:'页面模版',id:'menu-article',active:'selected',list:[{title:'表格',id:11,url:'table.html',active:'current'},{title:'资讯管理2',id:12},{title:'资讯管理3',id:13}]},{title:'图片管理',id:2,list:[{title:'图片管理1',id:21},{title:'图片管理2',id:22},{title:'图片管理3',id:33}]} ]
		};
	
	var html = template('aside', data);
	$(".k-aside").html(html);
	/*左侧菜单*/
	$(".k-aside").kfold({
		titCell:'.menu_dropdown dl dt',
		mainCell:'.menu_dropdown dl dd',
	});	
	var table =null;
	$(function () {
		table = $('#dataTableExample').DataTable({
			scrollY:$(window).height() - 400,
			"scrollX": false,
			"aaSorting": [[ 4, "desc" ]],//默认第几个排序
			"lengthChange": false,//是否允许用户自定义显示数量
			//"bPaginate": true, //翻页功能
			"pageLength" : 15,//默认每页数量
			"processing": false,
            "serverSide": false, 
			//"bFilter": true, //列筛序功能
			"searching": false,//本地搜索
			"ordering": true, //排序功能
			"Info": true,//页脚信息
			"autoWidth": true,//自动宽度
			//"ajax": "js/lib/datatables/arrays.do",
			"ajax": {
				"url": "js/lib/datatables/arrays.do",
				"type":"GET"
			},
			"columns": [
				{ "data": null },
				{ "data": "first_name" },
				{ "data": "last_name" },
				{ "data": "position" },
				{ "data": "office" },
				{ "data": "start_date" },
				{ "data": "salary" },
				{
					"data": "id",
					render : function(data, type,row) {
						if (data == 0) {
							return "未删除";
						} else {
							return "<a style=\"text-decoration:none\"  href=\"javascript:;\" title=\"停用\" class=\"ml-5\"><i class=\"iconfont\"></i></a>"+
											"<a style=\"text-decoration:none\" onclick=\"admin_add('添加管理员','table_add.html','800','600')\" href=\"javascript:;\" title=\"编辑\" class=\"ml-5\"><i class=\"iconfont\"></i></a>"+
											"<a style=\"text-decoration:none\"  href=\"javascript:;\" title=\"删除\"  onclick=\"admin_del(this,'1')\"  class=\"ml-5\"><i class=\"iconfont\"></i></a>";
						}
					}
				}
			],
			"columnDefs": [
                  {
                    "targets": [ 1 ],
                    "visible": false,
                    "searchable": false,
					"orderable": false,
                  }/*,{
						"targets": [ 7 ],
						"data": null,
						"defaultContent": 
					}*/
                  //,{"targets": [ 5], "visible": false}
            ],
			"order": [ [0, null],[ 5, "desc" ]],
			"language": {
					"sProcessing":   "处理中...",
					"sLengthMenu":   "显示 _MENU_ 项结果",
					"sZeroRecords":  "没有匹配结果",
					"sInfo":         "显示第 _START_ 至 _END_ 项结果，共 _TOTAL_ 项",
					"sInfoEmpty":    "显示第 0 至 0 项结果，共 0 项",
					"sInfoFiltered": "(由 _MAX_ 项结果过滤)",
					"sInfoPostFix":  "",
					"sSearch":       "本地搜索:",
					"sUrl":          "",
					"sEmptyTable":     "表中数据为空",
					"sLoadingRecords": "载入中...",
					"sInfoThousands":  ",",
					"oPaginate": {
						"sFirst":    "首页",
						"sPrevious": "上页",
						"sNext":     "下页",
						"sLast":     "末页"
					},
					"oAria": {
						"sSortAscending":  ": 以升序排列此列",
						"sSortDescending": ": 以降序排列此列"
					}
            }
		});

		 //$('#dataTableExample tbody').on( 'click', 'a', function () {
		  //      var data = table.row( $(this).parents('tr') ).data();
		  //      alert( data[0] +"'s salary is: "+ data[ 5 ] );
		  //  } );
		 $('#dataTableExample tbody').on( 'click', 'tr', function () {
				$(this).toggleClass('selected');
			} );
 
		$('#button').click( function () {
			alert( table.rows('.selected').data()[0][0] +' row(s) selected' );
		});

		table.on('order.dt search.dt',
                   function () {
                       table.column(0, {
                           search: 'applied',
                           order: 'applied'
                       }).nodes().each(function (cell, i) {
                           cell.innerHTML = i + 1;
                       });
                   }).draw();

		var setting = {
			view: {
				dblClickExpand: false,
				showLine: false,
				selectedMulti: false
			},
			 check: {
				enable: true
			},
			data: {
				simpleData: {
					enable:true,
					idKey: "id",
					pIdKey: "pId",
					rootPId: ""
				}
			},
			callback: {
				beforeClick: function(treeId, treeNode) {
					var zTree = $.fn.zTree.getZTreeObj("tree");
					if (treeNode.isParent) {
						zTree.expandNode(treeNode);
						return false;
					} else {
						demoIframe.attr("src",treeNode.file + ".html");
						return true;
					}
				}
			}
		};

		


		var zNodes =[
			{ id:1, pId:0, name:"所有车辆", open:true},
			{ id:11, pId:1, name:"出租车辆"},
			{ id:111, pId:11, name:"粤B23123"},
			{ id:112, pId:11, name:"粤B1safd3"},
			{ id:113, pId:11, name:"粤Basdf123"},
			{ id:114, pId:11, name:"粤B1asdf3"},
			{ id:115, pId:11, name:"粤B1gwer3"},
{ id:111, pId:11, name:"粤B23123"},
			{ id:112, pId:11, name:"粤B1safd3"},
			{ id:113, pId:11, name:"粤Basdf123"},
			{ id:114, pId:11, name:"粤B1asdf3"},
			{ id:115, pId:11, name:"粤B1gwer3"},
{ id:111, pId:11, name:"粤B23123"},
			{ id:112, pId:11, name:"粤B1safd3"},
			{ id:113, pId:11, name:"粤Basdf123"},
			{ id:114, pId:11, name:"粤B1asdf3"},
			{ id:115, pId:11, name:"粤B1gwer3"},
{ id:111, pId:11, name:"粤B23123"},
			{ id:112, pId:11, name:"粤B1safd3"},
			{ id:113, pId:11, name:"粤Basdf123"},
			{ id:114, pId:11, name:"粤B1asdf3"},
			{ id:115, pId:11, name:"粤B1gwer3"},
{ id:111, pId:11, name:"粤B23123"},
			{ id:112, pId:11, name:"粤B1safd3"},
			{ id:113, pId:11, name:"粤Basdf123"},
			{ id:114, pId:11, name:"粤B1asdf3"},
			{ id:115, pId:11, name:"粤B1gwer3"},
{ id:111, pId:11, name:"粤B23123"},
			{ id:112, pId:11, name:"粤B1safd3"},
			{ id:113, pId:11, name:"粤Basdf123"},
			{ id:114, pId:11, name:"粤B1asdf3"},
			{ id:115, pId:11, name:"粤B1gwer3"},
{ id:111, pId:11, name:"粤B23123"},
			{ id:112, pId:11, name:"粤B1safd3"},
			{ id:113, pId:11, name:"粤Basdf123"},
			{ id:114, pId:11, name:"粤B1asdf3"},
			{ id:115, pId:11, name:"粤B1gwer3"},
{ id:111, pId:11, name:"粤B23123"},
			{ id:112, pId:11, name:"粤B1safd3"},
			{ id:113, pId:11, name:"粤Basdf123"},
			{ id:114, pId:11, name:"粤B1asdf3"},
			{ id:115, pId:11, name:"粤B1gwer3"},
{ id:111, pId:11, name:"粤B23123"},
			{ id:112, pId:11, name:"粤B1safd3"},
			{ id:113, pId:11, name:"粤Basdf123"},
			{ id:114, pId:11, name:"粤B1asdf3"},
			{ id:115, pId:11, name:"粤B1gwer3"},
{ id:111, pId:11, name:"粤B23123"},
			{ id:112, pId:11, name:"粤B1safd3"},
			{ id:113, pId:11, name:"粤Basdf123"},
			{ id:114, pId:11, name:"粤B1asdf3"},
			{ id:115, pId:11, name:"粤B1gwer3"},
{ id:111, pId:11, name:"粤B23123"},
			{ id:112, pId:11, name:"粤B1safd3"},
			{ id:113, pId:11, name:"粤Basdf123"},
			{ id:114, pId:11, name:"粤B1asdf3"},
			{ id:115, pId:11, name:"粤B1gwer3"},
{ id:111, pId:11, name:"粤B23123"},
			{ id:112, pId:11, name:"粤B1safd3"},
			{ id:113, pId:11, name:"粤Basdf123"},
			{ id:114, pId:11, name:"粤B1asdf3"},
			{ id:115, pId:11, name:"粤B1gwer3"},
{ id:111, pId:11, name:"粤B23123"},
			{ id:112, pId:11, name:"粤B1safd3"},
			{ id:113, pId:11, name:"粤Basdf123"},
			{ id:114, pId:11, name:"粤B1asdf3"},
			{ id:115, pId:11, name:"粤B1gwer3"},
			{ id:12, pId:1, name:"二级分类 1-2"},
			{ id:121, pId:12, name:"三级分类 1-2-1"},
			{ id:122, pId:12, name:"三级分类 1-2-2"},
		];



		var t = $("#treeDemo");
		t = $.fn.zTree.init(t, setting, zNodes);
		
		var zTree = $.fn.zTree.getZTreeObj("tree");
		//zTree.selectNode(zTree.getNodeByParam("id",'11'));

		//初始化导出插件
		$(".export-excel").attr("data-filename","导出测试");
		var TableExport = function () {
			"use strict";
			//function to initiate HTML Table Export
			var runTableExportTools = function () {
				$(".export-excel").on("click", function (e) {
					e.preventDefault();
					var exportTable = $(this).data("table");
					var filename = $(this).data("filename");
					var ignoreColumn = $(this).data("ignorecolumn");
					$(exportTable).tableExport({
						fileName: filename,
						type: 'excel',
						escape: 'false',
						excelstyles: ['border-bottom', 'border-top', 'border-left', 'border-right'],
						ignoreColumn: '[' + ignoreColumn + ']'
					});
				});
			};
			return {
				init: function () {
					runTableExportTools();
				}
			};
		}();
        TableExport.init();


	});
	
});
/*管理员-增加*/
function admin_add(title,url,w,h){
	layer_show(title,url,w,h);
}
/*管理员-删除*/
function admin_del(obj,id){
	layer.confirm('确认要删除吗？',function(index){
		//此处请求后台程序，下方是成功后的前台处理……
		
		$(obj).parents("tr").remove();
		layer.msg('已删除!',{icon:1,time:1000});
	});
}
function skin(e){
	var skin = $(e).attr("data-val");
	if(skin==null||skin==""){
		skin="default";
	}
	$.cookie("Huiskin",skin);
	window.location.reload();
}