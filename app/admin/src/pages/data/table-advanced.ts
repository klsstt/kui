import { DataGrid, type DataGridColumn, type DataGridRow } from '@kui/core'
import { trackComponent } from '../../context'
import type { DocPageContext } from '../../docs/types'
import { callout, demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 复杂表格。
 * 24 行模拟数据交给 DataGrid：两级表头、全局搜索、列筛选（用全局搜索替代）、点击排序、
 * 首列左侧锁定、最右操作列右侧锁定，表头全选与展开详情都在组件内部完成。
 * 十七列把表格撑到约 1800px，1440 视口下横向滚动明显；两端锁定列各有 1px 分隔线提示。
 */

const baseRows: DataGridRow[] = [
    { id: 'KUI-241027-01', customer: '杭州青禾贸易', region: '华东', channel: '直营', owner: '林澈', amount: 128600, margin: 18.4, status: '履约中', createdAt: '2026-10-27', settled: '已开票' },
    { id: 'KUI-241027-02', customer: '成都山谷文创', region: '西南', channel: '门店', owner: '周昕', amount: 42800, margin: 22.1, status: '待确认', createdAt: '2026-10-27', settled: '待开票' },
    { id: 'KUI-241026-07', customer: '深圳前海智造', region: '华南', channel: '直营', owner: '苏晚', amount: 386000, margin: 14.8, status: '已完成', createdAt: '2026-10-26', settled: '已回款' },
    { id: 'KUI-241026-05', customer: '南京云顶教育', region: '华东', channel: '分销', owner: '林澈', amount: 72600, margin: 26.3, status: '履约中', createdAt: '2026-10-26', settled: '已开票' },
    { id: 'KUI-241026-03', customer: '武汉江城物流', region: '华中', channel: '分销', owner: '周昕', amount: 214000, margin: 11.2, status: '已取消', createdAt: '2026-10-26', settled: '待开票' },
    { id: 'KUI-241025-11', customer: '苏州吴门丝绸', region: '华东', channel: '门店', owner: '苏晚', amount: 98600, margin: 31.6, status: '已完成', createdAt: '2026-10-25', settled: '已回款' },
    { id: 'KUI-241025-08', customer: '西安长风能源', region: '西北', channel: '直营', owner: '林澈', amount: 512000, margin: 9.4, status: '履约中', createdAt: '2026-10-25', settled: '已开票' },
    { id: 'KUI-241025-02', customer: '青岛海屿食品', region: '华北', channel: '分销', owner: '何晏', amount: 68200, margin: 19.8, status: '待确认', createdAt: '2026-10-25', settled: '待开票' },
    { id: 'KUI-241024-09', customer: '长沙橘洲传媒', region: '华中', channel: '直营', owner: '苏晚', amount: 154800, margin: 17.5, status: '已完成', createdAt: '2026-10-24', settled: '已回款' },
    { id: 'KUI-241024-06', customer: '厦门鹭江航运', region: '华南', channel: '门店', owner: '何晏', amount: 89600, margin: 21.2, status: '履约中', createdAt: '2026-10-24', settled: '已开票' },
    { id: 'KUI-241024-01', customer: '天津渤海精工', region: '华北', channel: '分销', owner: '周昕', amount: 322000, margin: 12.7, status: '履约中', createdAt: '2026-10-24', settled: '待开票' },
    { id: 'KUI-241023-12', customer: '重庆两江数科', region: '西南', channel: '直营', owner: '林澈', amount: 268000, margin: 24.9, status: '已完成', createdAt: '2026-10-23', settled: '已回款' },
    { id: 'KUI-241023-07', customer: '合肥知微仪器', region: '华东', channel: '分销', owner: '苏晚', amount: 46800, margin: 28.4, status: '待确认', createdAt: '2026-10-23', settled: '待开票' },
    { id: 'KUI-241023-03', customer: '沈阳北方重工', region: '东北', channel: '直营', owner: '何晏', amount: 734000, margin: 8.6, status: '已取消', createdAt: '2026-10-23', settled: '待开票' },
    { id: 'KUI-241022-08', customer: '福州闽江水务', region: '华南', channel: '门店', owner: '周昕', amount: 128400, margin: 16.3, status: '履约中', createdAt: '2026-10-22', settled: '已开票' },
    { id: 'KUI-241022-04', customer: '昆明云岭茶业', region: '西南', channel: '分销', owner: '苏晚', amount: 58600, margin: 33.8, status: '已完成', createdAt: '2026-10-22', settled: '已回款' },
    { id: 'KUI-241022-01', customer: '郑州中原铝业', region: '华中', channel: '直营', owner: '林澈', amount: 412000, margin: 10.5, status: '履约中', createdAt: '2026-10-22', settled: '已开票' },
    { id: 'KUI-241021-10', customer: '济南泉城百货', region: '华北', channel: '门店', owner: '何晏', amount: 94600, margin: 20.7, status: '待确认', createdAt: '2026-10-21', settled: '待开票' },
    { id: 'KUI-241021-05', customer: '南昌赣江建材', region: '华东', channel: '分销', owner: '周昕', amount: 178000, margin: 13.9, status: '已完成', createdAt: '2026-10-21', settled: '已回款' },
    { id: 'KUI-241021-02', customer: '兰州丝路物流', region: '西北', channel: '直营', owner: '苏晚', amount: 246000, margin: 15.2, status: '履约中', createdAt: '2026-10-21', settled: '已开票' },
    { id: 'KUI-241020-09', customer: '贵阳黔灵数据', region: '西南', channel: '直营', owner: '何晏', amount: 198000, margin: 27.6, status: '待确认', createdAt: '2026-10-20', settled: '待开票' },
    { id: 'KUI-241020-03', customer: '大连星海装备', region: '东北', channel: '门店', owner: '林澈', amount: 368000, margin: 12.1, status: '已完成', createdAt: '2026-10-20', settled: '已回款' },
    { id: 'KUI-241020-01', customer: '银川贺兰酒庄', region: '西北', channel: '分销', owner: '周昕', amount: 88400, margin: 25.3, status: '履约中', createdAt: '2026-10-20', settled: '已开票' },
    { id: 'KUI-241019-06', customer: '海口椰风旅业', region: '华南', channel: '门店', owner: '苏晚', amount: 136200, margin: 23.8, status: '待确认', createdAt: '2026-10-19', settled: '待开票' },
]

/** 从现有字段派生，避免为了演示锁定列再手写一份重复数据 */
function expectedPay(createdAt: unknown): string {
    const date = new Date(`${String(createdAt)}T00:00:00`)
    date.setDate(date.getDate() + 30)
    return `${date.getMonth() + 1} 月 ${date.getDate()} 日`
}

const rows: DataGridRow[] = baseRows.map((row) => ({
    ...row,
    related: String(row.id).replace(/^KUI-/, 'SO-'),
    tax: Math.round(Number(row.amount) * 1.13),
    expected: row.settled === '已回款' ? '已到账' : expectedPay(row.createdAt),
}))

/** 下面四列不往 rows 里加字段，全部由 formatter 基于现有字段即时派生 */
const warehouseByRegion: Record<string, string> = {
    华东: '上海仓',
    华南: '广州仓',
    华北: '天津仓',
    华中: '武汉仓',
    西南: '成都仓',
    西北: '西安仓',
    东北: '沈阳仓',
}

function warehouseOf(row: DataGridRow): string {
    return `${String(row.region)} · ${warehouseByRegion[String(row.region)] ?? '中心仓'}（主仓）`
}

function trackingOf(row: DataGridRow): string {
    const digits = String(row.id).replace(/\D/g, '')
    return `SF-${digits.slice(0, 8)}-${digits.slice(-2)}-0001`
}

function priorityOf(row: DataGridRow): string {
    if (String(row.status) === '已取消') {
        return '<span class="badge badge-neutral">P4 · 已取消</span>'
    }
    const amount = Number(row.amount)
    if (amount >= 300000) {
        return '<span class="badge badge-danger">P1 · 加急</span>'
    }
    if (amount >= 150000) {
        return '<span class="badge badge-warning">P2 · 优先</span>'
    }
    return '<span class="badge badge-info">P3 · 常规</span>'
}

function remarkOf(row: DataGridRow): string {
    if (String(row.status) === '已取消') {
        return '客户取消，库存待释放'
    }
    if (String(row.settled) === '已回款') {
        return '款项已核销，无需跟进'
    }
    if (String(row.channel) === '直营') {
        return '直营大客户，优先回款'
    }
    if (String(row.channel) === '门店') {
        return '门店自提，出库前复核'
    }
    return '分销订单，开票后回款'
}

const columns: DataGridColumn[] = [
    {
        field: 'order',
        title: '订单信息',
        children: [
            { field: 'id', title: '订单号', width: 172, locked: 'left', filterable: false },
            { field: 'related', title: '关联单号', width: 132, sortable: false },
            { field: 'customer', title: '客户', width: 158, sortable: false, filterable: false },
            { field: 'region', title: '大区', width: 112, filterable: false },
            { field: 'channel', title: '渠道', width: 104, sortable: false, filterable: false },
        ],
    },
    {
        field: 'finance',
        title: '金额与利润',
        children: [
            { field: 'amount', title: '合同金额', width: 128, align: 'right', filterable: false, formatter: (value) => '¥ ' + Number(value).toLocaleString('zh-CN') },
            { field: 'tax', title: '含税金额', width: 128, align: 'right', filterable: false, formatter: (value) => '¥ ' + Number(value).toLocaleString('zh-CN') },
            { field: 'margin', title: '毛利率', width: 88, align: 'right', filterable: false, formatter: (value) => String(value) + '%' },
        ],
    },
    {
        field: 'delivery',
        title: '履约与结算',
        children: [
            { field: 'status', title: '状态', width: 106, sortable: false, filterable: false, formatter: (value) => statusHtml(String(value)) },
            { field: 'owner', title: '负责人', width: 88, sortable: false, filterable: false },
            { field: 'createdAt', title: '下单日期', width: 118, filterable: false },
            { field: 'settled', title: '结算', width: 100, sortable: false, filterable: false, formatter: (value) => settledHtml(String(value)) },
            { field: 'expected', title: '预计回款', width: 112, sortable: false, filterable: false, formatter: (value) => String(value) === '已到账' ? '<span class="badge badge-dot badge-success">已到账</span>' : String(value) },
        ],
    },
    {
        field: 'logistics',
        title: '仓储与物流',
        children: [
            { field: 'warehouse', title: '发货仓', width: 126, sortable: false, filterable: false, formatter: (_value, row) => warehouseOf(row) },
            { field: 'tracking', title: '物流单号', width: 132, sortable: false, filterable: false, formatter: (_value, row) => trackingOf(row) },
            { field: 'priority', title: '优先级', width: 112, sortable: false, filterable: false, formatter: (_value, row) => priorityOf(row) },
            { field: 'remark', title: '备注', width: 168, sortable: false, filterable: false, formatter: (_value, row) => remarkOf(row) },
        ],
    },
]

const compactColumns: DataGridColumn[] = [
    { field: 'id', title: '订单号', width: 162 },
    { field: 'customer', title: '客户', width: 158 },
    { field: 'amount', title: '合同金额', width: 128, align: 'right', formatter: (value) => '¥ ' + Number(value).toLocaleString('zh-CN') },
    { field: 'margin', title: '毛利率', width: 88, align: 'right', formatter: (value) => String(value) + '%' },
    { field: 'status', title: '状态', width: 106, formatter: (value) => statusHtml(String(value)) },
    { field: 'createdAt', title: '下单日期', width: 118 },
]

function statusHtml(label: string): string {
    const tone = label === '已完成' ? 'badge-success' : label === '履约中' ? 'badge-info' : label === '待确认' ? 'badge-warning' : 'badge-neutral'
    return `<span class="badge ${tone}">${label}</span>`
}

function settledHtml(label: string): string {
    const tone = label === '已回款' ? 'badge-success' : label === '已开票' ? 'badge-primary' : 'badge-default'
    return `<span class="badge badge-dot ${tone}">${label}</span>`
}

function renderDetail(row: DataGridRow): string {
    return (
        '<div class="panel-body kui-descriptions">' +
        `<div class="kui-descriptions__item"><dt>关联单号</dt><dd>${String(row.related)}</dd></div>` +
        `<div class="kui-descriptions__item"><dt>客户</dt><dd>${String(row.customer)}</dd></div>` +
        `<div class="kui-descriptions__item"><dt>大区 / 渠道</dt><dd>${String(row.region)} · ${String(row.channel)}</dd></div>` +
        `<div class="kui-descriptions__item"><dt>负责人</dt><dd>${String(row.owner)}</dd></div>` +
        `<div class="kui-descriptions__item"><dt>下单日期</dt><dd>${String(row.createdAt)}</dd></div>` +
        `<div class="kui-descriptions__item"><dt>合同金额 / 含税</dt><dd>¥ ${Number(row.amount).toLocaleString('zh-CN')} · ¥ ${Number(row.tax).toLocaleString('zh-CN')}</dd></div>` +
        `<div class="kui-descriptions__item"><dt>结算进度</dt><dd>${String(row.settled)} · 预计回款 ${String(row.expected)}</dd></div>` +
        `<div class="kui-descriptions__item"><dt>毛利率</dt><dd>${String(row.margin)}%</dd></div>` +
        '</div>'
    )
}

export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '记录超过一屏、字段需要分组、还要边查边筛时，Table 的列模型就不够用了。这一页用 DataGrid 搭一张真实业务表：十七个字段分四组，两级表头、全局搜索、列筛选（用全局搜索替代）、点击排序、首列左锁、最右操作列右锁、表头全选、展开详情、分页与多选一次配齐。表格宽度约 1800px，1440 下必然出现横向滚动；横向滚动时首列订单号与末列操作始终固定，中间字段横向移动。',
    tags: ['DataGrid', '.kui-data-grid', 'DataGridColumn'],
})}

