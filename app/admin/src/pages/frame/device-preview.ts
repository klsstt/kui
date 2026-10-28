import type { DocPageContext } from '../../docs/types'
import { callout, demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 设备预览。
 * 四个外框加载的是同一个真实页面，差异只来自外框宽度：
 * 手机单列、Pad 双列、TV 大字大焦点、桌面多栏。
 */
export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '同一段页面在手机、Pad、TV 与桌面上的表现不应该靠肉眼猜。这一页把真实页面装进四种设备外框，再给出手机与 TV 在信息密度、操作位置与触控目标上的差异对照。',
    tags: ['Device', '.kui-device', 'iframe'],
})}

${demo({
    title: '同一页面的四种外框',
    desc: '四个外框加载同一个地址与同一份内容，宽度分别对应 320 / 520 / 640 / 720；布局差异全部由宽度决定。',
    html: `
<div class="kui-cluster">
<div class="kui-device kui-device--phone">
    <div class="kui-device__screen">
        <iframe src="./index.html?embed=1#/list" title="手机宽度下的列表页"></iframe>
    </div>
    <span class="kui-device__label"><i class="fa fa-mobile" aria-hidden="true"></i> 手机 · 320 × 560</span>
</div>
<div class="kui-device kui-device--pad">
    <div class="kui-device__screen">
        <iframe src="./index.html?embed=1#/list" title="Pad 宽度下的列表页"></iframe>
    </div>
    <span class="kui-device__label"><i class="fa fa-tablet" aria-hidden="true"></i> Pad · 520 × 680</span>
</div>
<div class="kui-device kui-device--tv">
    <div class="kui-device__screen">
        <iframe src="./index.html?embed=1#/list" title="TV 宽度下的列表页"></iframe>
    </div>
    <span class="kui-device__label"><i class="fa fa-television" aria-hidden="true"></i> TV · 640 × 360</span>
</div>
<div class="kui-device kui-device--desktop">
    <div class="kui-device__screen">
        <iframe src="./index.html?embed=1#/list" title="桌面宽度下的列表页"></iframe>
    </div>
    <span class="kui-device__label"><i class="fa fa-desktop" aria-hidden="true"></i> 桌面 · 720 × 440</span>
</div>`,
})}

${demo({
    title: '手机与 TV 并排',
    desc: '两个外框的内容完全相同：手机把操作放在底部拇指可达处，TV 把导航与操作放大，交给遥控器焦点环。',
    stage: 'center',
    tags: ['响应式', '触控目标'],
    html: `
<div class="kui-device kui-device--phone">
    <div class="kui-device__screen">
        <iframe src="./index.html?embed=1#/list" title="手机上的列表页"></iframe>
    </div>
    <span class="kui-device__label"><i class="fa fa-hand-pointer-o" aria-hidden="true"></i> 手机 · 单列 · 底部操作</span>
</div>
<div class="kui-device kui-device--tv">
    <div class="kui-device__screen">
        <iframe src="./index.html?embed=1#/list" title="TV 上的列表页"></iframe>
    </div>
    <span class="kui-device__label"><i class="fa fa-television" aria-hidden="true"></i> TV · 双列 · 焦点驱动</span>
</div>`,
})}

${callout('外框里的页面用 <code>?embed=1</code> 加载：文档站进入嵌入式渲染，只保留正文，不重复渲染顶栏与左侧导航。换页面时改 hash 即可，例如 <code>./index.html?embed=1#/table-basic</code>。')}

${sectionTitle('差异对照', '四类差异决定同一段内容在不同设备上要怎么排：密度、操作位置、字号与触控目标。')}

${demo({
    title: '手机与 TV 的差异',
    desc: '手机是单手触摸、近距阅读；TV 是遥控器操作、三米观看。两者的行数、字号与目标尺寸都要重新取值。',
    tags: ['.kui-device', '44px 触控目标'],
    html: `
<table class="table">
    <thead><tr><th>维度</th><th>手机</th><th>TV</th></tr></thead>
    <tbody>
        <tr><td>信息密度</td><td>一屏 3–5 条，单列纵向排列</td><td>一屏 8–12 条，允许两列并排</td></tr>
        <tr><td>操作位置</td><td>主操作固定在底部，拇指可达</td><td>操作跟随焦点，遥控器方向键可达</td></tr>
        <tr><td>字号</td><td>正文 14px，标题 20px</td><td>正文 20px 起，标题 28px 起</td></tr>
        <tr><td>触控目标</td><td>不小于 44 × 44</td><td>不小于 60 × 60，焦点环 3px</td></tr>
        <tr><td>导航形态</td><td>顶栏 + 底部标签，左栏收进抽屉</td><td>左侧常驻导航，一级菜单不超过 6 项</td></tr>
        <tr><td>反馈方式</td><td>点击涟漪、轻提示</td><td>焦点放大与描边，无悬停态</td></tr>
    </tbody>
</table>`,
})}

${propsTable([
    { name: '.kui-device', type: 'class', defaultValue: '—', desc: '设备外框：18px 圆角、1px 描边、8px 内边距，纵向排列屏幕与标签。' },
    { name: '--kui-device-width / -height', type: 'length', defaultValue: '320px / 560px', desc: '屏幕尺寸变量，由修饰类覆盖，也可以直接写在容器上。' },
    { name: '.kui-device--phone', type: 'class', defaultValue: '—', desc: '320 × 560，24px 圆角，用于验证单列与底部操作。' },
    { name: '.kui-device--pad', type: 'class', defaultValue: '—', desc: '520 × 680，用于验证双列与分栏临界点。' },
    { name: '.kui-device--tv', type: 'class', defaultValue: '—', desc: '640 × 360，8px 圆角，用于验证焦点与字号的放大。' },
    { name: '.kui-device--desktop', type: 'class', defaultValue: '—', desc: '720 × 440，用于验证多栏与侧栏宽度。' },
    { name: '.kui-device__screen', type: 'class', defaultValue: '—', desc: '裁切区，圆角 12px，内部 iframe 撑满 100%。' },
    { name: '.kui-device__content', type: 'class', defaultValue: '—', desc: '无 iframe 时的内容区，声明 <code>container-type: inline-size</code> 供容器查询使用。' },
    { name: 'iframe[src]', type: 'element', defaultValue: '—', desc: '外框内的真实页面，需要 <code>title</code> 与 <code>loading="lazy"</code>。' },
    { name: '?embed=1', type: 'query', defaultValue: '—', desc: '嵌入式渲染开关，只输出正文，供预览容器复用。' },
])}

`
}
