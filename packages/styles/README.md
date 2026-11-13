# @kuiuni/style

KUI 的纯 CSS 基础包，不执行 JavaScript，可被任意技术栈使用。

```bash
npm install @kuiuni/style
```

```ts
import '@kuiuni/style/components'
import '@kuiuni/style/layout'
import '@kuiuni/style/utilities'
```

按入口分层，可以整包引入也可以按需引入：

| 入口 | 内容 |
| --- | --- |
| `@kuiuni/style/tokens` | 设计令牌（CSS 自定义属性） |
| `@kuiuni/style/reset` | 基础重置 |
| `@kuiuni/style/typography` | 排版基线 |
| `@kuiuni/style/accessibility` | 焦点环、reduced-motion、强制色彩 |
| `@kuiuni/style/layout` | 容器、Stack、Cluster、Grid、Split、Board |
| `@kuiuni/style/utilities` | 少量高频工具类 |
| `@kuiuni/style/components` | 全部组件样式（不含基础样式） |
| `@kuiuni/style/full` | 基础 + 组件 + 字体图标，配合 `@kuiuni/core` 使用 |

样式全部写在固定的 Cascade Layers 中（`kui.tokens → kui.base → kui.components → kui.utilities → kui.overrides`），业务覆盖永远赢过组件默认值，不需要 `!important`。

Font Awesome 4.7 的 CSS 与字体资源随本包一起构建发布。本包只依赖 `@kuiuni/tokens`。
