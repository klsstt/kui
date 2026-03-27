import { describe, it, expect } from 'vitest';

describe('KUI 基础测试', () => {
  it('应该能够正确加载', () => {
    expect(1).toBe(1);
  });

  it('jQuery 应该可用', () => {
    // 这里可以测试 jQuery 相关功能
    expect(typeof global.$).toBe('function');
  });
});
