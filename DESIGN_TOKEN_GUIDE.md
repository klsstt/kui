# KUI 设计系统使用指南

> 快速上手 KUI 现代化设计系统，掌握 Design Token、响应式布局和组件使用方法。

---

## 🚀 5 分钟快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

浏览器自动打开 http://localhost:3000

### 3. 访问演示页面

- **主页**: http://localhost:3000/index.html
- **设计系统演示**: http://localhost:3000/design-system.html

---

## 🎨 Design Token 快速上手

### 什么是 Design Token？

Design Token 是设计系统的最小单位，用于存储视觉设计属性（颜色、间距、字体等）。

### 使用示例

#### CSS/SCSS 中使用

```scss
// 引入 Design Token
@import '~kui/src/sass/tokens';

.button {
  // 使用语义化 Token
  color: var(--ds-color-text-primary);
  background-color: var(--ds-color-primary-6);
  padding: var(--ds-spacing-2) var(--ds-spacing-4);
  border-radius: var(--ds-radius-md);
}
```

#### HTML 中使用

```html
<div style="color: var(--ds-color-text-primary);">
  <p style="font-size: var(--ds-font-size-lg);">大标题</p>
  <p style="margin-bottom: var(--ds-spacing-4);">段落内容</p>
  <button class="btn btn-primary">主要按钮</button>
</div>
```

### Token 命名规则

```
--ds-{domain}-{category}-{role}-{state}
```

**示例**:
- `--ds-color-text-primary` - 主文本颜色
- `--ds-color-bg-secondary` - 次要背景色
- `--ds-spacing-4` - 16px 间距
- `--ds-radius-md` - 中等圆角

---

## 📐 响应式布局快速上手

### 容器系统

```html
<!-- 固定宽度容器（响应式） -->
<div class="container">
  <!-- 内容 -->
</div>

<!-- 全宽容器 -->
<div class="container-fluid">
  <!-- 内容 -->
</div>
```

### 网格系统

```html
<div class="row">
  <!-- 三等分 -->
  <div class="col-md-4">列 1</div>
  <div class="col-md-4">列 2</div>
  <div class="col-md-4">列 3</div>
  
  <!-- 响应式列 -->
  <div class="col-xs-12 col-sm-6 col-md-3">响应式列</div>
</div>
```

### Flexbox 工具类

```html
<!-- 水平居中 -->
<div class="d-flex justify-content-center align-items-center">
  <div>居中内容</div>
</div>

<!-- 两端对齐 -->
<div class="d-flex justify-content-between">
  <div>左侧</div>
  <div>右侧</div>
</div>

<!-- 垂直排列 -->
<div class="d-flex flex-column">
  <div>项目 1</div>
  <div>项目 2</div>
</div>
```

### 间距工具类

```html
<!-- Margin -->
<div class="m-3">外边距 12px</div>
<div class="mt-4">上外边距 16px</div>
<div class="mx-auto">水平居中</div>

<!-- Padding -->
<div class="p-4">内边距 16px</div>
<div class="py-5">上下内边距 24px</div>
<div class="px-3">左右内边距 12px</div>
```

---

## 🎯 组件使用指南

### 按钮组件

#### 基础用法

```html
<!-- 默认按钮 -->
<button class="btn btn-default">默认</button>

<!-- 主要按钮 -->
<button class="btn btn-primary">主要</button>

<!-- 成功按钮 -->
<button class="btn btn-success">成功</button>

<!-- 危险按钮 -->
<button class="btn btn-danger">危险</button>
```

#### 轮廓按钮

```html
<button class="btn btn-outline btn-primary">主要轮廓</button>
<button class="btn btn-outline btn-success">成功轮廓</button>
<button class="btn btn-outline btn-danger">危险轮廓</button>
```

#### 尺寸变体

```html
<button class="btn btn-xs">超小</button>
<button class="btn btn-sm">小</button>
<button class="btn btn-md">中</button>
<button class="btn btn-lg">大</button>
<button class="btn btn-xl">超大</button>
```

#### 带图标按钮

```html
<button class="btn btn-primary">
  <i class="fa fa-download"></i>
  下载
</button>

<button class="btn btn-circle btn-primary">
  <i class="fa fa-plus"></i>
</button>
```

#### 加载状态

```html
<button class="btn btn-primary btn-loading">
  加载中...
</button>
```

---

### 空状态组件

#### 基础用法

```html
<div class="kui-empty-state">
  <div class="kui-empty-state__icon">
    <i class="fa fa-inbox"></i>
  </div>
  <h3 class="kui-empty-state__title">暂无数据</h3>
  <p class="kui-empty-state__description">
    当前列表为空，请添加新数据
  </p>
  <div class="kui-empty-state__actions">
    <button class="btn btn-primary">添加数据</button>
  </div>
</div>
```

#### 状态变体

```html
<!-- 成功状态 -->
<div class="kui-empty-state kui-empty-state--success">
  <div class="kui-empty-state__icon">
    <i class="fa fa-check-circle"></i>
  </div>
  <h3>操作成功</h3>
</div>

<!-- 警告状态 -->
<div class="kui-empty-state kui-empty-state--warning">
  <div class="kui-empty-state__icon">
    <i class="fa fa-exclamation-triangle"></i>
  </div>
  <h3>需要注意</h3>
</div>

<!-- 错误状态 -->
<div class="kui-empty-state kui-empty-state--error">
  <div class="kui-empty-state__icon">
    <i class="fa fa-times-circle"></i>
  </div>
  <h3>发生错误</h3>
</div>
```

