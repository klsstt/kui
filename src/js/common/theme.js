/**
 * KUI 主题初始化脚本
 * 在页面加载前确定主题，避免闪烁
 */

(function() {
  'use strict';
  
  /**
   * 获取用户偏好主题
   * 优先级：本地存储 > 系统偏好 > 默认亮色
   */
  function getPreferredTheme() {
    // 1. 检查本地存储
    const storedTheme = localStorage.getItem('kui-theme');
    if (storedTheme) {
      return storedTheme;
    }
    
    // 2. 检查系统偏好
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    // 3. 默认亮色主题
    return 'light';
  }
  
  /**
   * 应用主题到 HTML 标签
   */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('kui-theme', theme);
  }
  
  /**
   * 初始化主题
   */
  function initTheme() {
    const theme = getPreferredTheme();
    applyTheme(theme);
    
    // 监听系统主题变化
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('kui-theme')) {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }
  
  // 立即执行，确保在页面渲染前完成
  initTheme();
  
  // 暴露全局 API 供外部调用
  window.KUITheme = {
    get: () => document.documentElement.getAttribute('data-theme'),
    set: (theme) => applyTheme(theme),
    toggle: () => {
      const current = window.KUITheme.get();
      applyTheme(current === 'light' ? 'dark' : 'light');
    }
  };
  
})();