${demo({
    title: '业务订单表：分组表头与双向锁定',
    desc: '24 行模拟数据，十七个字段分四组。除已派生的关联单号、含税金额与预计回款外，再用 formatter 从现有字段生成发货仓、物流单号、优先级与备注，把表格宽度推到约 1800px，1440 下必然横向滚动。横向滚动时首列订单号与末列操作始终固定：订单号 locked: left 吸附左侧，展开按钮所在的「操作」列 locked: right 常驻右侧，中间列横向移动；左侧锁定列右缘与右侧锁定列左缘各有一条 1px 分隔线。客户列不再提供重复的列筛选（用全局搜索替代），全局搜索仍覆盖原有行字段；表头全选、排序、分页与展开详情保持可用。',
    tags: ['columns.children', 'locked: left / right', '横向滚动', 'formatter', 'selectable', 'detail'],
    script: `
const element = document.querySelector<HTMLElement>('[data-tg-grid]')
const grid = DataGrid.getOrCreate(element!, {
    columns,
    rows,
    rowKey: 'id',
    pageSize: 8,
    pageSizes: [8, 12],
    selectable: true,
    expandable: true,
    filterable: false,
    pagination: true,
    striped: true,
    detail: renderDetail,
})
`,
    html: `
<style>
/* 多选列跟着首列一起吸附，订单号不会在滚动开始时先左移 44px */
[data-tg-grid] .kui-data-grid__table thead .kui-data-grid__lead,
[data-tg-grid] .kui-data-grid__table tbody tr:not(.kui-data-grid__detail) > td:first-child {
    position: sticky;
    left: 0;
    z-index: 1;
}
[data-tg-grid] .kui-data-grid__table thead .kui-data-grid__lead {
    z-index: 3;
}
/* 本页只有订单号一列左锁，让它从多选列右侧开始吸附（覆盖组件写入的内联 left: 0） */
[data-tg-grid] .kui-data-grid__table .is-locked {
    left: 44px !important;
}
/* 锁定列提示：只作用于本页这张表，左锁列右缘、右锁列左缘各一条 1px 分隔线 + 轻投影 */
[data-tg-grid] .kui-data-grid__table .is-locked::after,
[data-tg-grid] .kui-data-grid__table .is-locked-right::before {
    width: 1px;
    background: color-mix(in srgb, var(--kui-color-primary) 42%, var(--kui-color-border));
}
[data-tg-grid] .kui-data-grid__table .is-locked::after {
    box-shadow: 3px 0 6px -2px color-mix(in srgb, var(--kui-color-text) 22%, transparent);
}
[data-tg-grid] .kui-data-grid__table .is-locked-right::before {
    box-shadow: -3px 0 6px -2px color-mix(in srgb, var(--kui-color-text) 22%, transparent);
}
</style>
<div data-tg-grid style="--kui-data-grid-max-height: 56rem"></div>`,
})}

