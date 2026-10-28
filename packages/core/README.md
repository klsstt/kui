# @kui/core

KUI 的框架无关 DOM 行为层。提供强类型组件、CustomEvent、键盘交互、ARIA 与焦点管理，不包含任何视图框架或第三方 UI 依赖。

```ts
import { Modal } from '@kui/core/components/modal'

const modal = Modal.getOrCreate('#dialog', {
    backdrop: 'static',
})
modal.show()
```

- 每个组件都提供 `getOrCreate(target, options)`、`dispose()` 与 `kui:*` 自定义事件。
- 组件子路径按需引入：`@kui/core/components/<name>`。
- 声明式入口：`initDataApi()` 扫描 `data-kui-*` 属性并自动初始化。
- 只有 `@floating-ui/dom` 一个运行时依赖，用于浮层定位。

样式由 `@kui/style` 提供，本包不输出 CSS。
