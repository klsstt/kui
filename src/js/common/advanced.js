/**
 * KUI 高级组件交互
 * 提供 Dropdown、Collapse、Carousel 等组件的 JavaScript 功能
 */

(function($) {
  'use strict';
  
  /* ========================================
   * Dropdown 下拉菜单
   * ======================================== */
  
  function Dropdown(element, options) {
    this.$element = $(element);
    this.options = $.extend({}, Dropdown.DEFAULTS, options);
    this.isOpen = false;
    
    this.init();
  }
  
  Dropdown.DEFAULTS = {
    toggle: true,
    placement: 'bottom'
  };
  
  Dropdown.prototype.init = function() {
    var $this = this.$element;
    var $toggle = $this.find('.dropdown-toggle');
    var $menu = $this.find('.dropdown-menu');
    
    // 点击切换
    $toggle.on('click', $.proxy(this.toggle, this));
    
    // 点击外部关闭
    $(document).on('click.dropdown.data-api', function(e) {
      if (!$(e.target).closest($this).length) {
        this.hide();
      }
    }.bind(this));
    
    // ESC 键关闭
    $(document).on('keydown', function(e) {
      if (e.keyCode === 27 && this.isOpen) {
        this.hide();
        $toggle.focus();
      }
    }.bind(this));
  };
  
  Dropdown.prototype.toggle = function() {
    if (this.isOpen) {
      this.hide();
    } else {
      this.show();
    }
  };
  
  Dropdown.prototype.show = function() {
    if (this.isOpen) return;
    
    var $menu = this.$element.find('.dropdown-menu');
    this.$element.addClass('show');
    $menu.addClass('show');
    this.isOpen = true;
    
    this.$element.trigger('shown.bs.dropdown');
  };
  
  Dropdown.prototype.hide = function() {
    if (!this.isOpen) return;
    
    var $menu = this.$element.find('.dropdown-menu');
    this.$element.removeClass('show');
    $menu.removeClass('show');
    this.isOpen = false;
    
    this.$element.trigger('hidden.bs.dropdown');
  };
  
  // jQuery 插件定义
  $.fn.dropdown = function(option) {
    return this.each(function() {
      var $this = $(this);
      var data = $this.data('bs.dropdown');
      
      if (!data) {
        $this.data('bs.dropdown', new Dropdown(this, typeof option === 'object' && option));
      }
      
      if (typeof option === 'string') {
        data[option]();
      }
    });
  };
  
  // 自动初始化
  $(document).ready(function() {
    $('[data-provide="dropdown"]').dropdown();
  });
  
  /* ========================================
   * Collapse 折叠/手风琴
   * ======================================== */
  
  function Collapse(element, options) {
    this.$element = $(element);
    this.options = $.extend({}, Collapse.DEFAULTS, options);
    this.transitioning = false;
    
    this.init();
  }
  
  Collapse.DEFAULTS = {
    toggle: true,
    parent: null
  };
  
  Collapse.prototype.init = function() {
    var $this = this.$element;
    
    // 查找触发器
    var $triggers = $('[data-toggle="collapse"][href="#' + $this.attr('id') + '"],' +
                      '[data-toggle="collapse"][data-target="#' + $this.attr('id') + '"]');
    
    $triggers.on('click', $.proxy(this.toggle, this));
    
    // 手风琴效果
    if (this.options.parent) {
      var $parent = $(this.options.parent);
      var $siblings = $parent.find('[data-parent="' + this.options.parent + '"]');
      
      $siblings.not($this).each(function() {
        var $sibling = $(this);
        $sibling.removeClass('show');
      });
    }
    
    if (this.options.toggle) {
      this.toggle();
    }
  };
  
  Collapse.prototype.toggle = function() {
    if (this.$element.hasClass('show')) {
      this.hide();
    } else {
      this.show();
    }
  };
  
  Collapse.prototype.show = function() {
    if (this.transitioning || this.$element.hasClass('show')) return;
    
    this.transitioning = true;
    
    this.$element
      .removeClass('collapse')
      .addClass('collapsing')
      .height(0);
    
    // 强制重绘
    this.$element[0].offsetHeight;
    
    var complete = $.proxy(function() {
      this.$element
        .removeClass('collapsing')
        .addClass('collapse show')
        .height('');
      
      this.transitioning = false;
      this.$element.trigger('shown.bs.collapse');
    }, this);
    
    var scrollHeight = this.$element[0].scrollHeight;
    
    setTimeout(function() {
      this.$element.height(scrollHeight);
      
      setTimeout(complete, 300);
    }.bind(this), 10);
  };
  
  Collapse.prototype.hide = function() {
    if (this.transitioning || !this.$element.hasClass('show')) return;
    
    this.transitioning = true;
    
    this.$element
      .height(this.$element.height())[0].offsetHeight;
    
    this.$element
      .addClass('collapsing')
      .removeClass('collapse show')
      .height(0);
    
    var complete = $.proxy(function() {
      this.transitioning = false;
      this.$element
        .removeClass('collapsing')
        .addClass('collapse')
        .trigger('hidden.bs.collapse');
    }, this);
    
    setTimeout(complete, 300);
  };
  
  // jQuery 插件定义
  $.fn.collapse = function(option) {
    return this.each(function() {
      var $this = $(this);
      var data = $this.data('bs.collapse');
      
      if (!data) {
        $this.data('bs.collapse', new Collapse(this, typeof option === 'object' && option));
      }
      
      if (typeof option === 'string') {
        data[option]();
      }
    });
  };
  
  // 自动初始化
  $(document).ready(function() {
    $('[data-toggle="collapse"]').each(function() {
      var $trigger = $(this);
      var target = $trigger.attr('href') || $trigger.attr('data-target');
      var $target = $(target);
      
      if ($target.length && !$target.data('bs.collapse')) {
        $target.collapse({
          parent: $trigger.closest('[data-parent]').attr('data-parent'),
          toggle: false
        });
      }
    });
  });
  
  /* ========================================
   * Carousel 轮播
   * ======================================== */
  
  function Carousel(element, options) {
    this.$element = $(element);
    this.$items = this.$element.find('.carousel-item');
    this.options = $.extend({}, Carousel.DEFAULTS, options);
    this.currentIndex = 0;
    this.interval = null;
    
    this.init();
  }
  
  Carousel.DEFAULTS = {
    interval: 5000,
    pause: 'hover',
    wrap: true,
    keyboard: true
  };
  
  Carousel.prototype.init = function() {
    var $this = this;
    
    // 显示第一个项目
    this.$items.eq(0).addClass('active');
    
    // 控制按钮
    this.$element.find('.carousel-control-prev').on('click', function() {
      $this.prev();
    });
    
    this.$element.find('.carousel-control-next').on('click', function() {
      $this.next();
    });
    
    // 指示器
    this.$element.find('.carousel-indicators li').on('click', function() {
      var index = $(this).index();
      $this.to(index);
    });
    
    // 键盘控制
    if (this.options.keyboard) {
      $(document).on('keydown', function(e) {
        if (e.keyCode === 37) {
          $this.prev();
        } else if (e.keyCode === 39) {
          $this.next();
        }
      });
    }
    
    // 悬停暂停
    if (this.options.pause === 'hover') {
      this.$element
        .on('mouseenter', $.proxy(this.pause, this))
        .on('mouseleave', $.proxy(this.cycle, this));
    }
    
    // 自动播放
    if (this.options.interval) {
      this.cycle();
    }
  };
  
  Carousel.prototype.to = function(index) {
    if (index < 0 || index >= this.$items.length) {
      if (this.options.wrap) {
        index = index < 0 ? this.$items.length - 1 : 0;
      } else {
        return;
      }
    }
    
    var $current = this.$items.eq(this.currentIndex);
    var $next = this.$items.eq(index);
    
    if ($current.hasClass('active')) {
      return;
    }
    
    $current.removeClass('active');
    $next.addClass('active');
    
    // 更新指示器
    var $indicators = this.$element.find('.carousel-indicators li');
    if ($indicators.length) {
      $indicators.removeClass('active').eq(index).addClass('active');
    }
    
    this.currentIndex = index;
    this.$element.trigger('slid.bs.carousel');
  };
  
  Carousel.prototype.next = function() {
    this.to(this.currentIndex + 1);
  };
  
  Carousel.prototype.prev = function() {
    this.to(this.currentIndex - 1);
  };
  
  Carousel.prototype.pause = function() {
    clearInterval(this.interval);
    this.interval = null;
  };
  
  Carousel.prototype.cycle = function() {
    var $this = this;
    
    if (!this.interval) {
      this.interval = setInterval(function() {
        $this.next();
      }, this.options.interval);
    }
  };
  
  // jQuery 插件定义
  $.fn.carousel = function(option) {
    return this.each(function() {
      var $this = $(this);
      var data = $this.data('bs.carousel');
      
      if (!data) {
        $this.data('bs.carousel', new Carousel(this, typeof option === 'object' && option));
      }
      
      if (typeof option === 'string') {
        data[option]();
      }
    });
  };
  
  // 自动初始化
  $(document).ready(function() {
    $('[data-provide="carousel"]').each(function() {
      var $this = $(this);
      $this.carousel({
        interval: $this.data('interval'),
        pause: $this.data('pause'),
        wrap: $this.data('wrap'),
        keyboard: $this.data('keyboard')
      });
    });
  });
  
})(jQuery);