${sectionTitle('精简视图', '同一份数据，关掉筛选、多选与展开后就是一张只读的密集表，适合嵌在详情页里做汇总。')}

${demo({
    title: '只读密集视图',
    desc: 'filterable / selectable / expandable 全部关闭，分页关闭后由滚动区承载全部 24 行；没有分组表头，纵向滚动时表头依然稳定吸顶。',
    tags: ['filterable: false', 'pagination: false'],
    html: `<div data-tg-compact></div>`,
})}

${sectionTitle('怎么选', '两者不是替代关系：Table 描述「一列一件事」，DataGrid 描述「一张可以操作的表」。')}

${demo({
    title: 'DataGrid 与 Table 的分工',
    desc: '先看列的复杂度，再看用户是否需要在这张表上完成筛选、对比与批量操作；需要两端锁定时没有第二种选择。',
    stage: 'flush',
    html: `
<table class="table">
    <thead>
        <tr><th>判断维度</th><th>用 DataGrid</th><th>用 Table</th></tr>
    </thead>
    <tbody>
        <tr><td>列规模</td><td>8 列以上，需要两级表头分组</td><td>4–6 列，一列只描述一件事</td></tr>
        <tr><td>横向滚动</td><td>首列锁左、操作列锁右，两端始终可见</td><td>不锁定，靠卡片降级或减少列</td></tr>
        <tr><td>表内交互</td><td>全局搜索、列筛选（用全局搜索替代）、点击排序、批量多选</td><td>排序与分页即可，复杂交互放页面工具栏</td></tr>
        <tr><td>行详情</td><td>展开行，展开按钮固定在最右操作列</td><td>不需要，或跳转到详情页</td></tr>
        <tr><td>窄屏</td><td>保留横向滚动与锁定列</td><td>mobileResponsive 折成卡片</td></tr>
        <tr><td>数据量</td><td>几十到几百行，分页切片</td><td>一屏可读完的最近记录</td></tr>
    </tbody>
</table>`,
})}

