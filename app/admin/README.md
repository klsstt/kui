# KUI 文档站

KUI 的官网与组件文档：首页是宣传门户（设计价值观、设计细节、组件能力、技术底座），「组件库」下按八个分类组织 46 个组件页面，每个示例都能展开源码并一键复制。

- 开发：`npm run dev`（根目录）
- 构建：`npm run build:demo`
- 预览：`npm run preview`
- 截图走查：`KUI_BROWSER_CHANNEL=msedge node scripts/shot.mjs <pageId>`
- 全页审计：`node scripts/audit-pages.mjs`

## 路由

| 路由 | 内容 |
| --- | --- |
| `#/home` | 宣传首页（默认） |
| `#/design` | 宣传首页的设计语言段落 |
| `#/dashboard` … | 组件文档页（46 个） |
| `?embed=1#/<page>` | 嵌入式渲染，只输出正文，供 iframe 示例使用 |

## 目录

```
src/
├── docs/                  # 路由、导航、外壳、示例框架
├── pages/home.ts          # 宣传首页
├── pages/<group>/<id>.ts  # 组件文档页（八类）
├── data/icons.ts          # 图标清单（脚本生成）
└── styles/site.scss       # 站点样式（docs-* / doc-* / home-*）
```

## 约定

- 该应用是 `private` 的非发布边界，只消费 `@kui/*` 的公开产物，禁止相对引用 `packages/*/src`。
- 站点骨架用 `docs-*` 前缀，页面内容元件用 `doc-*` 前缀，宣传首页用 `home-*` 前缀；都不进入库产物。
- 示例统一通过 `src/docs/ui.ts` 的 `demo()` 产出，预览与源码来自同一份字符串。
- 图片走 `public/images/`（`./images/...`），不在页面里引用外链图片。

产物输出到根目录 `dist-demo/`，不会进入任何 npm 包。
