$(function() {
    $("#div_about").hide();
    var account, version;
    if (!$.kui.store.enable) {
        account = $.trim($.kui.util.getUrlParam("account"));
        version = $.trim($.kui.util.getUrlParam("version"));
    } else {
        account = $.trim($.kui.store.get("account"));
        version = $.trim($.kui.store.get("version"));
    }

    version = !version ? 'iframe' : version;
    $.ajax({
        url: './data/top_menu.json?t=' + new Date().getTime(),
        type: 'get',
        success: function(obj) {
            if ("string" == typeof obj && obj.indexOf('html') > 0) {
                window.location.href = "login.html";
                return;
            } else {
                obj=Object.prototype.toString.call(obj) === '[object Object]'?obj:$.parseJSON(obj);
                if (obj.result == 18) {
                    window.location.href = "login.html";
                } else {
                    //加载header模块
                    var header_data = {
                        add: '增加',
                        welcome: '欢迎光临',
                        account: account ? account : 'admin',
                        userinfo: '个人信息',
                        upaw: '修改密码',
                        esc: '退出',
                        logoimg: "./images/logo-while.png",
                        list: obj.data
                    };
                    $.kui.kjax.atemplate('header', 'header', './header.html', header_data, '#data');
                    //获取首页菜单
                    $.ajax({
                        url: './data/menu_' + version + '_' + obj.pid + '.json?t=' + new Date().getTime(), 
                        type: 'get',
                        success: function(obj) {
                            obj=Object.prototype.toString.call(obj) === '[object Object]'?obj:$.parseJSON(obj);
                            if (obj.result == 0) {
                                var option = { animate: true, data: obj.data };
                                $('#kui-tree-menu').tree(option);
                                $('.kui-tree-menu-arrow-a').click(function() {
                                    var obj = $('.kui-tree-menu-arrow-a');
                                    if ($(obj).hasClass("open")) {
                                        $(obj).removeClass("open");
                                        $("body").removeClass("big-page");
                                    } else {
                                        $(obj).addClass("open");
                                        $("body").addClass("big-page");
                                    }
                                });
                                // 手动通过点击模拟高亮菜单项
                                $('#kui-tree-menu').on('click', 'a', function() {
                                    $('#kui-tree-menu li.active').removeClass('active');
                                    $(this).closest('li').addClass('active');
                                });
                                inittab(account, version);
                            } else if (obj.result == 18) {
                                window.location.href = "login.html";
                            }
                        },
                        error: function(jqXHR, textStatus, errorThrown) {
                            console.log(jqXHR.responseText);
                            console.log(textStatus);
                            console.log(errorThrown);
                        }
                    });
                }
            }

        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log(jqXHR.responseText);
            console.log(textStatus);
            console.log(errorThrown);
        }
    });




});

function menu(pid, e) {
    var version = "";
    if (!$.kui.store.enable) {
        version = $.trim($.kui.util.getUrlParam("version"));
    } else {
        version = $.trim($.kui.store.get("version"));
    }
    if (null != pid && pid!=0) {
        $('.navbar-left li').removeClass('active');
        $(e).parent().addClass('active');
        $.ajax({
            url: './data/menu_' + version + '_' + pid + '.json?t=' + new Date().getTime(),
            success: function(obj) {
                if (obj.result == 0) {
                    var menu = $('#kui-tree-menu').data('kui.tree');
                    menu.reload(obj.data);
                } else if (obj.result == 18) {
                    window.location.href = "login.html";
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log(jqXHR.responseText);
                console.log(textStatus);
                console.log(errorThrown);
            }
        });
    }
}

function inittab(account, version) {
    if (version == "pjax") {
        //初始化pjax
        $('a[data-pjax]').pjax(null, null, {
            changeAddress: true
        });

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
        //pjax加载
        $.kui.pjaxTabs.init();
    } else {
        var ktab = ' <a title="首页" href="home.html" target="iframe-0"><span>首页</span></a>';
        $("#ktab").html(ktab);

        var kpage = '<iframe name="iframe-0" class="page-frame animation-fade active" src="home.html" frameborder="0"></iframe>';
        $(".kui-main").html(kpage);

        $.kui.iframeTabs.init();
        $('body').css({
            "overflow-x": "hidden",
            　　"overflow-y": "hidden"
        });
    }
}

function about() {
    layer.open({
        type: 1,
        skin: 'layui-layer-rim', //加上边框
        area: ['820px', '340px'], //宽高
        content: $("#div_about").html()
    });
}

function skin(e) {
    console.log($(e).attr('data-val'));
    var dv = $(e).attr('data-val');
    if (dv) {
        var head = document.getElementsByTagName('head')[0];
        var link = document.createElement('link');
        link.href = 'skin/' + dv + '/skin.css';
        link.rel = 'stylesheet';
        link.type = 'text/css';
        head.appendChild(link);
    }
}