---

### 加载状态组件

#### Spinner

```html
<!-- 小尺寸 -->
<div class="kui-spinner kui-spinner--sm">
  <div class="kui-spinner-circle"></div>
</div>

<!-- 中尺寸 -->
<div class="kui-spinner kui-spinner--md">
  <div class="kui-spinner-circle"></div>
</div>

<!-- 大尺寸 -->
<div class="kui-spinner kui-spinner--lg">
  <div class="kui-spinner-circle"></div>
</div>
```

#### Skeleton 骨架屏

```html
<div class="kui-skeleton">
  <div class="kui-skeleton__item kui-skeleton__avatar"></div>
  <div class="kui-skeleton__item kui-skeleton__title"></div>
  <div class="kui-skeleton__item kui-skeleton__text"></div>
  <div class="kui-skeleton__item kui-skeleton__text"></div>
</div>
```

#### Progress Bar

```html
<!-- 默认进度条 -->
<div class="kui-progress">
  <div class="kui-progress__bar" style="width: 60%;"></div>
</div>

<!-- 成功状态 -->
<div class="kui-progress kui-progress--success">
  <div class="kui-progress__bar" style="width: 80%;"></div>
</div>

<!-- 条纹动画 -->
<div class="kui-progress kui-progress--striped kui-progress--animated">
  <div class="kui-progress__bar" style="width: 40%;"></div>
</div>
```

---

## 🌙 主题切换

### 自动初始化

主题脚本会在页面加载时自动应用用户偏好：

```javascript
// 优先级：本地存储 > 系统偏好 > 默认亮色
// 无需手动调用，自动执行
```

### 手动控制

```javascript
// 获取当前主题
const currentTheme = window.KUITheme.get();
console.log(currentTheme); // 'light' or 'dark'

// 设置主题
window.KUITheme.set('dark');

// 切换主题
window.KUITheme.toggle();
```

### 使用主题工具栏

```html
<!-- 在 HTML 中添加 -->
<div data-provide="theme-toolbar"></div>

<!-- 引入脚本 -->
<script src="./js/common/theme.js"></script>
<script src="./js/common/theme-toolbar.js"></script>
<script>
  $(document).ready(function() {
    $('[data-provide="theme-toolbar"]').themeToolbar();
  });
</script>
```

---

## 📱 响应式设计最佳实践

### 移动优先

```scss
// ✅ 推荐：从小屏幕开始
.card {
  padding: var(--ds-spacing-3);
  
  @media (min-width: --ds-breakpoint-md) {
    padding: var(--ds-spacing-5);
  }
  
  @media (min-width: --ds-breakpoint-lg) {
    padding: var(--ds-spacing-6);
  }
}
```

### 响应式显示隐藏

```html
<!-- 仅在小屏幕显示 -->
<div class="d-xs-block d-md-none">移动端内容</div>

<!-- 仅在大屏幕显示 -->
<div class="d-none d-lg-block">桌面端内容</div>

<!-- 响应式隐藏 -->
<div class="d-none d-md-block">隐藏于平板及以上</div>
```

### 响应式间距

```html
<!-- 小屏幕间距小，大屏幕间距大 -->
<div class="p-2 p-md-4 p-lg-5">
  响应式内边距
</div>
```

---

## ⚙️ 自定义主题

### 覆盖 Design Token

```scss
// 在 _tokens.scss 之后覆盖
:root {
  --ds-color-primary-6: #your-color;
  --ds-radius-md: 12px;
  --ds-font-family: 'Your Font', sans-serif;
}
```

### 创建自定义主题

```scss
[data-theme='custom'] {
  --ds-color-primary-1: #xxx;
  --ds-color-primary-6: #xxx;
  // ... 其他变量
}
```

---

## 🎯 常见问题

### Q: 如何选择合适的 Token？

**A**: 优先使用语义化 Token，其次才是 Primitive Token。

```scss
// ✅ 推荐
color: var(--ds-color-text-primary);

// ⚠️ 可以接受
color: var(--ds-color-neutral-9);

// ❌ 不推荐
color: #333;
```

### Q: 响应式断点如何选择？

**A**: 根据内容决定，而非设备。

```scss
@media (min-width: --ds-breakpoint-sm) { /* >= 576px */ }
@media (min-width: --ds-breakpoint-md) { /* >= 768px */ }
@media (min-width: --ds-breakpoint-lg) { /* >= 992px */ }
```

### Q: 如何调试 Design Token？

**A**: 使用浏览器开发者工具查看 CSS 变量。

```javascript
// 在控制台查看所有 Token
getComputedStyle(document.documentElement)
  .getPropertyValue('--ds-color-primary-6')
```

---

## 📚 进阶阅读

- [DESIGN.md](DESIGN.md) - 完整设计规范
- [IMPLEMENTATION_PROGRESS.md](IMPLEMENTATION_PROGRESS.md) - 实施进度
- [DESIGN_SYSTEM_REPORT.md](DESIGN_SYSTEM_REPORT.md) - 技术报告
- [CHANGELOG.md](CHANGELOG.md) - 版本历史

---

## 💡 提示与技巧

### 1. 使用 CSS Grid 简化布局

```scss
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--ds-spacing-5);
}
```

### 2. 快速居中

```scss
.center {
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### 3. 文本截断

```scss
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

### 4. 毛玻璃效果

```scss
.glass {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
}
```

---

**最后更新**: 2024-03-26  
**版本**: v2.0.0-alpha.1  
**作者**: KUI Team
