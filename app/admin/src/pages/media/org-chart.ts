import { OrgChart } from '@kui/core'
import type { OrgNode } from '@kui/core'
import { trackComponent } from '../../context'
import type { DocPageContext } from '../../docs/types'
import { callout, demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 组织关系。
 * 一份 JSON 描述层级与岗位，组件负责排布与连线：节点卡片只承载「谁、做什么」，
 * 点击后的上下文交给旁边的详情面板。带子节点的节点块本身就是折叠开关。
 */
export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '组织关系把「谁向谁汇报」画成可读的结构。KUI 用一份 JSON 描述三级以内的层级，竖向与横向共用同一批节点；节点只显示姓名与岗位，点击后右侧再展开上下文，避免卡片本身变成信息墙。头像支持姓名首字、Font Awesome 图标与本地图片三种来源。',
    tags: ['OrgChart', '.kui-org-chart', 'image', 'direction'],
})}

${sectionTitle('竖向组织图', '一级主干、二级职能、三级执行。连接线由 SVG 正交路径绘制：从父块底部中点到子块顶部中点，折叠或尺寸变化时自动重绘；点击节点块折叠或展开子级，右侧同步显示该节点的详情。')}

${demo({
    title: '三层架构与详情',
    desc: '节点块上有子节点时出现 chevron，点击整块折叠 / 展开；叶子节点只切换右侧详情。沈亦舟用本地图片头像，韩珂用 FA 图标，林澈回落到姓名首字，三种来源都在这张图里。方向、全部收起与全部展开都是实例方法。',
    tags: ['items', 'image + avatar', 'setDirection', 'toggleAll'],
    script: `
const team = JSON.parse(document.querySelector('[data-org-chart-data="team"]').textContent)

const chart = OrgChart.getOrCreate('[data-org-chart-main]', {
    items: team,
    direction: 'vertical',
    onSelect: (node) => {
        document.querySelector('[data-org-chart-detail]').innerHTML =
            '<div class="kui-descriptions__item"><dt>姓名</dt><dd>' + node.name + '</dd></div>' +
            '<div class="kui-descriptions__item"><dt>岗位</dt><dd>' + (node.title || '—') + '</dd></div>'
    },
})

const toolbar = document.querySelector('[data-org-chart-toolbar]')
toolbar.addEventListener('click', (event) => {
    const button = event.target.closest('button')
    if (!button) return
    if (button.dataset.orgChartCollapse !== undefined) chart.toggleAll(true)
    if (button.dataset.orgChartExpand !== undefined) chart.toggleAll(false)
    if (button.dataset.orgChartDirection) chart.setDirection(button.dataset.orgChartDirection)
})
`,
    html: `
<div class="kui-stack">
    <div class="kui-toolbar" data-org-chart-toolbar>
        <div class="kui-toolbar__group">
            <div class="kui-segmented" role="group" aria-label="排列方向">
                <button type="button" class="is-active" data-org-chart-direction="vertical">竖向</button>
                <button type="button" data-org-chart-direction="horizontal">横向</button>
            </div>
            <span class="form-hint">头像：图片 / 图标 / 首字</span>
        </div>
        <div class="kui-toolbar__group">
            <button type="button" class="btn btn-default btn-sm" data-org-chart-collapse><i class="fa fa-compress" aria-hidden="true"></i> 全部收起</button>
            <button type="button" class="btn btn-default btn-sm" data-org-chart-expand><i class="fa fa-expand" aria-hidden="true"></i> 全部展开</button>
        </div>
    </div>
    <div class="kui-split kui-split--main-first" style="--kui-split-sidebar: 13rem">
        <div class="kui-org-chart" data-org-chart-main data-kui-org-chart></div>
        <aside class="panel">
            <div class="panel-heading"><h3 class="panel-title">节点详情</h3></div>
            <div class="panel-body"><dl class="kui-descriptions" data-org-chart-detail></dl></div>
        </aside>
    </div>
    <script type="application/json" data-org-chart-data="team">
        [{
            "id": "ceo", "name": "沈亦舟", "title": "首席执行官", "tone": "primary", "image": "./images/portraits/7.jpg", "avatar": "fa fa-compass",
            "children": [
                { "id": "tech", "name": "韩珂", "title": "技术负责人", "tone": "success", "avatar": "fa fa-code", "children": [
                    { "id": "tech-fe", "name": "顾栖", "title": "前端负责人" },
                    { "id": "tech-be", "name": "陆鸣", "title": "后端负责人" }
                ]},
                { "id": "product", "name": "林澈", "title": "产品负责人", "tone": "success", "children": [
                    { "id": "design", "name": "白榆", "title": "设计负责人" }
                ]},
                { "id": "operation", "name": "周昕", "title": "运营负责人", "tone": "warning", "avatar": "fa fa-bullhorn", "children": [
                    { "id": "content", "name": "陈默", "title": "内容运营" }
                ]}
            ]
        }]
    </script>
</div>`,
})}

${sectionTitle('横向组织图', '同一份结构换成缩进树：子级向右展开，适合嵌在窄侧栏或分屏里，超出宽度时在容器内部滚动。横向的 SVG 连线从父块右侧中点出发，落到子块左侧中点；竖向则是底部中点到顶部中点。')}

