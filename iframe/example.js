$(function() {
    $("#div_about").hide();
    var account = $.trim($.kui.util.getUrlParam("account"));
    $.ajax({
        url: '../data/top_menu.json?t=' + new Date().getTime(),
        success: function(obj) {
            if ("string" == typeof obj && obj.indexOf('html') > 0) {
                window.location.href = "login.html";
                return;
            } else {
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
                        logoimg: "../images/logo-while.png",
                        list: obj.data
                    };
                    $.kui.kjax.atemplate('header', 'header', '../header.html', header_data, '#data');
                    //获取首页菜单
                    $.ajax({
                        url: '../data/menu_iframe_' + obj.pid + '.json?t=' + new Date().getTime(),
                        success: function(obj) {
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
    if (null != pid) {
        $('.navbar-left li').removeClass('active');
        $(e).parent().addClass('active');
        $.ajax({
            url: '../data/menu_iframe_' + pid + '.json?t=' + new Date().getTime(),
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

function about() {
    layer.open({
        type: 1,
        skin: 'layui-layer-rim', //加上边框
        area: ['820px', '340px'], //宽高
        content: $("#div_about").html()
    });
}