${callout('锁定列必须同时给出 <code>width</code>，否则按 120px 计算；左侧锁定列把订单号固定在滚动区左端（本页多选列也一起吸附，所以订单号从 <code>44px</code> 处开始），右侧操作列始终吸附在 <code>right: 0</code>，中间列在滚动区里横向移动。后四列（发货仓、物流单号、优先级、备注）不写入 rows，而是由 <code>formatter(value, row)</code> 从大区、订单号、金额、状态等现有字段派生，把表格撑到约 1800px。页面局部的 <code>&lt;style&gt;</code> 只增强 <code>[data-tg-grid]</code> 内锁定列的分隔线，不修改组件样式。分组表头只生成一行「操作」，列筛选（用全局搜索替代）不包含与全局搜索重复的客户列。表头全选只作用于当前页，跨页选择由 <code>selected</code> 快照维护。')}

${propsTable([
    { name: 'columns', type: 'DataGridColumn[]', desc: '列定义。父级只提供 title 与 children，子级负责 field、width、align、sortable、filterable、formatter。' },
    { name: 'children', type: 'DataGridColumn[]', desc: '两级表头；有 children 的列本身不参与排序，叶子列各自独占一列。' },
    { name: 'locked', type: 'boolean | left | right', defaultValue: '—', desc: 'true 等价于 left；左侧锁定按列顺序累加偏移，right 用于常驻的操作列。' },
    { name: 'width', type: 'number', desc: '锁定列必须给出宽度；普通列的宽度由内容与容器共同决定。' },
    { name: 'rows / rowKey', type: 'DataGridRow[] / string', defaultValue: '[] / id', desc: '行数据与主键字段，多选、展开与全选都以主键为索引。' },
    { name: 'selectable / expandable', type: 'boolean', defaultValue: 'true', desc: '多选列（表头生成当前页全选）与最右展开列。' },
    { name: 'filterable / pagination / striped', type: 'boolean', defaultValue: 'true', desc: '列筛选（用全局搜索替代）行、分页与隔行底色。' },
    { name: 'pageSize / pageSizes', type: 'number / number[]', defaultValue: '8 / [8,12,20,50]', desc: '每页条数与可切换的条数选项。' },
    { name: 'detail', type: '(row: DataGridRow) => string', desc: '展开行返回 HTML；不传时回退为格式化后的行数据。' },
    { name: 'onChange', type: '(state: DataGridState) => void', desc: '排序、筛选、翻页、勾选后的状态快照，含 keyword、sortField、filters 与 selected。' },
    { name: 'emptyText', type: 'string', defaultValue: '没有匹配的数据', desc: '筛选结果为空时的占位文案。' },
    { name: '.is-locked / .is-locked-right', type: 'class', desc: '左侧与右侧锁定列的状态类，由组件按 locked 自动添加；本页用局部样式补了 1px 分隔线与轻投影。' },
    { name: '.is-sorted / .is-selected', type: 'class', desc: '当前排序列与选中行的状态类；排序箭头直接使用库内图标字体。' },
])}

`

    const element = root.querySelector<HTMLElement>('[data-tg-grid]')
    if (element) {
        trackComponent(
            DataGrid.getOrCreate(element, {
                columns,
                rows,
                rowKey: 'id',
                pageSize: 8,
                pageSizes: [8, 12],
                selectable: true,
                expandable: true,
                filterable: false,
                pagination: true,
                striped: true,
                detail: renderDetail,
            }),
        )
    }

    const compact = root.querySelector<HTMLElement>('[data-tg-compact]')
    if (compact) {
        trackComponent(
            DataGrid.getOrCreate(compact, {
                columns: compactColumns,
                rows,
                rowKey: 'id',
                pageSize: 24,
                selectable: false,
                expandable: false,
                filterable: false,
                pagination: false,
                striped: true,
            }),
        )
    }
}