${demo({
    title: '横向阅读',
    desc: '横向方向把子级排到父级右侧，用左侧导轨表达归属；节点仍然可以折叠，状态行显示被选中节点的岗位与直属组数。内容中台使用本地图片头像，编辑组使用 FA 图标，其余节点回落到首字。',
    tags: [`direction: 'horizontal'`, 'image + avatar', 'SVG 连线'],
    script: `
const content = JSON.parse(document.querySelector('[data-org-chart-data="content"]').textContent)

OrgChart.getOrCreate('[data-org-chart-horizontal]', {
    items: content,
    direction: 'horizontal',
    onSelect: (node) => {
        document.querySelector('[data-org-chart-horizontal-status]').textContent =
            node.name + ' · ' + (node.title || '—') + ' · 直属 ' + (node.children ? node.children.length : 0) + ' 个'
    },
})
`,
    html: `
<div class="kui-stack">
    <div class="kui-org-chart" data-org-chart-horizontal data-kui-org-chart></div>
    <p class="form-hint" data-org-chart-horizontal-status>点击节点查看岗位与直属组数；连线从父块右侧中点连到子块左侧中点。</p>
    <script type="application/json" data-org-chart-data="content">
        [{
            "id": "content-lead", "name": "内容中台", "title": "负责人 温言", "tone": "primary", "image": "./images/portraits/1.jpg",
            "children": [
                { "id": "editorial", "name": "编辑组", "title": "6 人 · 3 个栏目", "avatar": "fa fa-book", "children": [
                    { "id": "city", "name": "城市栏目", "title": "2 人" },
                    { "id": "design", "name": "设计栏目", "title": "2 人" }
                ]},
                { "id": "video", "name": "视频组", "title": "4 人 · 每周 2 条", "avatar": "fa fa-video-camera", "children": [
                    { "id": "shoot", "name": "拍摄", "title": "2 人" },
                    { "id": "edit", "name": "剪辑", "title": "2 人" }
                ]},
                { "id": "community", "name": "社区组", "title": "3 人 · 日更", "avatar": "fa fa-comments" }
            ]
        }]
    </script>
</div>`,
})}

${sectionTitle('层级与状态', '左侧色条由层级决定（一级最重、三级最轻），tone 只表达节点自身的状态，不参与排序。')}

${demo({
    title: '职能色调',
    desc: '同一层里用成功、警告、危险三种语气标出人数与扩编情况；颜色只做提示，节点顺序仍由 JSON 决定。',
    tags: ['tone', 'avatar'],
    script: `
const health = JSON.parse(document.querySelector('[data-org-chart-data="health"]').textContent)

OrgChart.getOrCreate('[data-org-chart-health]', {
    items: health,
    direction: 'vertical',
})
`,
    html: `
<div class="kui-org-chart" data-org-chart-health data-kui-org-chart></div>
<script type="application/json" data-org-chart-data="health">
    [{
        "id": "experience", "name": "体验中心", "title": "负责人 白榆", "tone": "primary", "avatar": "fa fa-paint-brush",
        "children": [
            { "id": "brand", "name": "品牌组", "title": "4 人 · 正常", "tone": "success", "avatar": "fa fa-tag" },
            { "id": "product", "name": "产品组", "title": "5 人 · 正常", "tone": "success", "avatar": "fa fa-cube" },
            { "id": "review", "name": "走查组", "title": "2 人 · 缺编", "tone": "danger", "avatar": "fa fa-eye" },
            { "id": "research", "name": "研究组", "title": "3 人 · 扩编中", "tone": "warning", "avatar": "fa fa-users" }
        ]
    }]
</script>`,
})}

${propsTable([
    { name: 'items', type: 'OrgNode[]', desc: '<code>id / name / title / avatar / image / tone / children</code> 七个字段，层级由 children 表达。' },
    { name: 'direction', type: `'vertical' | 'horizontal'`, defaultValue: `'vertical'`, desc: '竖向为居中树，横向为缩进树；窄容器优先横向。' },
    { name: 'tone', type: `'default' | 'primary' | 'success' | 'warning' | 'danger'`, defaultValue: `'default'`, desc: '节点底色与描边，只表达状态，不表达层级顺序。' },
    { name: 'image', type: 'string', desc: '头像图片地址，优先于 <code>avatar</code> 图标；支持 <code>./images/portraits/*.jpg</code> 这类本地资源。' },
    { name: 'avatar', type: 'string', desc: '图标 class，例如 <code>fa fa-code</code>；<code>image</code> 与 <code>avatar</code> 都不传时取姓名首字。' },
    { name: 'onSelect', type: '(node) => void', desc: '点击节点回调，折叠与选中都会触发，参数是被点的节点。' },
    { name: 'setItems(items)', type: 'method', desc: '整份数据替换并重新渲染。' },
    { name: 'setDirection(direction)', type: 'method', desc: '切换横竖排布，不重建实例；SVG 连接线随方向重绘。' },
    { name: 'toggleAll(collapsed)', type: 'method', desc: '一键收起或展开全部带子节点的节点。' },
    { name: 'kui:org-chart:select', type: 'event', desc: '节点点击事件，<code>detail.payload.node</code> 为被点击的节点。' },
    { name: '节点点击', type: 'interaction', desc: '带子节点的节点块本身就是折叠开关：点击折叠 / 展开并派发选中；叶子节点只派发选中。' },
    { name: '.kui-org-chart__node / __chevron', type: 'class', desc: '节点块与块内的展开指示箭头；收起时箭头旋转 90 度。' },
    { name: '.kui-org-chart__lines', type: 'class', desc: '覆盖在节点层下方的 SVG 正交连接线；折叠、方向切换、容器尺寸变化都会自动重绘。' },
    { name: 'data-org-level', type: 'attribute', desc: '渲染时写在节点项上，一级 / 二级 / 三级对应由重到轻的左侧色条。' },
])}

