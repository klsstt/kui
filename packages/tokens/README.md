# @kui/tokens

KUI 设计令牌的框架无关发布包：不包含组件、DOM 初始化器或示例页面。

```bash
npm install @kui/tokens
```

```ts
import { defaultTokens, applyThemeTokens } from '@kui/tokens'

const restore = applyThemeTokens({ seed: { colorBrand: '#0f9d6b' } })
// …业务代码
restore()
```

三种输出在构建时执行一致性校验：

- TypeScript：`@kui/tokens`（`defaultTokens`、`mergeThemeTokens`、`flattenThemeTokens`、`applyThemeTokens`）
- CSS 自定义属性：`@kui/tokens/css`
- JSON：`@kui/tokens/json`

令牌分四层：`seed`（种子）→ `foundation`（基础）→ `semantic`（语义）→ `components`（组件）。换肤只需覆盖种子令牌，语义层与组件层自动跟随。

内置主题：`data-kui-theme="blue" | "green" | "dark"`。

本包不依赖 `@kui/style` 与 `@kui/core`；公共基础组件 CSS 与图标资源归 `@kui/style`，原生 DOM 行为归 `@kui/core`。三者按 `tokens → style → core` 的顺序构建与发布。
