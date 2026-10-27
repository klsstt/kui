# @kui/core

KUI 的框架无关DOM Controller 包。 它提供强类型组件，CustomEvent, 键盘交互， ARIA 和焦点管理， 不包含 Data API , JQuery wrapper, Admin 或 Demo.

```ts
import {Modal, type ModalProps } from '@kui/core/components/modal'
import '@kui/styles'
import '@kui/styles/components'

const modal = Modal.getOrCreate('#dialog', {
    backdrop: 'static',
} satisfies Partial<ModalProps>)
modal.show()
```

新应用推荐使用组件子路径，Data API 与 JQuery 兼容能力继续由 @kui/modern 显式提供。