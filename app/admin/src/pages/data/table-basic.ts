import { DataGrid, Table, type DataGridColumn, type TableColumn, type TableRow } from '@kui/core'
import { trackComponent } from '../../context'
import type { DocPageContext } from '../../docs/types'
import { callout, demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 基础表格。
 * 一屏能读完的订单用 DataGrid 打开斑马纹、排序与右侧锁定操作列；
 * 需要窄屏折成卡片时换回 Table，由 mobileResponsive 一个开关完成，不另写移动端模板。
 */

const orderRows: TableRow[] = [
    { id: 'KUI-241027-01', customer: '杭州青禾贸易', channel: '直营小程序', amount: 12860, status: '已完成', createdAt: '2026-10-27 09:12', owner: '林澈', address: '浙江省杭州市余杭区文一西路 969 号', note: '发票随货寄出' },
    { id: 'KUI-241027-02', customer: '成都山谷文创', channel: '门店自提', amount: 4280, status: '待发货', createdAt: '2026-10-27 10:24', owner: '周昕', address: '四川省成都市武侯区天府三街 88 号', note: '客户要求周末送达' },
    { id: 'KUI-241026-07', customer: '深圳前海智造', channel: '分销渠道', amount: 38600, status: '已完成', createdAt: '2026-10-26 16:48', owner: '苏晚', address: '广东省深圳市南山区科苑南路 3099 号', note: '年度框架协议第 4 单' },
    { id: 'KUI-241026-05', customer: '南京云顶教育', channel: '直营网店', amount: 7260, status: '待付款', createdAt: '2026-10-26 14:02', owner: '林澈', address: '江苏省南京市鼓楼区中山北路 12 号', note: '等待财务确认额度' },
    { id: 'KUI-241026-03', customer: '武汉江城物流', channel: '分销渠道', amount: 21400, status: '已退款', createdAt: '2026-10-26 09:35', owner: '周昕', address: '湖北省武汉市江汉区解放大道 688 号', note: '重复下单，已原路退回' },
    { id: 'KUI-241025-11', customer: '苏州吴门丝绸', channel: '门店自提', amount: 9860, status: '已完成', createdAt: '2026-10-25 18:40', owner: '苏晚', address: '江苏省苏州市姑苏区干将东路 178 号', note: '附赠样册一份' },
    { id: 'KUI-241025-08', customer: '西安长风能源', channel: '直营网店', amount: 51200, status: '待发货', createdAt: '2026-10-25 11:08', owner: '林澈', address: '陕西省西安市雁塔区锦业路 1 号', note: '分两批出库' },
    { id: 'KUI-241024-02', customer: '青岛海屿食品', channel: '分销渠道', amount: 6820, status: '待付款', createdAt: '2026-10-24 15:26', owner: '何晏', address: '山东省青岛市市南区香港中路 36 号', note: '需要冷链配送' },
]

const statusTone = (label: string): string =>
    label === '已完成' ? 'badge-success' : label === '待付款' || label === '待发货' ? 'badge-warning' : 'badge-neutral'

const statusHtml = (label: string): string => `<span class="badge ${statusTone(label)}">${label}</span>`

function statusBadge(label: string): HTMLElement {
    const badge = document.createElement('span')
    badge.className = `badge ${statusTone(label)}`
    badge.textContent = label
    return badge
}

function actionHtml(id: string): string {
    return (
        `<button type="button" class="btn btn-ghost btn-xs" data-tb-done="${id}" aria-label="将订单 ${id} 标记为已完成"><i class="fa fa-check" aria-hidden="true"></i></button>` +
        `<button type="button" class="btn btn-ghost btn-xs" data-tb-remove="${id}" aria-label="删除订单 ${id}"><i class="fa fa-times" aria-hidden="true"></i></button>`
    )
}

function actionCell(id: string): HTMLElement {
    const cell = document.createElement('span')
    cell.className = 'kui-cluster'
    cell.innerHTML = actionHtml(id)
    return cell
}

const gridColumns: DataGridColumn[] = [
    { field: 'id', title: '订单号', width: 166, sortable: true },
    { field: 'customer', title: '客户', width: 152, sortable: false },
    { field: 'channel', title: '渠道', width: 104, sortable: false },
    { field: 'amount', title: '金额', width: 118, align: 'right', sortable: true, formatter: (value) => '¥ ' + Number(value).toLocaleString('zh-CN') },
    { field: 'status', title: '状态', width: 104, sortable: false, formatter: (value) => statusHtml(String(value)) },
    { field: 'owner', title: '负责人', width: 92, sortable: false },
    { field: 'createdAt', title: '下单时间', width: 148, sortable: true },
    { field: 'address', title: '收货地址', sortable: false },
    { field: 'note', title: '备注', sortable: false },
    { field: 'actions', title: '操作', width: 92, locked: 'right', sortable: false, filterable: false, formatter: (_value, row) => `<span class="kui-cluster">${actionHtml(String(row.id))}</span>` },
]

const tableColumns: TableColumn[] = [
    { field: 'id', title: '订单号', sortable: true },
    { field: 'customer', title: '客户' },
    { field: 'amount', title: '金额', align: 'right', sortable: true, formatter: (value) => '¥ ' + Number(value).toLocaleString('zh-CN') },
    { field: 'status', title: '状态', formatter: (value) => statusBadge(String(value)) },
    { field: 'createdAt', title: '下单时间', sortable: true },
    { field: 'actions', title: '操作', formatter: (_value, row) => actionCell(String(row.id)) },
]

const narrowColumns: TableColumn[] = [
    { field: 'id', title: '订单号' },
    { field: 'customer', title: '客户' },
    { field: 'amount', title: '金额', formatter: (value) => '¥ ' + Number(value).toLocaleString('zh-CN') },
    { field: 'status', title: '状态', formatter: (value) => statusBadge(String(value)) },
    { field: 'actions', title: '操作', formatter: (_value, row) => actionCell(String(row.id)) },
]

export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '基础表格解决「把一组结构相同的记录读完」这件事。列定义、数据与排序状态都收敛在 options 里：桌面端固定操作列，窄屏时同一份数据折成卡片，不需要另写一套移动端结构。',
    tags: ['Table', 'DataGrid', '.kui-table', '.kui-data-grid'],
})}

