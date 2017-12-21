$(function(){
    data=[
        {
            html: '<a href="#"><i class=\"fa fa-book fa-fw\"></i> 基础</a>',
            open:false,
            children: [
                {
                    html: '<a href="#"><i class=\"fa fa-desktop fa-fw\"></i> 布局</a>',
                    children: [
                        {
                            html:"<a  data-pjax jump=\"page_container\"  title=\"容器\" href=\"/template/kui_page_container.html\" target=\"_blank\"><i class=\"fa fa-window-maximize fa-fw\"></i> 容器</a>"
                        },{
                            html:"<a  data-pjax jump=\"page_row\"  title=\"栅格布局\" href=\"/template/kui_page_row.html\" target=\"_blank\"><i class=\"fa fa-table fa-fw\"></i> 栅格布局</a>"
                        },{
                            html:"<a  data-pjax jump=\"page_layout\" title=\"方格布局\" href=\"/template/kui_page_layout.html\" target=\"_blank\"><i class=\"fa fa-th-large fa-fw\"></i> 方格布局</a>"
                        },{
                            html:"<a  data-pjax jump=\"page_responsive\" title=\"响应式布局\" href=\"/template/kui_page_responsive.html\" target=\"_blank\"><i class=\"fa fa-tablet fa-fw\"></i> 响应式布局</a>"
                        },{
                            html:"<a  data-pjax jump=\"page_content\" title=\"内容布局\" href=\"/template/kui_page_content.html\" target=\"_blank\"> <i class=\"fa fa-newspaper-o fa-fw\"></i> 内容布局</a>"
                        }
                    ]
                },
                {
                    html:"<a  data-pjax jump=\"page_typography\" href=\"/template/kui_page_typography.html\" target=\"_blank\"><i class=\"fa fa-bold fa-fw\"></i> 排版</a>"
                },
                {
                    html:"<a  data-pjax jump=\"page_fonticons\" href=\"/template/kui_page_fonticons.html\" target=\"_blank\"><i class=\"fa fa-fonticons fa-fw\"></i> 图标</a>"
                },
                {
                    html:"<a  data-pjax jump=\"page_button\" href=\"/template/kui_page_button.html\" target=\"_blank\"><i class=\" fa fa-toggle-off fa-fw\"></i> 按钮</a>"
                },{
                    html:"<a href=\"#\"><i class=\"fa fa-wpforms fa-fw\"></i> 表单</a>",
                    children: [
                        {
                            html:"<a  data-pjax jump=\"page_form\" href=\"/template/kui_page_form.html\" target=\"_blank\"><i class=\"fa fa-edit fa-fw\"></i> 常用表单</a>"
                        },
                        {
                            html:"<a  data-pjax jump=\"page_select\" href=\"/template/kui_page_select.html\" target=\"_blank\"><i class=\"fa fa-list-alt fa-fw\"></i> 筛选表单</a>"
                        }
                    ]
                }
               
            ]
        }
       /*  ,{
            title: '图片管理',
            id: 2,
            children: [
                {
                    title: '图片管理1',
                    id: 21
                },
                {
                    title: '图片管理2',
                    id: 22
                },
                {
                    title: '图片管理3',
                    id: 33
                }
            ]
        } */
    ];
    var options={
        animate:true,
        data: data
    };
    $('#kui-tree-menu').tree(options);
    $('.kui-tree-menu-arrow-a').click(function(){
        var obj=$('.kui-tree-menu-arrow-a');
        if($(obj).hasClass("open")){
            $(obj).removeClass("open");
            $("body").removeClass("big-page");
        } else {
            $(obj).addClass("open");
            $("body").addClass("big-page");
        }
    });
    $.kui.contentTabs.init();
    var host="http://"+window.location.host;
	//加载header模块
    var header_data = {
        add: '增加',welcome:'欢迎光临',account:'admin',userinfo:'个人信息',upaw:'修改密码',esc:'退出',logoimg:host+"/images/kui-logo.png",
        list: ['文艺', '博客', '摄影', '电影', '民谣', '旅行', '吉他']
    };
   
    $.kui.kjax.atemplate('header','header',host+'/template/kui_header.html',header_data,'#data');
    //加载首页内容
    //$.kui.kjax.atemplate('main','page_index','template/kui_page_index.html',null,'#data');
    //初始化pjax
    $('a[data-pjax]').pjax(null,null,{changeAddress:true});
    $(document).on('pjax:send', function() {
        //在pjax发送请求时，显示loading动画层
        layer.load(1, {
            shade: 0.5 //0.1透明度的白色背景
          });
    });
    $(document).on('pjax:end', function() {
        //在pjax发送请求时，显示loading动画层
        layer.closeAll();
        
    });
   
    
	//$("a[jump]").click(function(e){
    //    var page=e.target.getAttribute("jump");
    //    if(page){
    //        $.kui.contentTabs.getJump(page);
    //        $.kui.kjax.atemplate('main',page,'template/kui_'+page+'.html',null,'#data');
    //    }
      
		
	//});
	
});


