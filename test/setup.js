// 测试环境初始化配置
import { vi } from 'vitest';

// 模拟 jQuery 全局对象
global.$ = global.jQuery = vi.fn();

// 模拟其他全局库（如 layer, artTemplate 等）
global.layer = {
  open: vi.fn(),
  close: vi.fn(),
  msg: {
    alert: vi.fn(),
    confirm: vi.fn()
  }
};

global.artTemplate = vi.fn();

// 清理每次测试后的全局状态
afterEach(() => {
  document.body.innerHTML = '';
  vi.clearAllMocks();
});
