$(function(){
    data=[
        {
            html:"<a jump=\"page-index\" ><i class=\"fa fa-home fa-fw\"></i> 首页</a>"
        },
        {
            html: '<a href="#"><i class=\"fa fa-book fa-fw\"></i> 基础</a>',
            open:false,
            children: [
                {
                    html: '<a href="#"><i class=\"fa fa-desktop fa-fw\"></i> 布局</a>',
                    children: [
                        {
                            html:"<a jump=\"page-container\" ><i class=\"fa fa-window-maximize fa-fw\"></i> 容器</a>"
                        },{
                            html:"<a jump=\"page-row\" ><i class=\"fa fa-table fa-fw\"></i> 栅格布局</a>"
                        },{
                            html:"<a jump=\"page-layout\" ><i class=\"fa fa-th-large fa-fw\"></i> 方格布局</a>"
                        },{
                            html:"<a jump=\"page-responsive\" ><i class=\"fa fa-tablet fa-fw\"></i> 响应式布局</a>"
                        },{
                            html:"<a jump=\"page-content\" ><i class=\"fa fa-newspaper-o fa-fw\"></i> 内容布局</a>"
                        }
                    ]
                },
                {
                    html:"<a jump=\"page-typography\" ><i class=\"fa fa-bold fa-fw\"></i> 排版</a>"
                },
                {
                    html:"<a jump=\"page-fonticons\" ><i class=\"fa fa-fonticons fa-fw\"></i> 图标</a>"
                },
                {
                    html:"<a jump=\"page-button\" ><i class=\" fa fa-toggle-off fa-fw\"></i> 按钮</a>"
                },{
                    html:"<a href=\"#\"><i class=\"fa fa-wpforms fa-fw\"></i> 表单</a>",
                    children: [
                        {
                            html:"<a jump=\"page-form\" ><i class=\"fa fa-edit fa-fw\"></i> 常用表单</a>"
                        },
                        {
                            html:"<a jump=\"page-select\" ><i class=\"fa fa-list-alt fa-fw\"></i> 筛选表单</a>"
                        }
                    ]
                }
               
            ]
        },
        {
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
        }
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
});