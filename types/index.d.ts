/**
 * KUI 框架类型声明文件
 * 为使用 TypeScript 的开发人员提供类型提示
 */

declare module 'kui' {
  // jQuery 扩展
  interface JQuery {
    kuiTab(options?: any): JQuery;
    kuiModal(options?: any): JQuery;
    kuiAlert(options?: any): JQuery;
  }

  // KUI 配置接口
  interface KuiConfig {
    debug?: boolean;
    theme?: string;
    version?: string;
  }

  // 主要 API
  export const Kui: {
    version: string;
    config(config?: KuiConfig): void;
    init(): void;
  };

  export default Kui;
}

// 全局变量声明
declare global {
  interface Window {
    Kui: typeof import('kui').Kui;
    $: any;
    jQuery: any;
    layer: any;
    artTemplate: any;
  }
}

export {};
