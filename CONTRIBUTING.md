# 贡献指南 / Contributing Guide

感谢你考虑为 KUI 项目做出贡献！

## 🎯 行为准则

请尊重其他贡献者，保持友好、专业的交流氛围。

## 📝 如何贡献

### 1. Fork 项目

```bash
# 点击 GitHub 页面上的 Fork 按钮
git clone https://github.com/YOUR_USERNAME/kui.git
cd kui
```

### 2. 创建分支

```bash
# 始终从 master 分支创建新分支
git checkout master
git pull upstream master

# 创建特性分支
git checkout -b feature/your-feature-name

# 或修复 bug 分支
git checkout -b fix/bug-description
```

### 3. 安装依赖

```bash
npm install
```

### 4. 开发

```bash
# 启动开发服务器
npm run dev

# 编写代码和测试
# 确保代码符合规范
npm run lint
npm run format

# 运行测试
npm test
```

### 5. 提交代码

```bash
# 添加更改的文件
git add .

# 提交代码（使用清晰的提交信息）
git commit -m "feat: 添加新功能"
# 或
git commit -m "fix: 修复某个 bug"

# 推送到远程仓库
git push origin feature/your-feature-name
```

### 6. 创建 Pull Request

- 在 GitHub 上创建 Pull Request
- 清晰描述你的更改内容
- 关联相关的 Issue（如有）

## 📋 代码规范

### JavaScript 规范

- 使用 4 个空格缩进
- 使用单引号 `'`
- 语句末尾加分号 `;`
- 使用 `const` 和 `let`，避免 `var`
- 函数优先使用箭头函数

示例：
```javascript
// ✅ 好的写法
const handleClick = () => {
    console.log('clicked');
};

// ❌ 不好的写法
var handleClick = function() {
    console.log('clicked')
}
```

### 命名规范

- 变量和函数：camelCase（小驼峰）
  ```javascript
  const userName = 'John';
  function getUserInfo() {}
  ```

- 类和构造函数：PascalCase（大驼峰）
  ```javascript
  class UserProfile {}
  ```

- 常量：UPPER_SNAKE_CASE
  ```javascript
  const MAX_COUNT = 100;
  ```

- CSS 类名：kebab-case（短横线）
  ```scss
  .btn-primary { }
  ```

### Sass/CSS 规范

- 使用嵌套结构，但不要超过 3 层
- 使用变量存储颜色和尺寸
- 优先使用 class 选择器

```scss
// ✅ 好的写法
.btn {
    &-primary {
        background-color: $primary-color;
    }
}

// ❌ 不好的写法（嵌套过深）
.page {
    .header {
        .nav {
            .item {
                a { }
            }
        }
    }
}
```

### 提交信息规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构代码
- `test`: 测试相关
- `chore`: 构建/工具配置

示例：
```bash
feat: 添加新的表格组件
fix: 修复模态框无法关闭的问题
docs: 更新 README 安装说明
```

## 🧪 测试要求

- 新功能必须包含测试用例
- 确保所有测试通过：`npm run test:run`
- 测试覆盖率不应下降

## 📚 文档

- 更新代码时同步更新文档
- 提供清晰的示例代码
- 注释要说明"为什么"而不是"是什么"

## 🔍 Code Review

所有 PR 都需要经过 Code Review：

- 代码是否正确、可维护
- 是否有合适的测试
- 是否遵循项目规范
- 性能影响评估

## 🐛 报告 Bug

使用 GitHub Issues 报告 Bug：

1. 搜索是否已存在相同问题
2. 提供详细的复现步骤
3. 附上错误信息和截图
4. 说明环境和版本信息

## 💡 功能建议

欢迎提出新功能建议：

1. 描述功能场景和价值
2. 提供实现思路（可选）
3. 讨论可能的替代方案

## 📧 联系方式

如有问题，请通过以下方式联系：

- GitHub Issues: https://github.com/klsstt/kui/issues
- Email: (如有)

---

再次感谢你的贡献！🎉