${demo({
    title: '订单表：斑马纹、排序与行内操作',
    desc: '偶数行加一层浅底，点击订单号、金额或时间可在升序 / 降序之间切换；操作列固定在右侧，横向滚动时始终可见，两个图标按钮都带完整的 aria-label。',
    tags: ['striped', 'locked: right', 'sortable', 'formatter'],
    script: `
const gridElement = document.querySelector<HTMLElement>('[data-tb-orders]')
let rows = orderRows

const grid = DataGrid.getOrCreate(gridElement!, {
    columns: gridColumns,
    rows,
    rowKey: 'id',
    pageSize: 8,
    selectable: false,
    expandable: false,
    filterable: false,
    pagination: false,
    striped: true,
})

gridElement?.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null

    const done = target?.closest<HTMLElement>('[data-tb-done]')
    if (done?.dataset.tbDone) {
        rows = rows.map((row) => row.id === done.dataset.tbDone ? { ...row, status: '已完成' } : row)
        grid.setRows(rows)
        return
    }

    const remove = target?.closest<HTMLElement>('[data-tb-remove]')
    if (remove?.dataset.tbRemove) {
        rows = rows.filter((row) => row.id !== remove.dataset.tbRemove)
        grid.setRows(rows)
    }
})
`,
    html: `<div data-tb-orders></div>`,
})}

${sectionTitle('窄屏与分页', '记录读不完时先分页，屏幕变窄时把一行折成一张卡片；两种降级都来自同一份列定义。')}

${demo({
    title: '窄屏卡片降级',
    desc: '卡片的字段名直接来自列定义，首列「订单号」带底色并作为卡片标题；操作列单元格里是 .kui-cluster，按钮独占一行、不换行挤压。预览区用 cardView 固定成卡片形态，方便在桌面端检查每一行是否读得完整。',
    tags: ['mobileResponsive', 'cardView', '.kui-cluster', '.kui-table--responsive'],
    stage: 'tinted',
    html: `
<style>
/* 卡片预览在桌面端也保持首列标题底色，与窄屏降级保持一致 */
[data-tb-narrow] td:first-child {
    background: var(--kui-color-surface-muted);
    font-weight: 600;
}
</style>
<div class="kui-grid kui-grid--lg">
    <div class="kui-stack kui-stack--tight">
        <p class="form-hint">容器压到 24rem 模拟手机宽度，字段名直接取自列定义。</p>
        <div class="kui-max-w-md">
            <table class="table" data-tb-narrow></table>
        </div>
    </div>
    <section class="panel">
        <div class="panel-heading"><h3 class="panel-title">卡片化保留三件事</h3></div>
        <div class="panel-body">
            <ul class="kui-list kui-list--flush">
                <li class="kui-list__item"><span class="kui-list__body"><span class="kui-list__title">定位信息</span><span class="kui-list__meta">订单号与客户放在最前，扫一眼就知道是哪一单</span></span></li>
                <li class="kui-list__item"><span class="kui-list__body"><span class="kui-list__title">状态与金额</span><span class="kui-list__meta">决定是否继续处理的两个字段必须可见</span></span></li>
                <li class="kui-list__item"><span class="kui-list__body"><span class="kui-list__title">操作入口</span><span class="kui-list__meta">按钮放在 .kui-cluster 中，窄屏另起一行且不换行挤压</span></span></li>
            </ul>
        </div>
    </section>
</div>`,
})}

