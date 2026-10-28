# KUI · 现代前端 UI 库

基于 DOM 节点与 Vite 驱动的 HTML5 全端 UI 库。同一套组件与设计令牌，覆盖 **移动端 / PAD / TV / Web** 四类屏幕；不绑定任何框架，原生页面、Vue、React 可以直接取用同一份实现。

- **面向产品与市场**：组件的第一职责是把业务说清楚，而不是展示技巧。
- **统一全局 Token**：颜色、间距、排版、圆角、阴影、层级、动效只有一份真源。
- **统一交互模式**：焦点、键盘、加载、禁用、空状态在全部组件里表现一致。
- **统一代码约定与数据格式**：`Xxx.getOrCreate()` + `data-kui-*` 两套入口，配置即数据。

## 设计价值观

| 价值观 | 含义 |
| --- | --- |
| 清晰 | 信息分组、分层、状态与操作入口必须能被快速觉察；标题、字体、字段和结果各自承担明确角色。 |
| 稳定 | 固定格式元素使用稳定尺寸、样式和策略；合理的空间光效结合动态效果拉高体验。 |
| 克制 | 不过度装饰；圆角、阴影、背景和图标只服务于阅读、定位和操作确认。 |

## 分层

```
@kui/tokens   设计令牌唯一真源（TypeScript / CSS 变量 / JSON 三份输出）
     ↓
@kui/style    基础样式、布局原语、组件样式（Cascade Layers 固定层序）
     ↓
@kui/core     框架无关的 DOM 行为（组件基类、事件、焦点、数据 API）
```

每层只依赖上一层，可以单独使用：只要视觉就引 `@kui/style`，只要行为就引 `@kui/core`。

## 快速开始

```bash
npm install
npm run dev        # 启动文档站（默认 http://localhost:5173）
npm run build:lib  # 构建三个分层包
npm run build:demo # 构建文档站静态产物
npm run verify     # 类型、体积、边界、单测、E2E、可访问性全量校验
```

```ts
import '@kui/tokens/css'
import '@kui/style/components'
import '@kui/style/layout'
import '@kui/style/utilities'
import { Modal, Table } from '@kui/core'

const modal = Modal.getOrCreate('#confirm-dialog', { backdrop: 'static' })
modal.show()

const table = Table.getOrCreate('#orders', {
    columns: [{ field: 'id', title: '订单号', sortable: true }],
    rows: await fetch('/api/orders').then((response) => response.json()),
})
```

也可以只用声明式数据 API：在元素上写 `data-kui-toggle`、`data-kui-table` 等属性，页面加载后调用 `initDataApi()` 即可。

## 全端适配

| 场景 | 策略 |
| --- | --- |
| 移动端 | 移动优先，触控目标 ≥ 32px，列表与表格自动降级为卡片 |
| PAD | `@container` 容器查询，组件跟随所在容器而不是视口 |
| TV | 大字号与高对比度，遥控器方向键可达（roving focus） |
| Web | 鼠标悬停、右键菜单、拖拽排序等桌面级交互 |

## 目录

```
packages/tokens   设计令牌
packages/styles   基础样式与组件样式
packages/core     组件行为
app/admin         文档站（组件分类、示例、可复制源码）
scripts           构建与校验脚本
tests             单元测试与 E2E
```

## 浏览器支持

Chrome / Edge ≥ 111、Firefox ≥ 113、Safari ≥ 16.4（需要 Cascade Layers 与容器查询）。

## 许可

EPL