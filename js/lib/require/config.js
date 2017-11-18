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
var baseUrl="http://localhost:6631/";
require.config({
	baseUrl:'js',
	//urlArgs:'v='+(new Date()).getTime(),//�������
	paths : {//����js�ļ�·������Ҫ��js���Զ�����baseUrlǰ׺
		'jquery':'lib/jquery/1.9.1/jquery.min',
		'async':'lib/require/requirejs-plugins-master/src/async',//require�첽js���ز������ͼר��
		"text":"lib/require/text",//require�ļ�������
		'css':'lib/require/require.css',//require css�ļ�������
		'store':'lib/store',//���ش洢���
		
		'jquery.validate':'lib/jquery.validation/1.14.0/jquery.validate',
		'validate-methods':'lib/jquery.validation/1.14.0/validate-methods',
		'messages_zh':'lib/jquery.validation/1.14.0/messages_zh',
		
		'layer':'lib/layer/2.4/layer',
		
		'k':'k+/js/k',
		'k-blank':'k+/js/k-blank',
		
		'art-template': 'lib/art-template/template-web',
		
		'jdataTables':'lib/datatables/1.10.0/jquery.dataTables.min',
		'bdataTables':'lib/datatables/1.10.0/dataTables.bootstrap.min',
		'fixedHeader':'lib/datatables/fixedHeade/dataTables.fixedHeader.min',

		'bdButton':'lib/datatables/buttons/dataTables.buttons.min',
		'bhtml5':'lib/datatables/buttons/buttons.html5.min',
		'bjszip':'lib/datatables/buttons/jszip.min',
	
		'ztree':'lib/zTree/v3/js/jquery.ztree.all-3.5.min',
		'ztree-exedit':'lib/zTree/v3/js/jquery.ztree.exedit.min',

		
		'tableFileSaver':'lib/tableExport/libs/FileSaver/FileSaver.min',
		'tableXlsx':'lib/tableExport/libs/js-xlsx/xlsx.core.min',
		
		'tableHtml2canvas':'lib/tableExport/libs/html2canvas/html2canvas.min',
		
		'tableJspdf':'lib/tableExport/libs/jsPDF/jspdf.min',
		'tablePdfAutotable':'lib/tableExport/libs/jsPDF-AutoTable/jspdf.plugin.autotable',
		'tablePdfmake':'lib/tableExport/libs/pdfMake/pdfmake.min',
		'tableVfs':'lib/tableExport/libs/pdfMake/vfs_fonts',
		
		'tableExport':'lib/tableExport/tableExport',

		'bmap':'http://api.map.baidu.com/api?v=2.0&ak=kvNOFS7CVK5EjqWrNBWEbFiEaH7G758U',
		
		'header':'../template/header.html',
		'devices':'../template/devices.html',
		'aside':'../template/aside.html'
		
		
	}
	
	//����������AMD�淶��JS���  
    ,shim:{  
		'store':['jquery'],
		'messages_zh': ['jquery'],
		'jquery.validate': ['jquery'],
		'validate-methods': ['jquery.validate','messages_zh'],
		'layer':{
			deps:['css!lib/layer/2.4/skin/layer','jquery']
		},
		'k':{
            deps:['css!k+/css/k.css','css!lib/iconfont/iconfont','css!lib/iconfont/zenicon','css!k+/css/style','jquery']
        },
		
		'k-blank':{
			deps:['css!k+/css/k-blank','css!k+/skin/'+skin+'/skin','k','jquery']
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
		'template': {
            exports: 'template'
        }
		
		
    }  
});





