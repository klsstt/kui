# KUI 快速开始指南

## 🚀 5 分钟快速上手

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

浏览器会自动打开 http://localhost:3000

### 3. 生产构建

```bash
npm run build
```

构建产物在 `dist/` 目录

---

## 📋 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（热更新） |
| `npm run build` | 生产环境构建 |
| `npm run preview` | 预览构建结果 |
| `npm test` | 运行测试 |
| `npm run lint` | 代码检查 |
| `npm run format` | 格式化代码 |
| `npm run clean` | 清理构建产物 |

---

## 🎯 项目结构速览

```
kui/
├── src/           # 源代码
│   ├── js/        # JavaScript
│   ├── sass/      # Sass 样式
│   ├── lib/       # 第三方库
│   └── index.html # 入口页面
├── dist/          # 构建输出
├── test/          # 测试文件
└── types/         # TypeScript 类型定义
```

---

## 💡 开发提示

- **热更新**：修改代码后自动刷新，无需手动重启
- **Sass 支持**：直接在 `.scss` 文件中编写样式
- **jQuery 全局**：`$` 和 `jQuery` 已全局可用
- **调试**：使用 `console.log()` 或浏览器 DevTools

---

## ⚠️ 从 Gulp 版本升级？

如果你之前使用的是 Gulp 版本：

```bash
# 1. 删除旧依赖
rm -rf node_modules package-lock.json

# 2. 重新安装
npm install

# 3. 启动开发服务器
npm run dev
```

**主要变化**：
- ✅ 构建速度提升 10-100 倍
- ✅ 即时热更新（HMR）
- ✅ 更好的代码压缩（Terser）
- ✅ 现代化测试框架（Vitest）

---

详细文档请查看 [README.md](README.md) 和 [CONTRIBUTING.md](CONTRIBUTING.md)
