function getCookie(name){
    var arr,reg=new RegExp("(^| )"+name+"=([^;]*)(;|$)");
    if(arr=document.cookie.match(reg))
        return unescape(arr[2]); 
    else 
        return null; 
} 

var skin=getCookie("Huiskin");
if(skin==null||skin==""){
		skin="default";
}
var baseUrl="http://localhost:81/";
require.config({
	baseUrl:'js',
	//urlArgs:'v='+(new Date()).getTime(),//清楚缓存
	paths : {//定义js文件路径不需要加js会自动加载baseUrl前缀
		'jquery':'lib/jquery/1.9.1/jquery.min',
		'async':'lib/require/requirejs-plugins-master/src/async',//require异步js加载插件，地图专用
		"text":"lib/require/text",//require文件导入插件
		'css':'lib/require/require.css',//require css文件导入插件
		'store':'lib/store',//本地存储插件
		
		'jquery.validate':'lib/jquery.validation/1.14.0/jquery.validate',//jquery库插件模块
		'validate-methods':'lib/jquery.validation/1.14.0/validate-methods',
		'messages_zh':'lib/jquery.validation/1.14.0/messages_zh',
		
		'layer':'lib/layer/2.4/layer',//layer插件模块
		
		'kui':'common/kui',//kui插件模块
		'example':'../example/example',
		'example-css':'../example/example.css',
		
		'art-template': 'lib/art-template/template-web',//模板插件模块

		'bootstrap-select':'lib/bootstrap-select/bootstrap-select.min',
		
		'jdataTables':'lib/datatables/1.10.0/jquery.dataTables.min',//表格插件模块
		'bdataTables':'lib/datatables/1.10.0/dataTables.bootstrap.min',
		'fixedHeader':'lib/datatables/fixedHeade/dataTables.fixedHeader.min',

		'bdButton':'lib/datatables/buttons/dataTables.buttons.min',//前端导出插件模块
		'bhtml5':'lib/datatables/buttons/buttons.html5.min',
		'bjszip':'lib/datatables/buttons/jszip.min',
	
		'ztree':'lib/zTree/v3/js/jquery.ztree.all-3.5.min',//ztree插件模块
		'ztree-exedit':'lib/zTree/v3/js/jquery.ztree.exedit.min',

		
		'tableFileSaver':'lib/tableExport/libs/FileSaver/FileSaver.min',
		'tableXlsx':'lib/tableExport/libs/js-xlsx/xlsx.core.min',
		
		'tableHtml2canvas':'lib/tableExport/libs/html2canvas/html2canvas.min',
		
		'tableJspdf':'lib/tableExport/libs/jsPDF/jspdf.min',//前端导出插件模块
		'tablePdfAutotable':'lib/tableExport/libs/jsPDF-AutoTable/jspdf.plugin.autotable',
		'tablePdfmake':'lib/tableExport/libs/pdfMake/pdfmake.min',
		'tableVfs':'lib/tableExport/libs/pdfMake/vfs_fonts',
		
		'tableExport':'lib/tableExport/tableExport',

		'bmap':'http://api.map.baidu.com/api?v=2.0&ak=kvNOFS7CVK5EjqWrNBWEbFiEaH7G758U',//地图模块
		
		'prettify':'lib/prettify/prettify',

		'header':'../template/kui_header.html',//网页模板模块
		'example-page':'../template/kui_example.html'
		
		
	}
	
	//包含其它非AMD规范的JS框架  
    ,shim:{  
		'store':['jquery'],
		'messages_zh': ['jquery'],
		'jquery.validate': ['jquery'],
		'validate-methods': ['jquery.validate','messages_zh'],
		'layer':{
			deps:['css!lib/layer/2.4/skin/layer','jquery']//加载layer弹窗样式
		},
		'kui':{
            deps:['css!/css/kui','css!/css/lib/font-awesome-4.7/css/font-awesome.min','css!/skin/'+skin+'/skin','jquery']//加载kui以及字体文件和网站主题
        },
		
		'bdataTables':{
			deps:['css!lib/datatables/1.10.0/dataTables.bootstrap','jquery','jdataTables']
		},
		'fixedHeader':{
			deps:['css!lib/datatables/fixedHeade/dataTables.fixedHeader','jquery','jdataTables','bdataTables']
		},

		'bdButton':{
			deps:['css!lib/datatables/buttons/buttons.dataTables.min','jquery','jdataTables','bdataTables','bhtml5','bjszip']
		},

		'ztree':{
			deps:['css!lib/zTree/v3/css/metroStyle/metroStyle','jquery']
		},
		'ztree-exedit':{
			deps:['ztree']
		},
		'tableJspdf':{
			deps:['tablePdfAutotable','tablePdfmake','tableVfs']
		},
		'tableExport':{
			deps:['jquery','tableFileSaver','tableXlsx','tableHtml2canvas']
		},
		'bmap': {
            exports: 'bmap'
		},
		'example':{
			deps:['css!../example/example','kui']
		},
		'prettify':{
			deps:['css!lib/prettify/prettify','jquery']
		},
		'bootstrap-select':{
			deps:['css!lib/bootstrap-select/bootstrap-select','jquery']
		},
		'template': {
            exports: 'template'
        }
		
		
    }  
});





