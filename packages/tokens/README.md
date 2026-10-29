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

颜色与明暗互相独立，默认浅色：
```html
<html data-kui-theme="green" data-kui-mode="dark">
```

- 12 个颜色主题： `blue`、`indigo`、`violet`、`purple`、`pink`、`red`、`orange`、`amber`、`green`、`teal`、`cyan`、`slate`。
- 明暗模式：`data-kui-mode="light" | "dark"`。 局部主题请将颜色与模式两个属性设置在同一个容器上。
- 浅色使用较深品牌色，深色使用较亮色阶： 表面、状态色、文字、边框、阴影一起适配。
- 实心状态组件分别使用`--kui-color-on-primary/success/warning/danger/info`:反转文字背景使用 `--kui-color-on-text`,不要把品牌前景色套用到所有背景。
- 默认CSS变量、主题覆盖涉及JSON均由Typescript令牌与`colorPalette`构建生成，避免手写副本飘逸。旧主题仅保留CSS兼容别名，新代码请使用独立模式属性。
内置主题：`data-kui-theme="blue" | "green" | "dark"`。

本包不依赖 `@kui/style` 与 `@kui/core`；公共基础组件 CSS 与图标资源归 `@kui/style`，原生 DOM 行为归 `@kui/core`。三者按 `tokens → style → core` 的顺序构建与发布。
