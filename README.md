# KUI - 轻量级扁平化响应式 UI 框架

[![npm version](https://img.shields.io/npm/v/kui.svg)](https://www.npmjs.com/package/kui)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](https://github.com/klsstt/kui/blob/master/LICENSE)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()

## 📖 简介

KUI 是一个基于 jQuery 的 UI 组件库，旨在继承 Bootstrap 3 的基础内容并汲取大量开源框架/控件精华，以支持便捷的敏捷开发。**现已升级至 Vite 5 构建系统**，提供更快的开发体验和更现代化的工作流。

### ✨ 特性

- 🎨 **丰富的 UI 组件**：按钮、表单、表格、导航、模态框等基础元素
- 🔌 **集成第三方插件**：zTree、UEditor、ECharts、HCharts 等
- 🎭 **多主题皮肤**：内置 default、blue、green、orange、red、yellow 等多种颜色
- 📱 **响应式设计**：兼容 PC 和移动端
- ⚡ **现代化构建**：使用 Vite 5，支持热更新、代码分割、Tree Shaking
- 🧪 **测试支持**：集成 Vitest 测试框架
- 📦 **模块化输出**：同时支持 ESM 和 CommonJS 格式
- 🔍 **TypeScript 支持**：提供完整的类型定义文件

## 🚀 快速开始

### 安装

```bash
# 通过 npm 安装（推荐）
npm install kui

# 或通过 yarn
yarn add kui

# 或直接克隆仓库
git clone https://github.com/klsstt/kui.git
cd kui
npm install
```

### 开发模式

```bash
# 启动开发服务器（自动打开浏览器）
npm run dev

# 访问 http://localhost:3000
```

### 生产构建

```bash
# 构建生产版本
npm run build

# 监听模式（自动重新编译）
npm run build:watch

# 预览构建结果
npm run preview
```

### 测试

```bash
# 运行测试（监视模式）
npm test

# 运行一次测试
npm run test:run

# 生成测试覆盖率报告
npm run test:coverage

# 打开测试 UI 界面
npm run test:ui
```

### 代码质量

```bash
# 检查代码规范
npm run lint

# 自动格式化代码
npm run format

# 清理构建产物
npm run clean
```

## 📁 目录结构

```
kui/
├── src/                    # 源代码目录
│   ├── js/                 # JavaScript 源文件
│   ├── sass/               # Sass 样式文件
│   ├── css/                # CSS 文件
│   ├── fonts/              # 字体图标
│   ├── lib/                # 第三方库
│   ├── template/           # HTML 模板
│   ├── skin/               # 主题皮肤
│   └── index.html          # 入口页面
├── dist/                   # 构建输出目录
├── test/                   # 测试文件
├── types/                  # TypeScript 类型定义
├── vite.config.js          # Vite 配置文件
├── package.json            # 项目配置
└── README.md               # 项目文档
```

## 💻 浏览器支持

- Chrome >= 87
- Firefox >= 78
- Safari >= 14
- Edge >= 88
- IE11 (需使用 `@vitejs/plugin-legacy` 插件)

## 🛠️ 技术栈

- **核心库**: jQuery
- **构建工具**: Vite 5 + Rollup
- **样式预处理器**: Sass
- **测试框架**: Vitest
- **代码规范**: ESLint + Prettier
- **包管理器**: npm / yarn

## 📦 构建说明

项目已从 Gulp 迁移到 Vite，带来以下优势：

1. **极速启动**：Vite 利用原生 ES 模块，启动速度比 Webpack/Gulp 快 10-100 倍
2. **即时热更新**：修改代码后几乎实时反映到浏览器
3. **开箱即用**：内置 Sass、TypeScript、CSS 模块等支持
4. **优化打包**：使用 Terser 进行代码压缩，支持 Tree Shaking
5. **多页应用**：自动识别多个 HTML 入口文件

## 🔧 迁移指南（从 Gulp 到 Vite）

如果你之前使用 Gulp 版本，升级到 Vite 版本非常简单：

```bash
# 1. 删除旧的 node_modules 和 lock 文件
rm -rf node_modules package-lock.json

# 2. 安装新依赖
npm install

# 3. 启动开发服务器
npm run dev
```

## 📝 API 文档

详细 API 文档请参考 [Wiki](https://github.com/klsstt/kui/wiki) 或查看示例页面。

### 基本使用

```javascript
// 引入 KUI
import 'kui/dist/css/kui.css';
import 'kui';

// 或使用 CDN
// <link rel="stylesheet" href="https://unpkg.com/kui/dist/css/kui.css">
// <script src="https://unpkg.com/kui"></script>
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

```bash
# Fork 项目
git clone https://github.com/YOUR_USERNAME/kui.git

# 创建特性分支
git checkout -b feature/AmazingFeature

# 提交更改
git commit -m "Add some AmazingFeature"

# 推送到分支
git push origin feature/AmazingFeature
```

## 📄 许可证

ISC License - 详见 [LICENSE](LICENSE) 文件

## 👥 作者

- kangbolei

## 🔗 相关链接

- [GitHub 仓库](https://github.com/klsstt/kui)
- [NPM 包](https://www.npmjs.com/package/kui)
- [问题反馈](https://github.com/klsstt/kui/issues)

---

**注意**: 本项目严重依赖 jQuery 生态，适合传统 Web 应用和后台管理系统。如果是新项目，建议考虑使用 Vue/React 等现代框架。
