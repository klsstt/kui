# @kui/style

KUI 的纯 CSS 基础包， 不执行 JavaScript， 可被任意技术栈使用

```bash
npm install @kui/style
```

```ts
import '@kui/styles'
```

根据入口包含的Tokens, Reset, Typography, 可访问行基础，布局原语和工具类，也可以按需导入

- @kui/styles/tokens

@kui/styles/components 是组件样式层，不包含完整基础样式： 可与跟入口组合使用。
@kui/styles/full 包含基础组件与正式图标样式，适配@kui/core使用。 所有正式发布的CSS与Font Awesome 4.7 CSS/字体资源均由本包构建和发布， 不属于Core展示站。

本包只依赖@kui/tokens，仅需token的应用可以直接使用@kui/tokens/css

布局源语包括 container， stack， cluster， grid， split， board， 工具类包括visually-hidden, sr-only, focus-ring与滚动策略。