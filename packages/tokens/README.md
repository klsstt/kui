# @kui/tokens

KUI Design Tokens 无框架发布包， 不包含组件，DOM初始化器或者Demo.

```bash
npm install @kui/tokens
```
```ts
import {defaultTokens, applyThemeTokens } from '@kui/tokens';

const restore = applyThemeTokens({seed: { colorBrand: '#2e9d63'}})
```

纯CSS应用可以导入 ‘@kui/tokens/css’, 构建共聚和设计工具可读取 '@kui/tokens/json'. 三种输出在构建时执行一致性效验。

本包不依赖Styles, Core。 公共基础组件CSS与正是图标资源归属 ‘@kui/styles’模块，原生DOM交互归属'@kui/core'模块，三个产品按照Tokens -> Styles -> Core 的顺序构建和发布。