${demo({
    title: '分页与空数据',
    desc: '上面的表按每页 4 条分页，下面的表没有记录时给出 emptyText；两者都开启 mobileResponsive，窄屏时与示例卡片一样折成字段分明的记录卡，不需要页面层额外维护页码或占位行。',
    tags: ['pagination', 'emptyText', 'pageSize', 'mobileResponsive'],
    html: `
<div class="kui-stack">
    <section class="panel">
        <div class="panel-heading"><h3 class="panel-title">全部订单</h3><span class="badge badge-neutral">8 条</span></div>
        <div class="panel-body">
            <table class="table" data-tb-paged></table>
        </div>
    </section>
    <section class="panel">
        <div class="panel-heading"><h3 class="panel-title">新建客户</h3><span class="badge badge-neutral">0 条</span></div>
        <div class="panel-body">
            <table class="table" data-tb-empty></table>
        </div>
    </section>
</div>`,
})}

${callout('操作列固定在右侧依赖 DataGrid 的 <code>locked</code>，锁定列必须同时给出 <code>width</code>。Table 不提供锁定列，它的窄屏形态是卡片，因此两者按场景二选一，而不是叠在同一张表上。')}

${propsTable([
    { name: 'columns', type: 'TableColumn[] / DataGridColumn[]', defaultValue: '[]', desc: '列定义：field、title、align、sortable、visible；DataGrid 额外支持 width、locked、filterable 与 children。' },
    { name: 'data / rows', type: 'TableRow[] / DataGridRow[]', defaultValue: '[]', desc: '行数据，字段名与列定义的 field 对应。' },
    { name: 'sortName / sortOrder', type: 'string / asc | desc', defaultValue: 'null / asc', desc: 'Table 的初始排序列；DataGrid 直接点击表头循环升序、降序与取消。' },
    { name: 'locked', type: 'boolean | left | right', defaultValue: '—', desc: 'DataGrid 列锁定：true 等价于 left；右侧锁定用于常驻的操作列。' },
    { name: 'width', type: 'number', desc: '锁定列的宽度，必须给出；普通列可省略，由内容决定。' },
    { name: 'striped', type: 'boolean', defaultValue: 'true', desc: 'DataGrid 的斑马纹开关；Table 只用边框分隔行。' },
    { name: 'pagination / pageSize', type: 'boolean / number', defaultValue: 'false / 10', desc: '是否分页与每页条数，分页按钮由组件渲染。' },
    { name: 'mobileResponsive', type: 'boolean', defaultValue: 'false', desc: 'Table 专有：窄容器下折成卡片，单元格自动带 data-label。' },
    { name: 'emptyText', type: 'string', defaultValue: 'No Data', desc: '没有记录时显示的文案，Table 与 DataGrid 各自持有。' },
    { name: 'formatter', type: '(value, row, column) => string | HTMLElement', desc: '单元格渲染；Table 返回元素可插入按钮，DataGrid 返回 HTML 字符串。' },
    { name: '.kui-table--responsive', type: 'class', desc: '窄屏卡片降级的根类名，由 mobileResponsive 自动添加。' },
    { name: '.kui-data-grid__action', type: 'class', desc: '操作列单元格；锁定后配合 is-locked-right 常驻右侧。' },
    { name: '.kui-cluster', type: 'class', desc: '操作按钮容器；卡片降级时按钮独占一行且各自不换行，不会被字段值挤扁。' },
])}

`

    let rows = [...orderRows]
    const gridElement = root.querySelector<HTMLElement>('[data-tb-orders]')
    if (gridElement) {
        const grid = DataGrid.getOrCreate(gridElement, {
            columns: gridColumns,
            rows,
            rowKey: 'id',
            pageSize: 8,
            selectable: false,
            expandable: false,
            filterable: false,
            pagination: false,
            striped: true,
        })
        trackComponent(grid)

        gridElement.addEventListener('click', (event) => {
            const target = event.target instanceof Element ? event.target : null
            const done = target?.closest<HTMLElement>('[data-tb-done]')
            if (done?.dataset.tbDone) {
                rows = rows.map((row) => (row.id === done.dataset.tbDone ? { ...row, status: '已完成' } : row))
                grid.setRows(rows)
                return
            }

            const remove = target?.closest<HTMLElement>('[data-tb-remove]')
            if (remove?.dataset.tbRemove) {
                rows = rows.filter((row) => row.id !== remove.dataset.tbRemove)
                grid.setRows(rows)
            }
        })
    }

    const narrow = root.querySelector<HTMLElement>('[data-tb-narrow]')
    if (narrow) {
        trackComponent(
            Table.getOrCreate(narrow, {
                columns: narrowColumns,
                data: orderRows.slice(0, 4),
                mobileResponsive: true,
                cardView: true,
                emptyText: '暂无订单',
            }),
        )
    }

    const paged = root.querySelector<HTMLElement>('[data-tb-paged]')
    if (paged) {
        trackComponent(
            Table.getOrCreate(paged, {
                columns: tableColumns,
                data: orderRows,
                pagination: true,
                pageSize: 4,
                mobileResponsive: true,
                emptyText: '暂无订单',
            }),
        )
    }

    const empty = root.querySelector<HTMLElement>('[data-tb-empty]')
    if (empty) {
        trackComponent(
            Table.getOrCreate(empty, {
                columns: tableColumns,
                data: [],
                mobileResponsive: true,
                emptyText: '还没有订单，创建后会出现在这里',
            }),
        )
    }
}
