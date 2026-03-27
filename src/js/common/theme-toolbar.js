/**
 * KUI 主题切换工具栏组件
 * 提供可视化主题切换界面
 */

(function($) {
  'use strict';
  
  /**
   * 主题工具栏类
   */
  class ThemeToolbar {
    constructor(element, options) {
      this.$element = $(element);
      this.options = $.extend({}, ThemeToolbar.DEFAULTS, options);
      this.init();
    }
    
    init() {
      this.render();
      this.bindEvents();
      this.updateState();
    }
    
    render() {
      const html = `
        <div class="kui-theme-toolbar">
          <button type="button" class="kui-theme-btn" data-action="theme-toggle" title="切换主题">
            <i class="fa fa-moon-o"></i>
          </button>
          <button type="button" class="kui-theme-btn" data-action="layout-toggle" title="切换布局">
            <i class="fa fa-columns"></i>
          </button>
          <button type="button" class="kui-theme-btn" data-action="font-increase" title="增大字体">
            <i class="fa fa-font"></i>
          </button>
          <button type="button" class="kui-theme-btn" data-action="font-decrease" title="减小字体">
            <i class="fa fa-font"></i>
          </button>
        </div>
      `;
      
      this.$element.html(html);
    }
    
    bindEvents() {
      this.$element.on('click', '[data-action]', (e) => {
        const action = $(e.currentTarget).data('action');
        this.handleAction(action);
      });
    }
    
    handleAction(action) {
      switch (action) {
        case 'theme-toggle':
          this.toggleTheme();
          break;
        case 'layout-toggle':
          this.toggleLayout();
          break;
        case 'font-increase':
          this.increaseFont();
          break;
        case 'font-decrease':
          this.decreaseFont();
          break;
      }
    }
    
    toggleTheme() {
      const currentTheme = window.KUITheme ? window.KUITheme.get() : 'light';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      
      if (window.KUITheme) {
        window.KUITheme.set(newTheme);
      } else {
        document.documentElement.setAttribute('data-theme', newTheme);
      }
      
      this.updateState();
      
      // 触发自定义事件
      this.$element.trigger('theme:changed', { theme: newTheme });
    }
    
    toggleLayout() {
      const $body = $('body');
      $body.toggleClass('kui-layout-boxed');
      
      const isBoxed = $body.hasClass('kui-layout-boxed');
      this.$element.find('[data-action="layout-toggle"]').toggleClass('active', isBoxed);
      
      // 保存到本地存储
      localStorage.setItem('kui-layout', isBoxed ? 'boxed' : 'fluid');
    }
    
    increaseFont() {
      const currentSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const newSize = Math.min(currentSize + 2, 20);
      document.documentElement.style.fontSize = newSize + 'px';
      localStorage.setItem('kui-font-size', newSize);
    }
    
    decreaseFont() {
      const currentSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const newSize = Math.max(currentSize - 2, 12);
      document.documentElement.style.fontSize = newSize + 'px';
      localStorage.setItem('kui-font-size', newSize);
    }
    
    updateState() {
      const currentTheme = window.KUITheme ? window.KUITheme.get() : 'light';
      const $themeBtn = this.$element.find('[data-action="theme-toggle"]');
      const icon = currentTheme === 'light' ? 'fa-moon-o' : 'fa-sun-o';
      
      $themeBtn.find('i').removeClass('fa-moon-o fa-sun-o').addClass(icon);
    }
    
    destroy() {
      this.$element.off();
      this.$element.empty();
    }
  }
  
  ThemeToolbar.DEFAULTS = {
    // 默认配置
  };
  
  // jQuery 插件
  $.fn.themeToolbar = function(option, ...args) {
    return this.each(function() {
      const $this = $(this);
      let data = $this.data('kui.themeToolbar');
      const options = typeof option === 'object' && option;
      
      if (!data) {
        $this.data('kui.themeToolbar', (data = new ThemeToolbar(this, options)));
      }
      
      if (typeof option === 'string') {
        data[option](...args);
      }
    });
  };
  
  // 自动初始化
  $(document).ready(function() {
    $('[data-provide="theme-toolbar"]').themeToolbar();
  });
  
})(jQuery);