${callout('连接线统一由 <code>.kui-org-chart__lines</code> 里的 SVG 绘制：竖向从父块底部中点到子块顶部中点，横向从父块右侧中点到子块左侧中点，旧的伪元素线已隐藏。节点头像按 <code>image → avatar → 姓名首字</code> 的顺序取第一个可用的来源。')}

`

    const readData = (name: string): OrgNode[] => {
        const source = root.querySelector<HTMLScriptElement>(`[data-org-chart-data="${name}"]`)
        try {
            return source?.textContent ? (JSON.parse(source.textContent) as OrgNode[]) : []
        } catch {
            return []
        }
    }

    const collectLevels = (nodes: OrgNode[], depth = 1, levels = new Map<string, number>()): Map<string, number> => {
        nodes.forEach((node) => {
            levels.set(node.id, depth)
            if (node.children?.length) {
                collectLevels(node.children, depth + 1, levels)
            }
        })
        return levels
    }

    const team = readData('team')
    const chartElement = root.querySelector<HTMLElement>('[data-org-chart-main]')
    if (chartElement && team.length) {
        const levels = collectLevels(team)
        const detail = root.querySelector<HTMLElement>('[data-org-chart-detail]')

        const describe = (node: OrgNode): void => {
            if (!detail) {
                return
            }
            const avatar = node.image
                ? `<img src="${node.image}" alt="" style="width: 26px; height: 26px; border-radius: 999px; object-fit: cover;">`
                : node.avatar
                    ? `<i class="${node.avatar}" aria-hidden="true"></i>`
                    : node.name.slice(0, 1)
            const avatarSource = node.image ? '本地图片' : node.avatar ? 'FA 图标' : '姓名首字'
            detail.innerHTML = `
                <div class="kui-descriptions__item"><dt>姓名</dt><dd>${node.name}</dd></div>
                <div class="kui-descriptions__item"><dt>岗位</dt><dd>${node.title ?? '—'}</dd></div>
                <div class="kui-descriptions__item"><dt>头像</dt><dd>${avatar}</dd></div>
                <div class="kui-descriptions__item"><dt>头像来源</dt><dd>${avatarSource}</dd></div>
                <div class="kui-descriptions__item"><dt>所在层级</dt><dd>第 ${levels.get(node.id) ?? 1} 层</dd></div>
                <div class="kui-descriptions__item"><dt>直属下级</dt><dd>${node.children?.length ?? 0} 人</dd></div>
                <div class="kui-descriptions__item"><dt>节点 id</dt><dd>${node.id}</dd></div>
            `
        }

        const instance = OrgChart.getOrCreate(chartElement, {
            items: team,
            direction: 'vertical',
            onSelect: describe,
        })
        trackComponent(instance)
        describe(team[0])

        const directions = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-org-chart-direction]'))
        directions.forEach((button) => {
            button.addEventListener('click', () => {
                instance.setDirection(button.dataset.orgChartDirection === 'horizontal' ? 'horizontal' : 'vertical')
                directions.forEach((item) => item.classList.toggle('is-active', item === button))
            })
        })

        root.querySelector<HTMLElement>('[data-org-chart-collapse]')?.addEventListener('click', () => instance.toggleAll(true))
        root.querySelector<HTMLElement>('[data-org-chart-expand]')?.addEventListener('click', () => instance.toggleAll(false))
    }

    const horizontalElement = root.querySelector<HTMLElement>('[data-org-chart-horizontal]')
    const content = readData('content')
    if (horizontalElement && content.length) {
        const status = root.querySelector<HTMLElement>('[data-org-chart-horizontal-status]')
        trackComponent(
            OrgChart.getOrCreate(horizontalElement, {
                items: content,
                direction: 'horizontal',
                onSelect: (node) => {
                    if (status) {
                        status.textContent = `${node.name} · ${node.title ?? '—'} · 直属 ${node.children?.length ?? 0} 个`
                    }
                },
            }),
        )
    }

    const healthElement = root.querySelector<HTMLElement>('[data-org-chart-health]')
    const health = readData('health')
    if (healthElement && health.length) {
        trackComponent(OrgChart.getOrCreate(healthElement, { items: health, direction: 'vertical' }))
    }
}
