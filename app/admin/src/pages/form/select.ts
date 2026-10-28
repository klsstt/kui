import { ColorPicker, DateRangePicker, DateTimePicker, IconPicker, SelectPicker, type DateRangeValue, type DateTimePickerMode, type KuiEventDetail } from '@kui/core'
import { trackComponent } from '../../context'
import { iconCategories } from '../../data/icons'
import type { DocPageContext } from '../../docs/types'
import { callout, demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 选择器。
 * 原生 select 被替换成按钮与菜单：单选、多选、搜索与动态选项共用一个实例；
 * 颜色与时间各自保留输入框，浮层只负责取值，确认结果再写回同一字段；
 * 图标选择器用弹层 + 搜索把几百个 FA 4.7 图标收进一个按钮。
 */

/** 图标目录摊平成 `fa fa-*` 清单，供 IconPicker 使用 */
const iconChoices = iconCategories.flatMap((category) => category.icons.map((name) => `fa fa-${name}`))

interface DateTimePayload {
    date: Date | null
}

interface IconPayload {
    icon: string
}

/** 时间统一按本地时区展示，精确到分钟 */
const formatDateTime = (value: Date | null): string => {
    if (!value) {
        return '未设置'
    }
    const pad = (part: number): string => String(part).padStart(2, '0')
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}`
}

export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
<style>
    /* 仅本页：7 个工作日与 12 个月份按钮在窄容器内换行 */
    [data-sel-weekday-panel] .kui-segmented,
    [data-sel-month-panel] .kui-segmented {
        flex-wrap: wrap;
        gap: 2px;
    }
</style>

${pageHead(meta, {
    lead: '选择器把有限选项收进一个按钮：单选给一个结果，多选把结果回填成可移除的标签，选项多时先搜索再出列表。开始与结束日期也收进同一个只读输入框，点开日历后先定开始、再定结束；颜色、时间与图标各自保留一个显式的取值控件。',
    tags: ['SelectPicker', 'DateRangePicker', 'DateTimePicker', 'DateTimePicker.mode', 'IconPicker', '.btn-select'],
})}

${sectionTitle('下拉选择', '选项少就直接展开；选项多先给搜索；选项会变就 refresh。三种情况共用一个按钮与一套键盘行为。')}

${demo({
    title: '单选与多选',
    desc: '单选未选中时显示占位文案，多选把已选项渲染成可移除的标签；标签上的关闭按钮与键盘退格都能取消。',
    tags: ['multiple', '.selectpicker-selection', 'deselectAll()'],
    script: `
const scope = document.querySelector<HTMLSelectElement>('[data-sel-scope]')!
const count = document.querySelector<HTMLElement>('[data-sel-scope-count]')
const picker = SelectPicker.getOrCreate(scope, { countSelectedText: '已选中 {1} 个大区中的 {0} 个' })

SelectPicker.getOrCreate(document.querySelector<HTMLSelectElement>('[data-sel-role]')!)

const sync = (): void => {
    const values = picker.val()
    if (count) count.textContent = '已选 ' + (Array.isArray(values) ? values.length : 0) + ' 个大区'
}

scope.addEventListener('change', sync)
document.querySelector('[data-sel-clear-scope]')?.addEventListener('click', () => {
    picker.deselectAll()
    sync()
})
`,
    html: `
<form class="form-section" data-sel-basic>
    <h3 class="form-section__title">成员权限</h3>
    <p class="form-section__desc">角色决定能编辑什么，可见大区决定能看到哪些门店数据。</p>
    <div class="form-row">
        <div class="form-group">
            <label class="form-label" for="sel-role">成员角色</label>
            <select class="form-control" id="sel-role" data-sel-role>
                <option value="" disabled selected>请选择角色</option>
                <option value="admin">管理员</option>
                <option value="editor">编辑者</option>
                <option value="viewer">只读成员</option>
                <option value="guest">外部协作者</option>
            </select>
            <span class="form-hint">角色改变后，未保存的编辑会丢失。</span>
        </div>
        <div class="form-group">
            <label class="form-label" for="sel-scope">可见大区</label>
            <select class="form-control" id="sel-scope" data-sel-scope multiple>
                <option value="east" selected>华东大区</option>
                <option value="south" selected>华南大区</option>
                <option value="north">华北大区</option>
                <option value="southwest">西南大区</option>
                <option value="northwest">西北大区</option>
            </select>
            <span class="form-hint">不选表示全部大区可见。</span>
        </div>
    </div>
    <div class="kui-cluster kui-justify-between">
        <span class="form-hint" data-sel-scope-count>已选 2 个大区</span>
        <button type="button" class="btn btn-default btn-sm" data-sel-clear-scope>
            <i class="fa fa-times" aria-hidden="true"></i> 清空大区
        </button>
    </div>
</form>`,
})}

${demo({
    title: '可搜索过滤',
    desc: '关键词变化时重建 option 并调用 refresh；当前选中值在仍匹配时保留，匹配不到就回到占位项。清空按钮恢复完整城市列表。',
    tags: ['refresh()', 'filter', '当前选中值'],
    script: `
const search = document.querySelector<HTMLInputElement>('[data-sel-city-search]')!
const select = document.querySelector<HTMLSelectElement>('[data-sel-city]')!
const count = document.querySelector<HTMLElement>('[data-sel-city-count]')
const picker = SelectPicker.getOrCreate(select)
const all = Array.from(select.options).filter((option) => option.value !== '').map((option) => ({
    value: option.value,
    label: option.textContent ?? '',
}))

const render = (): void => {
    const keyword = search.value.trim()
    const current = select.value
    const matched = all.filter((option) => option.label.includes(keyword))
    const placeholder = new Option('请选择城市', '')
    placeholder.disabled = true
    placeholder.selected = current === '' || !matched.some((option) => option.value === current)
    select.replaceChildren(placeholder, ...matched.map((option) => new Option(option.label, option.value)))
    if (!placeholder.selected) select.value = current
    picker.refresh()
    if (count) count.textContent = keyword ? '匹配 ' + matched.length + ' 个城市' : '共 ' + all.length + ' 个城市'
}

search.addEventListener('input', render)
document.querySelector('[data-sel-city-clear]')?.addEventListener('click', () => {
    search.value = ''
    render()
    search.focus()
})
`,
    html: `
<div class="form-section" data-sel-search-form>
    <h3 class="form-section__title">交付城市</h3>
    <p class="form-section__desc">先输入城市名，再在过滤后的列表里选择；清空关键词不会清空已选的城市。</p>
    <div class="form-group">
        <label class="form-label" for="sel-city-search">搜索城市</label>
        <div class="input-group">
            <span class="input-addon"><i class="fa fa-search" aria-hidden="true"></i></span>
            <input class="form-control" id="sel-city-search" type="search" placeholder="输入城市名，例如 杭州" data-sel-city-search>
            <button type="button" class="btn btn-default" data-sel-city-clear aria-label="清空搜索">
                <i class="fa fa-times" aria-hidden="true"></i>
            </button>
        </div>
    </div>
    <div class="form-group kui-max-w-md">
        <label class="form-label" for="sel-city">选择城市</label>
        <select class="form-control" id="sel-city" data-sel-city aria-label="交付城市">
            <option value="" disabled>请选择城市</option>
            <option value="hangzhou" selected>杭州</option>
            <option value="ningbo">宁波</option>
            <option value="nanjing">南京</option>
            <option value="suzhou">苏州</option>
            <option value="guangzhou">广州</option>
            <option value="shenzhen">深圳</option>
            <option value="chengdu">成都</option>
            <option value="xian">西安</option>
        </select>
        <span class="form-hint" data-sel-city-count>共 8 个城市</span>
    </div>
</div>`,
})}

${demo({
    title: '动态选项',
    desc: '新标签来自输入框：追加 option 后调用 refresh，再通过 val() 把新值写回多选；重复标签直接选中，不会生成第二份。',
    tags: ['append', 'refresh()', 'val()'],
    script: `
const select = document.querySelector<HTMLSelectElement>('[data-sel-tags]')!
const input = document.querySelector<HTMLInputElement>('[data-sel-new-tag]')!
const error = document.querySelector<HTMLElement>('[data-sel-tag-error]')
const count = document.querySelector<HTMLElement>('[data-sel-tag-count]')
const picker = SelectPicker.getOrCreate(select)

const sync = (): void => {
    if (count) count.textContent = '现有 ' + select.options.length + ' 个标签，已选 ' + select.selectedOptions.length + ' 个'
}

const add = (): void => {
    const label = input.value.trim()
    if (!label) {
        input.classList.add('is-invalid')
        input.setAttribute('aria-invalid', 'true')
        if (error) error.hidden = false
        return
    }
    input.classList.remove('is-invalid')
    input.setAttribute('aria-invalid', 'false')
    if (error) error.hidden = true

    let option = Array.from(select.options).find((item) => item.value === label)
    if (!option) {
        option = new Option(label, label)
        select.append(option)
    }
    option.selected = true
    picker.refresh()
    picker.val(Array.from(select.selectedOptions).map((item) => item.value))
    sync()
    input.value = ''
    input.focus()
}

document.querySelector('[data-sel-add-tag]')?.addEventListener('click', add)
input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault()
        add()
    }
})
input.addEventListener('input', () => {
    input.classList.remove('is-invalid')
    input.setAttribute('aria-invalid', 'false')
    if (error) error.hidden = true
})
`,
    html: `
<div class="form-section" data-sel-dynamic>
    <h3 class="form-section__title">内容标签</h3>
    <p class="form-section__desc">标签可多选，也可以现场新增；按钮上的标签可以逐个移除。</p>
    <div class="form-group">
        <label class="form-label" for="sel-tags">已选标签</label>
        <select class="form-control" id="sel-tags" data-sel-tags multiple>
            <option value="review" selected>渠道复盘</option>
            <option value="stock" selected>库存</option>
            <option value="quote">报价单</option>
        </select>
        <span class="form-hint" data-sel-tag-count>现有 3 个标签，已选 2 个</span>
    </div>
    <div class="form-group kui-max-w-md">
        <label class="form-label" for="sel-new-tag">新增标签</label>
        <div class="input-group">
            <input class="form-control" id="sel-new-tag" type="text" placeholder="输入标签名，回车或点添加" data-sel-new-tag>
            <button type="button" class="btn btn-default" data-sel-add-tag>
                <i class="fa fa-plus" aria-hidden="true"></i> 添加
            </button>
        </div>
        <span class="form-error" data-sel-tag-error hidden>请输入标签名</span>
        <span class="form-hint">最多 6 个标签，重复名称会直接选中已有项。</span>
    </div>
</div>`,
})}

${sectionTitle('颜色、时间与图标', '三者都保留一个显式的取值控件：色板把结果写成十六进制，时间浮层用取消 / 确定决定是否写回，图标弹层用搜索缩小范围。')}

${demo({
    title: '颜色选择器：完整色板',
    desc: '色板独立放在不裁切的容器里，八个颜色与「不设置」同屏显示；右侧同步回显十六进制值，选色后直接写回输入框。',
    tags: ['ColorPicker', 'colors', 'updateText'],
    stage: 'tinted',
    script: `
const input = document.querySelector<HTMLInputElement>('[data-sel-color]')!
const hex = document.querySelector<HTMLElement>('[data-sel-color-hex]')

ColorPicker.getOrCreate(input, {
    title: '选色',
    colors: ['#2563eb', '#0ea5e9', '#14b8a6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#0f172a'],
    lineCount: 9,
    tileSize: 26,
    updateText: '[data-sel-color-hex]',
})

input.addEventListener('change', () => {
    if (hex) hex.textContent = input.value || '未设置'
})
`,
    html: `
<div class="form-section" data-sel-color-form>
    <div class="kui-split">
        <div class="kui-stack kui-stack--tight">
            <span class="form-label">主题色</span>
            <input class="form-control" id="sel-color" type="text" value="#2563eb" autocomplete="off" aria-label="主题色十六进制值" data-sel-color>
        </div>
        <div class="kui-stack kui-stack--tight">
            <p class="form-hint">点击色块后，输入框与右侧色值同时更新；选择空白格表示不设置主题色。色板放在页面流里、没有套任何滚动容器，浮层高度与阴影都完整呈现。</p>
            <dl class="kui-descriptions">
                <div class="kui-descriptions__item"><dt>当前色值</dt><dd><code data-sel-color-hex>#2563eb</code></dd></div>
                <div class="kui-descriptions__item"><dt>应用范围</dt><dd>按钮、标签与图表强调色</dd></div>
                <div class="kui-descriptions__item"><dt>浮层高度</dt><dd>最大 13rem，超出后内部滚动</dd></div>
                <div class="kui-descriptions__item"><dt>回写方式</dt><dd>点色块写入十六进制，手改输入框会高亮对应的色块</dd></div>
            </dl>
        </div>
    </div>
</div>`,
})}

${callout('色板浮层已经限制最大高度，内容超出时在浮层内部滚动；页面示例刻意不把它放进任何滚动容器，高度与阴影都能完整呈现。')}

${demo({
    title: '时间选择器：完整用法',
    desc: '默认值、autoclose、format、todayBtn、min / max 各占一个字段：改时间会写回输入框，浮层里的「清空 / 取消 / 确定」决定这次改动是否保留，结果与事件都由同一份 <code>kui:datetimepicker:change</code> 驱动。',
    tags: ['DateTimePicker', 'autoclose', 'format', 'todayBtn', 'min / max'],
    stage: 'tinted',
    script: `
const input = document.querySelector<HTMLInputElement>('[data-sel-date]')!
const result = document.querySelector<HTMLElement>('[data-sel-date-result]')
const eventLine = document.querySelector<HTMLElement>('[data-sel-date-event]')
const picker = DateTimePicker.getOrCreate(input, { autoclose: false, todayBtn: true })

const format = (date: Date | null): string => {
    if (!date) return '未设置'
    const pad = (value: number): string => String(value).padStart(2, '0')
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes())
}

let pending = ''

// 捕获阶段先记下点的是哪个动作，change 事件里再据此写说明
input.parentElement?.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-kui-datetime-action]') : null
    if (button) pending = button.dataset.kuiDatetimeAction ?? ''
}, true)

input.addEventListener('focus', () => picker.show(false))
input.addEventListener('click', () => picker.show(false))
input.addEventListener('kui:datetimepicker:change', (event) => {
    const date = (event as CustomEvent<{ payload?: { date: Date | null } }>).detail.payload?.date ?? null
    const action = pending
    pending = ''
    if (result) result.textContent = '当前已选：' + format(date)
    if (!eventLine) return
    if (action === 'cancel') eventLine.textContent = '取消 → 回退到打开前的 ' + format(date)
    else if (action === 'clear') eventLine.textContent = '清空 → 已移除时间'
    else if (action === 'confirm') eventLine.textContent = '确定 → 写回 ' + format(date)
    else if (action === 'today') eventLine.textContent = '今天 → ' + format(date)
    else eventLine.textContent = '输入框变更 → 写回 ' + format(date)
})
if (result) result.textContent = '当前已选：' + format(picker.getDate())
`,
    html: `
<form class="form-section" data-sel-datetime-form novalidate>
    <h3 class="form-section__title">发布时间</h3>
    <p class="form-section__desc">时间按本地时区保存，精确到分钟；浮层里可以改时间，也可以今天、清空、取消或确定，结果写回同一个输入框。</p>
    <div class="form-row">
        <div class="form-group">
            <label class="form-label" for="sel-date">生效时间<span class="required">*</span></label>
            <input class="form-control" id="sel-date" type="text" value="2026-10-27 09:30" autocomplete="off" aria-describedby="sel-date-hint" data-sel-date>
            <span class="form-hint" id="sel-date-hint">默认值写在 value 上；<code>autoclose: false</code> 时浮层不自动收起，点「确定」写回、点「取消」回到打开前的值。</span>
        </div>
        <div class="form-group">
            <label class="form-label" for="sel-date-auto">自动关闭</label>
            <input class="form-control" id="sel-date-auto" type="text" value="2026-10-28 14:00" autocomplete="off" data-sel-date-auto>
            <span class="form-hint" data-sel-date-auto-state>autoclose: true，改一次时间就写回并收起浮层。</span>
        </div>
    </div>
    <div class="form-row">
        <div class="form-group">
            <label class="form-label" for="sel-date-format">自定义格式</label>
            <input class="form-control" id="sel-date-format" type="text" value="2026-11-02 08:05" autocomplete="off" data-sel-date-format>
            <span class="form-hint"><code>format: 'yyyy年mm月dd日 hh:ii'</code>；<code>todayBtn: false</code> 时不出现「今天」，点「确定」写回。</span>
        </div>
        <div class="form-group">
            <label class="form-label" for="sel-date-range">可选范围</label>
            <input class="form-control" id="sel-date-range" type="text" value="2026-11-15 10:00" autocomplete="off" min="2026-10-01 00:00" max="2026-12-31 23:59" data-sel-date-range>
            <span class="form-hint">min / max 写在输入框上，创建浮层时同步到原生 datetime-local；改完点「确定」写回。</span>
        </div>
    </div>
    <div class="kui-stack kui-stack--tight">
        <div class="alert alert-info" aria-live="polite" data-sel-date-result>当前已选：2026-10-27 09:30</div>
        <span class="form-hint" data-sel-date-event>还没有操作；打开浮层后点「确定」「取消」或「清空」都会更新这一行。</span>
    </div>
    <dl class="kui-descriptions">
        <div class="kui-descriptions__item"><dt>默认值</dt><dd>输入框的 value 就是初始时间，getDate() 读同一份值</dd></div>
        <div class="kui-descriptions__item"><dt>autoclose: false</dt><dd>浮层不自动收起，点「确定」写回或「取消」回退</dd></div>
        <div class="kui-descriptions__item"><dt>autoclose: true</dt><dd>改动即写回并收起浮层，适合只选一次的场景</dd></div>
        <div class="kui-descriptions__item"><dt>format</dt><dd>写回输入框的格式，默认 yyyy-mm-dd hh:ii</dd></div>
        <div class="kui-descriptions__item"><dt>todayBtn</dt><dd>true 显示「今天」，false 只保留清空 / 取消 / 确定</dd></div>
        <div class="kui-descriptions__item"><dt>min / max</dt><dd>输入框属性，同步到浮层里的原生 datetime-local</dd></div>
        <div class="kui-descriptions__item"><dt>清空 / 取消 / 确定</dt><dd>清空置 null，取消回退，确定把浮层里的值写回输入框</dd></div>
        <div class="kui-descriptions__item"><dt>kui:datetimepicker:change</dt><dd>上述动作后触发，payload.date 为 Date 或 null</dd></div>
        <div class="kui-descriptions__item"><dt>内联模式</dt><dd>data-provide="datetimepicker-inline"，见下一个示例</dd></div>
    </dl>
</form>`,
})}

${demo({
    title: '时间选择器：内联模式',
    desc: '给容器加上 <code>data-provide="datetimepicker-inline"</code>，面板常驻展开、不再需要点击触发；选择结果仍然通过 <code>kui:datetimepicker:change</code> 回传，适合直接嵌进设置页或侧栏。',
    tags: ['datetimepicker-inline', '内联模式', 'change 事件'],
    script: `
const host = document.querySelector<HTMLElement>('[data-sel-dt-inline]')!
const value = document.querySelector<HTMLElement>('[data-sel-dt-inline-value]')
const eventLine = document.querySelector<HTMLElement>('[data-sel-dt-inline-event]')
const picker = DateTimePicker.getOrCreate(host)

const format = (date: Date | null): string => {
    if (!date) return '未设置'
    const pad = (value: number): string => String(value).padStart(2, '0')
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes())
}

// 内联模式同样可以带一个初始值
picker.setDate('2026-11-05 09:00')
if (value) value.textContent = format(picker.getDate())

host.addEventListener('kui:datetimepicker:change', (event) => {
    const date = (event as CustomEvent<{ payload?: { date: Date | null } }>).detail.payload?.date ?? null
    if (value) value.textContent = format(date)
    if (eventLine) eventLine.textContent = '写回：' + format(date)
})
`,
    html: `
<div class="form-section" data-sel-dt-inline-form>
    <h3 class="form-section__title">内联时间面板</h3>
    <p class="form-section__desc">面板常驻展开，改时间、清空、取消与确定都在页面上完成，不占用浮层定位。</p>
    <div class="kui-split" style="--kui-split-sidebar: 20rem">
        <div class="kui-stack kui-stack--tight">
            <span class="form-label">常驻面板</span>
            <div data-provide="datetimepicker-inline" data-sel-dt-inline role="group" aria-label="内联时间选择"></div>
        </div>
        <div class="kui-stack kui-stack--tight">
            <dl class="kui-descriptions">
                <div class="kui-descriptions__item"><dt>当前值</dt><dd><code data-sel-dt-inline-value>2026-11-05 09:00</code></dd></div>
                <div class="kui-descriptions__item"><dt>最近事件</dt><dd data-sel-dt-inline-event>尚未操作</dd></div>
            </dl>
            <p class="form-hint">内联面板与浮层共用同一个实例方法：setDate() 写入、getDate() 读取、change 事件回传；关闭页面时随实例一起销毁。</p>
        </div>
    </div>
</div>`,
})}

${demo({
    title: '图标选择：弹层 + 搜索 + 回写',
    desc: '用法与基础表单一致：从 <code>@kui/core</code> 引入 <code>IconPicker</code>，把 <code>iconCategories</code> 摊平成 <code>fa fa-*</code> 数组后传给 <code>getOrCreate</code>；弹层负责搜索与点选，<code>kui:iconpicker:change</code> 负责回写。',
    tags: ['IconPicker', 'search', 'kui:iconpicker:change'],
    script: `
const icons = iconCategories.flatMap((category) => category.icons.map((name) => 'fa fa-' + name))
const trigger = document.querySelector<HTMLElement>('[data-sel-icon-picker]')!
const value = document.querySelector<HTMLElement>('[data-sel-icon-value]')
const eventLine = document.querySelector<HTMLElement>('[data-sel-icon-event]')

IconPicker.getOrCreate(trigger, { icons, columns: 8, search: true, value: 'fa fa-star' })

trigger.addEventListener('kui:iconpicker:change', (event) => {
    const icon = (event as CustomEvent<{ payload?: { icon: string } }>).detail.payload?.icon ?? ''
    if (value) value.textContent = icon
    if (eventLine) eventLine.textContent = '已回写：' + icon
})
`,
    html: `
<div class="form-section" data-sel-icon-form>
    <div class="form-row">
        <div class="form-group">
            <span class="form-label">导航图标</span>
            <div data-kui-icon-picker data-sel-icon-picker aria-label="选择导航图标"></div>
            <span class="form-hint">弹层里输入 star、user 或 bell 都能过滤；点选后按钮、右侧取值与结果表一起更新。</span>
        </div>
        <div class="form-group">
            <span class="form-label">当前取值</span>
            <dl class="kui-descriptions">
                <div class="kui-descriptions__item"><dt>图标 class</dt><dd><code data-sel-icon-value>fa fa-star</code></dd></div>
                <div class="kui-descriptions__item"><dt>回写方式</dt><dd>弹层负责搜索与点选，change 事件负责回写</dd></div>
                <div class="kui-descriptions__item"><dt>最近事件</dt><dd data-sel-icon-event>尚未选择</dd></div>
            </dl>
        </div>
    </div>
</div>`,
})}

${sectionTitle('日期范围与多种模式', '日期范围收进一个只读输入框：先定开始、再定结束，确定后统一写回。时间选择器用 mode 切换粒度，周改为星期选择（周一…周日）；星期和月份用独立按钮组补足纯选择场景。')}

${demo({
    title: '日期范围：一个输入框选开始与结束',
    desc: '开始与结束共用一个只读输入框，点开后第一次点日期定开始、第二次点日期定结束；开始与结束之间高亮，选结束阶段早于开始的天不可选，点同一天则得到单日范围。点「确定」写回输入框并触发 <code>kui:daterange:change</code>，下面同时显示天数、开始与结束值，提交只校验范围是否完整。',
    tags: ['DateRangePicker', 'min / max', '单框日期范围', '共 N 天', 'kui:daterange:change'],
    stage: 'tinted',
    script: `
const form = document.querySelector<HTMLFormElement>('[data-sel-date-range-form]')!
const input = form.querySelector<HTMLInputElement>('[data-sel-daterange]')!
const days = form.querySelector<HTMLElement>('[data-sel-range-days]')
const values = form.querySelector<HTMLElement>('[data-sel-range-values]')
const error = form.querySelector<HTMLElement>('[data-sel-range-error]')
const result = form.querySelector<HTMLElement>('[data-sel-range-result]')
const resultText = form.querySelector<HTMLElement>('[data-sel-range-result-text]')
const eventLine = form.querySelector<HTMLElement>('[data-sel-range-event]')

const render = (value: DateRangeValue): void => {
    const total = value.startDate && value.endDate
        ? Math.round((value.endDate.getTime() - value.startDate.getTime()) / 86400000) + 1
        : 0
    if (days) days.textContent = total ? '共 ' + total + ' 天' : '共 — 天'
    if (values) values.textContent = '开始 ' + (value.start || '未设置') + ' · 结束 ' + (value.end || '未设置')
    if (error) error.hidden = true
}

const picker = DateRangePicker.getOrCreate(input, {
    min: '2026-09-01',
    max: '2027-03-31',
    onChange: render,
})

// 取消、清空与确定都会触发同一种事件，detail.payload 带 start / end / startDate / endDate
input.addEventListener('kui:daterange:change', (changeEvent) => {
    const value = (changeEvent as CustomEvent<{ payload?: DateRangeValue }>).detail.payload
    if (eventLine) {
        eventLine.textContent = value && value.start && value.end
            ? '最近写回：' + value.start + ' → ' + value.end
            : '最近写回：已清空'
    }
    if (result) result.hidden = true
})

form.addEventListener('submit', (submitEvent) => {
    submitEvent.preventDefault()
    const start = picker.getStart()
    const end = picker.getEnd()
    // 顺序由组件保证，这里只校验范围是否完整
    if (!start || !end) {
        if (error) {
            error.textContent = '请选择完整的开始与结束日期。'
            error.hidden = false
        }
        input.classList.add('is-invalid')
        input.setAttribute('aria-invalid', 'true')
        if (result) result.hidden = true
        return
    }
    input.classList.remove('is-invalid')
    input.setAttribute('aria-invalid', 'false')
    const total = Math.round((end.getTime() - start.getTime()) / 86400000) + 1
    const value = picker.getValue()
    if (resultText) resultText.textContent = '已提交 ' + value.start + ' 至 ' + value.end + '，共 ' + total + ' 天。'
    if (result) result.hidden = false
})

render(picker.getValue())
`,
    html: `
<form class="form-section" data-sel-date-range-form novalidate>
    <h3 class="form-section__title">活动周期</h3>
    <p class="form-section__desc">开始与结束共用一个只读输入框：第一次点日期定开始，第二次点日期定结束；开始与结束之间高亮，选结束阶段早于开始的天不可选。点「确定」写回并触发事件。</p>
    <div class="form-group kui-max-w-md">
        <label class="form-label" for="sel-daterange">活动周期<span class="required">*</span></label>
        <input class="form-control" id="sel-daterange" type="text" value="2026-10-01 → 2026-10-12" placeholder="选择日期范围" autocomplete="off" min="2026-09-01" max="2027-03-31" aria-describedby="sel-daterange-hint" data-sel-daterange data-kui-date-range-picker>
        <span class="form-hint" id="sel-daterange-hint">min / max 写在输入框上；单日范围可以直接点同一天。Esc 或点击外部关闭日历。</span>
    </div>
    <p class="form-error" data-sel-range-error hidden>请选择完整的开始与结束日期。</p>
    <div class="kui-cluster kui-justify-between">
        <span class="badge badge-neutral" data-sel-range-days>共 12 天</span>
        <span class="form-hint" data-sel-range-values>开始 2026-10-01 · 结束 2026-10-12</span>
    </div>
    <div class="kui-cluster kui-justify-between">
        <span class="form-hint" data-sel-range-event>最近事件：尚未操作</span>
        <button type="submit" class="btn btn-primary btn-sm"><i class="fa fa-check" aria-hidden="true"></i> 提交范围</button>
    </div>
    <span class="form-hint">顺序由组件保证，提交时只校验开始与结束是否都已选择。</span>
    <div class="alert alert-success" data-sel-range-result hidden>
        <i class="fa fa-check-circle" aria-hidden="true"></i>
        <div data-sel-range-result-text>已提交 2026-10-01 至 2026-10-12，共 12 天。</div>
    </div>
</form>`,
})}

${demo({
    title: '日期时间范围：确认后计算时长',
    desc: '两个实例都保持默认 <code>mode: \'datetime\'</code> 与 <code>autoclose: false</code>；在浮层里点「确定」写回后才计算区间时长，结束早于开始时给出错误。',
    tags: ['mode: datetime', 'autoclose: false', '区间时长'],
    script: `
const form = document.querySelector<HTMLFormElement>('[data-sel-datetime-range-form]')!
const start = form.querySelector<HTMLInputElement>('[data-sel-dt-range-start]')!
const end = form.querySelector<HTMLInputElement>('[data-sel-dt-range-end]')!
const duration = form.querySelector<HTMLElement>('[data-sel-dt-range-duration]')
const error = form.querySelector<HTMLElement>('[data-sel-dt-range-error]')

const startPicker = DateTimePicker.getOrCreate(start, { autoclose: false })
const endPicker = DateTimePicker.getOrCreate(end, { autoclose: false })

let pending = ''

form.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-kui-datetime-action]') : null
    if (button) pending = button.dataset.kuiDatetimeAction ?? ''
}, true)

const render = (): void => {
    const first = startPicker.getDate()
    const last = endPicker.getDate()
    if (!first || !last) {
        if (duration) duration.textContent = '请选择完整的开始与结束时间。'
        if (error) error.hidden = true
        return
    }
    if (last.getTime() < first.getTime()) {
        if (duration) duration.textContent = '区间无效：结束时间早于开始时间。'
        if (error) error.hidden = false
        return
    }
    if (error) error.hidden = true
    const minutes = Math.round((last.getTime() - first.getTime()) / 60000)
    const parts: string[] = []
    if (Math.floor(minutes / 1440)) parts.push(Math.floor(minutes / 1440) + ' 天')
    if (Math.floor((minutes % 1440) / 60)) parts.push(Math.floor((minutes % 1440) / 60) + ' 小时')
    if (minutes % 60) parts.push(minutes % 60 + ' 分钟')
    if (!parts.length) parts.push('不足 1 分钟')
    if (duration) duration.textContent = '区间时长：' + parts.join(' ')
}

const onConfirm = (): void => {
    const action = pending
    pending = ''
    if (action === 'confirm') render()
}

start.addEventListener('kui:datetimepicker:change', onConfirm)
end.addEventListener('kui:datetimepicker:change', onConfirm)
start.addEventListener('focus', () => startPicker.show(false))
start.addEventListener('click', () => startPicker.show(false))
end.addEventListener('focus', () => endPicker.show(false))
end.addEventListener('click', () => endPicker.show(false))
`,
    html: `
<form class="form-section" data-sel-datetime-range-form novalidate>
    <h3 class="form-section__title">发布时间窗</h3>
    <p class="form-section__desc">两个实例都保持默认 <code>mode: 'datetime'</code> 与 <code>autoclose: false</code>；在浮层里点「确定」后，下面才计算区间时长。</p>
    <div class="form-row">
        <div class="form-group">
            <label class="form-label" for="sel-dt-range-start">开始时间</label>
            <input class="form-control" id="sel-dt-range-start" type="text" value="2026-10-27 09:30" autocomplete="off" data-sel-dt-range-start>
            <span class="form-hint"><code>datetime-local</code> · 输出 <code>yyyy-mm-dd hh:ii</code></span>
        </div>
        <div class="form-group">
            <label class="form-label" for="sel-dt-range-end">结束时间</label>
            <input class="form-control" id="sel-dt-range-end" type="text" value="2026-10-27 18:00" autocomplete="off" data-sel-dt-range-end>
            <span class="form-hint">点「确定」写回后显示区间时长</span>
        </div>
    </div>
    <p class="form-error" data-sel-dt-range-error hidden>结束时间不能早于开始时间。</p>
    <div class="alert alert-info" aria-live="polite" data-sel-dt-range-duration>尚未确认：在任一浮层点「确定」后计算区间时长。</div>
</form>`,
})}

${demo({
    title: '模式一览：年、年月、年月日、时分秒、星期',
    desc: '同一个组件按 <code>mode</code> 切换粒度：年份用浮层里的 select，星期用「周一…周日」的 select，其余用对应原生输入；每项下方写明写回格式，右侧「最近写回」跟随选择更新。',
    tags: ['mode: year', 'mode: month', 'mode: week', 'mode: time'],
    script: `
const fields = Array.from(document.querySelectorAll<HTMLInputElement>('[data-sel-mode-input]'))

fields.forEach((input) => {
    const mode = (input.dataset.mode ?? 'datetime') as 'datetime' | 'date' | 'month' | 'week' | 'time' | 'year'
    const picker = DateTimePicker.getOrCreate(input, { mode })
    const output = document.querySelector<HTMLElement>('[data-sel-mode-out="' + mode + '"]')
    const sync = (): void => {
        if (output) output.textContent = input.value || '未设置'
    }
    input.addEventListener('focus', () => picker.show(false))
    input.addEventListener('click', () => picker.show(false))
    input.addEventListener('kui:datetimepicker:change', sync)
    sync()
})
`,
    html: `
<div class="form-section" data-sel-mode-panel>
    <h3 class="form-section__title">输出粒度</h3>
    <p class="form-section__desc">每个输入框只负责一种粒度；年份在浮层里是近 30 年（含未来 5 年）的 select，星期是「周一…周日」的 select（写回星期名，<code>getDate()</code> 返回本周对应星期几的日期）。</p>
    <div class="kui-grid kui-grid--md">
        <div class="form-group">
            <label class="form-label" for="sel-mode-year">年份</label>
            <input class="form-control" id="sel-mode-year" type="text" value="2026" autocomplete="off" data-sel-mode-input data-mode="year">
            <span class="form-hint"><code>mode: 'year'</code> · 输出 <code>yyyy</code> · 最近写回 <code data-sel-mode-out="year">2026</code></span>
        </div>
        <div class="form-group">
            <label class="form-label" for="sel-mode-month">年-月</label>
            <input class="form-control" id="sel-mode-month" type="text" value="2026-10" autocomplete="off" data-sel-mode-input data-mode="month">
            <span class="form-hint"><code>mode: 'month'</code> · 输出 <code>yyyy-mm</code> · 最近写回 <code data-sel-mode-out="month">2026-10</code></span>
        </div>
        <div class="form-group">
            <label class="form-label" for="sel-mode-date">年-月-日</label>
            <input class="form-control" id="sel-mode-date" type="text" value="2026-10-27" autocomplete="off" data-sel-mode-input data-mode="date">
            <span class="form-hint"><code>mode: 'date'</code> · 输出 <code>yyyy-mm-dd</code> · 最近写回 <code data-sel-mode-out="date">2026-10-27</code></span>
        </div>
        <div class="form-group">
            <label class="form-label" for="sel-mode-time">时分秒</label>
            <input class="form-control" id="sel-mode-time" type="text" value="09:30:00" autocomplete="off" data-sel-mode-input data-mode="time">
            <span class="form-hint"><code>mode: 'time'</code> · 输出 <code>hh:ii:ss</code> · 最近写回 <code data-sel-mode-out="time">09:30:00</code></span>
        </div>
        <div class="form-group">
            <label class="form-label" for="sel-mode-week">星期</label>
            <input class="form-control" id="sel-mode-week" type="text" value="周一" autocomplete="off" data-sel-mode-input data-mode="week">
            <span class="form-hint"><code>mode: 'week'</code> · 输出 <code>周一…周日</code> · 最近写回 <code data-sel-mode-out="week">周一</code></span>
        </div>
    </div>
</div>`,
})}

${demo({
    title: '每周工作日：周一至周日（多选）',
    desc: '7 个按钮各自独立开关，<code>aria-pressed</code> 同步表达选中状态；下方实时汇总已选工作日与提交值，适合排班、营业日这类多选场景。与单个「星期」模式不同，这里可以同时选多天。',
    tags: ['aria-pressed', '多选按钮', '工作日'],
    script: `
const panel = document.querySelector<HTMLElement>('[data-sel-weekday-panel]')!
const buttons = Array.from(panel.querySelectorAll<HTMLButtonElement>('[data-sel-weekday]'))
const result = panel.querySelector<HTMLElement>('[data-sel-weekday-result]')
const value = panel.querySelector<HTMLElement>('[data-sel-weekday-value]')

const sync = (): void => {
    const selected = buttons.filter((button) => button.getAttribute('aria-pressed') === 'true')
    if (result) result.textContent = selected.length ? selected.map((button) => button.textContent ?? '').join('、') : '未选择'
    if (value) value.textContent = selected.map((button) => button.dataset.selWeekday ?? '').join(',') || '—'
}

buttons.forEach((button) => {
    button.addEventListener('click', () => {
        const pressed = button.getAttribute('aria-pressed') === 'true'
        button.setAttribute('aria-pressed', String(!pressed))
        button.classList.toggle('is-active', !pressed)
        sync()
    })
})
sync()
`,
    html: `
<div class="form-section" data-sel-weekday-panel>
    <h3 class="form-section__title">营业日</h3>
    <p class="form-section__desc">默认选中周一至周五；周六、周日可以单独打开或关闭。</p>
    <div class="kui-stack kui-stack--tight">
        <div class="kui-segmented" role="group" aria-label="选择工作日" data-sel-weekdays>
            <button type="button" aria-pressed="true" class="is-active" data-sel-weekday="1">周一</button>
            <button type="button" aria-pressed="true" class="is-active" data-sel-weekday="2">周二</button>
            <button type="button" aria-pressed="true" class="is-active" data-sel-weekday="3">周三</button>
            <button type="button" aria-pressed="true" class="is-active" data-sel-weekday="4">周四</button>
            <button type="button" aria-pressed="true" class="is-active" data-sel-weekday="5">周五</button>
            <button type="button" aria-pressed="false" data-sel-weekday="6">周六</button>
            <button type="button" aria-pressed="false" data-sel-weekday="7">周日</button>
        </div>
        <span class="form-hint">已选工作日：<strong data-sel-weekday-result>周一、周二、周三、周四、周五</strong></span>
        <span class="form-hint">提交值：<code data-sel-weekday-value>1,2,3,4,5</code></span>
    </div>
</div>`,
})}

${demo({
    title: '月份选择：12 个月份按钮',
    desc: '12 个按钮是单选组，点击后同时更新 <code>aria-pressed</code> 与 <code>is-active</code>；下方显示选中的年份月份与可直接提交的 <code>yyyy-mm</code> 值。',
    tags: ['月份', '单选按钮组', 'yyyy-mm'],
    script: `
const panel = document.querySelector<HTMLElement>('[data-sel-month-panel]')!
const buttons = Array.from(panel.querySelectorAll<HTMLButtonElement>('[data-sel-month]'))
const result = panel.querySelector<HTMLElement>('[data-sel-month-result]')
const value = panel.querySelector<HTMLElement>('[data-sel-month-value]')
const year = 2026

const sync = (): void => {
    const active = buttons.find((button) => button.getAttribute('aria-pressed') === 'true')
    const month = active ? Number(active.dataset.selMonth) : 0
    if (result) result.textContent = month ? year + ' 年 ' + month + ' 月' : '未选择月份'
    if (value) value.textContent = month ? year + '-' + String(month).padStart(2, '0') : '—'
}

buttons.forEach((button) => {
    button.addEventListener('click', () => {
        buttons.forEach((item) => {
            const active = item === button
            item.setAttribute('aria-pressed', String(active))
            item.classList.toggle('is-active', active)
        })
        sync()
    })
})
sync()
`,
    html: `
<div class="form-section" data-sel-month-panel>
    <h3 class="form-section__title">结算月份</h3>
    <p class="form-section__desc">按钮组只负责选月份，年份固定为 2026；写回值是 0 补位的 <code>yyyy-mm</code>。</p>
    <div class="kui-stack kui-stack--tight">
        <div class="kui-segmented" role="group" aria-label="选择月份" data-sel-months>
            <button type="button" aria-pressed="false" data-sel-month="1">1 月</button>
            <button type="button" aria-pressed="false" data-sel-month="2">2 月</button>
            <button type="button" aria-pressed="false" data-sel-month="3">3 月</button>
            <button type="button" aria-pressed="false" data-sel-month="4">4 月</button>
            <button type="button" aria-pressed="false" data-sel-month="5">5 月</button>
            <button type="button" aria-pressed="false" data-sel-month="6">6 月</button>
            <button type="button" aria-pressed="false" data-sel-month="7">7 月</button>
            <button type="button" aria-pressed="false" data-sel-month="8">8 月</button>
            <button type="button" aria-pressed="false" data-sel-month="9">9 月</button>
            <button type="button" aria-pressed="true" class="is-active" data-sel-month="10">10 月</button>
            <button type="button" aria-pressed="false" data-sel-month="11">11 月</button>
            <button type="button" aria-pressed="false" data-sel-month="12">12 月</button>
        </div>
        <span class="form-hint">已选月份：<strong data-sel-month-result>2026 年 10 月</strong></span>
        <span class="form-hint">写回值：<code data-sel-month-value>2026-10</code></span>
    </div>
</div>`,
})}

${sectionTitle('结果回填', '选择完成后把结果集中展示一次，方便核对角色、大区、城市、标签、颜色、时间、范围与图标是否都符合预期。')}

${demo({
    title: '已选结果',
    desc: '下面这张表汇总本页所有选择；选择变化时自动刷新，也可以点「刷新结果」手动读取一次。',
    stage: 'tinted',
    tags: ['val()', '已选结果', '结果回填'],
    script: `
const read = (): void => {
    const role = document.querySelector<HTMLSelectElement>('[data-sel-role]')
    const scope = document.querySelector<HTMLSelectElement>('[data-sel-scope]')
    const city = document.querySelector<HTMLSelectElement>('[data-sel-city]')
    const tags = document.querySelector<HTMLSelectElement>('[data-sel-tags]')
    const color = document.querySelector<HTMLInputElement>('[data-sel-color]')
    const date = document.querySelector<HTMLInputElement>('[data-sel-date]')
    const icon = document.querySelector<HTMLElement>('[data-sel-icon-value]')

    const text = (element: HTMLSelectElement): string =>
        Array.from(element.selectedOptions)
            .filter((option) => option.value !== '')
            .map((option) => option.textContent ?? '')
            .join('、') || '未选择'

    const set = (name: string, value: string): void => {
        const target = document.querySelector<HTMLElement>('[data-sel-result-' + name + ']')
        if (target) target.textContent = value
    }

    if (role) set('role', text(role))
    if (scope) set('scope', text(scope))
    if (city) set('city', text(city))
    if (tags) set('tags', text(tags))
    if (color) set('color', color.value || '未设置')
    if (date) set('date', date.value || '未设置')
    if (icon) set('icon', icon.textContent ?? '未选择')
}

document.querySelector('[data-sel-refresh]')?.addEventListener('click', read)
read()
`,
    html: `
<div class="form-section">
    <div class="kui-cluster kui-justify-between">
        <div>
            <h3 class="form-section__title">本次选择</h3>
            <p class="form-section__desc">结果来自上面各个选择器，刷新按钮只读取当前值，不修改选项。</p>
        </div>
        <button type="button" class="btn btn-default btn-sm" data-sel-refresh>
            <i class="fa fa-refresh" aria-hidden="true"></i> 刷新结果
        </button>
    </div>
    <dl class="kui-descriptions">
        <div class="kui-descriptions__item"><dt>成员角色</dt><dd data-sel-result-role>未选择</dd></div>
        <div class="kui-descriptions__item"><dt>可见大区</dt><dd data-sel-result-scope>华东大区、华南大区</dd></div>
        <div class="kui-descriptions__item"><dt>交付城市</dt><dd data-sel-result-city>杭州</dd></div>
        <div class="kui-descriptions__item"><dt>内容标签</dt><dd data-sel-result-tags>渠道复盘、库存</dd></div>
        <div class="kui-descriptions__item"><dt>主题色</dt><dd><code data-sel-result-color>#2563eb</code></dd></div>
        <div class="kui-descriptions__item"><dt>生效时间</dt><dd data-sel-result-date>2026-10-27 09:30</dd></div>
        <div class="kui-descriptions__item"><dt>活动周期</dt><dd data-sel-result-range>开始 2026-10-01 · 结束 2026-10-12</dd></div>
        <div class="kui-descriptions__item"><dt>工作日</dt><dd data-sel-result-weekday>周一、周二、周三、周四、周五</dd></div>
        <div class="kui-descriptions__item"><dt>结算月份</dt><dd data-sel-result-month>2026 年 10 月</dd></div>
        <div class="kui-descriptions__item"><dt>导航图标</dt><dd><code data-sel-result-icon>fa fa-star</code></dd></div>
    </dl>
</div>`,
})}

${propsTable([
    { name: 'noneSelectedText', type: 'string', defaultValue: '没有选中任何选项', desc: '单选未选中时按钮上的占位文案。' },
    { name: 'countSelectedText', type: 'string', defaultValue: '已选中{1}项中的{0}项', desc: '多选超过一项时的汇总文案，<code>{0}</code> 为已选数。' },
    { name: 'style', type: 'string', defaultValue: 'btn-select', desc: '触发按钮的风格类名，与 .btn 组合决定高度与边框。' },
    { name: 'val() / refresh()', type: 'method', desc: '读取或写入选择值；动态增删 option 后调用 refresh 重建菜单。' },
    { name: 'selectAll() / deselectAll()', type: 'method', desc: '全选与清空，多选场景下会同步标签与菜单状态。' },
    { name: '.selectpicker-selection', type: 'class', desc: '多选回填的可移除标签，关闭按钮与键盘退格都能删除。' },
    { name: 'colors / lineCount / tileSize', type: 'string[] / number / number', defaultValue: '9 色 / 5 / 30', desc: '色板颜色、每行列数与色块尺寸；色板浮层最多显示 13rem 高。' },
    { name: 'updateText', type: 'string', desc: '接收当前十六进制值的元素选择器，选色后同步更新文案。' },
    { name: 'DateTimePicker.autoclose', type: 'boolean', defaultValue: 'true', desc: '选完立即收起；需要「取消 / 确定」时设为 false。' },
    { name: 'DateTimePicker.mode', type: "'datetime' | 'date' | 'month' | 'week' | 'time' | 'year'", defaultValue: "'datetime'", desc: '选择粒度：datetime → <code>yyyy-mm-dd hh:ii</code>、date → <code>yyyy-mm-dd</code>、month → <code>yyyy-mm</code>、week → 星期选择（<code>周一…周日</code>）、time → <code>hh:ii:ss</code>、year → <code>yyyy</code>；year 与 week 的浮层用 select，year 列出近 30 年及未来 5 年。' },
    { name: 'DateTimePicker.format', type: 'string', defaultValue: '按 mode', desc: '写回输入框的格式，支持 <code>yyyy</code> / <code>mm</code> / <code>dd</code> / <code>hh</code> / <code>ii</code> / <code>ss</code>；week 模式固定写回星期名，忽略自定义格式。' },
    { name: 'DateTimePicker.todayBtn', type: 'boolean', defaultValue: 'true', desc: '是否提供「今天」；time 模式下按钮文案为「现在」。' },
    { name: 'DateTimePicker min / max', type: 'attribute', desc: '写在触发输入框上的属性，浮层打开时同步到内部控件，超出范围的日期 / 时间不可选。' },
    { name: 'DateTimePicker 清空 / 取消 / 确定', type: 'action', defaultValue: '清空 · 取消 · 确定', desc: '浮层内动作：清空置 null，取消回退到打开前的值，确定把浮层里的值写回输入框；都需要 autoclose: false 才能停在页面上。' },
    { name: 'DateTimePicker.getDate() / setDate()', type: 'method', desc: '读取或写入 Date；month / year 归一到当月 1 日或当年 1 月 1 日，week 保留所选星期几并返回本周对应的那一天，time 使用 1970-01-01 承载时分秒。<code>setDate(null)</code> 等价于清空，写入后触发 change 事件。' },
    { name: 'data-mode="date"', type: 'attribute', desc: '等价于 <code>mode</code>，用于 data API 场景；输入框自身是原生 date / month / time 时也会按 type 推断模式。' },
    { name: 'data-provide="datetimepicker-inline"', type: 'attribute', desc: '内联模式：面板常驻展开、不再需要点击触发，适合嵌进设置页或侧栏。' },
    { name: 'DateRangePicker.getOrCreate(element, options)', type: 'method', desc: '日期范围选择器：触发区是一个只读 input，浮层里第一次点日期定开始、第二次定结束，开始与结束之间高亮；确定后写回并触发 <code>kui:daterange:change</code>。' },
    { name: 'DateRangePicker.min / max', type: 'string | Date', desc: '可选范围，也可直接写在输入框的 <code>min</code> / <code>max</code> 属性上（yyyy-mm-dd）；超出范围的天不可选，开始日期之前的月份不可翻到。' },
    { name: 'DateRangePicker.placeholder', type: 'string', defaultValue: '选择日期范围', desc: '未选择时输入框里的占位文案。' },
    { name: 'DateRangePicker.separator', type: 'string', defaultValue: ' → ', desc: '开始与结束之间的分隔符，默认箭头。' },
    { name: 'DateRangePicker.onChange', type: '(value) => void', desc: '值写回后的回调，参数与 <code>kui:daterange:change</code> 的 payload 一致。' },
    { name: 'DateRangePicker.getValue() / getStart() / getEnd()', type: 'method', desc: '读取当前范围：getValue() 返回 <code>start</code> / <code>end</code>（yyyy-mm-dd 字符串）与 <code>startDate</code> / <code>endDate</code>（Date 或 null），getStart() / getEnd() 直接返回 Date 或 null。' },
    { name: 'DateRangePicker.setValue() / clear()', type: 'method', desc: '写入或清空范围；顺序不合法时自动对调，保证开始不晚于结束。' },
    { name: 'kui:daterange:change', type: 'event', desc: '确定 / 清空 / 取消后触发，<code>detail.payload</code> 含 <code>start</code>、<code>end</code>、<code>startDate</code>、<code>endDate</code>；开始与结束可以是单日范围（同一天）。' },
    { name: 'IconPicker.getOrCreate(element, options)', type: 'method', desc: '图标选择器：<code>icons</code> 为 <code>fa fa-*</code> 清单，<code>columns</code> 为每行列数，<code>search</code> 决定弹层是否带搜索框，<code>value</code> 是初始图标。' },
    { name: 'kui:selectpicker:change / kui:color-picker:change', type: 'event', desc: '选择变化事件，<code>detail.payload.value</code> 或 <code>detail.payload.color</code> 为当前值。' },
    { name: 'kui:datetimepicker:change', type: 'event', desc: '值写回后触发（输入、今天 / 现在、清空、取消、确定），<code>detail.payload.date</code> 为 Date 或 null。' },
    { name: 'kui:iconpicker:change', type: 'event', desc: '点选图标后触发，<code>detail.payload.icon</code> 为新的 class 名。' },
])}

`

    /** 图标选择器的当前值；结果表直接读它，不再反查 DOM */
    let selectedIcon = 'fa fa-star'

    const role = root.querySelector<HTMLSelectElement>('[data-sel-role]')
    if (role) {
        trackComponent(SelectPicker.getOrCreate(role))
    }

    const scope = root.querySelector<HTMLSelectElement>('[data-sel-scope]')
    const scopeCount = root.querySelector<HTMLElement>('[data-sel-scope-count]')
    if (scope) {
        const picker = SelectPicker.getOrCreate(scope, { countSelectedText: '已选中 {1} 个大区中的 {0} 个' })
        trackComponent(picker)
        const syncScope = (): void => {
            const values = picker.val()
            if (scopeCount) {
                scopeCount.textContent = `已选 ${Array.isArray(values) ? values.length : 0} 个大区`
            }
        }
        scope.addEventListener('change', syncScope)
        root.querySelector<HTMLElement>('[data-sel-clear-scope]')?.addEventListener('click', () => {
            picker.deselectAll()
            syncScope()
        })
    }

    const city = root.querySelector<HTMLSelectElement>('[data-sel-city]')
    if (city) {
        const citySearch = root.querySelector<HTMLInputElement>('[data-sel-city-search]')
        const cityCount = root.querySelector<HTMLElement>('[data-sel-city-count]')
        const picker = SelectPicker.getOrCreate(city)
        trackComponent(picker)
        const all = Array.from(city.options)
            .filter((option) => option.value !== '')
            .map((option) => ({ value: option.value, label: option.textContent ?? '' }))

        const renderCities = (): void => {
            const keyword = citySearch?.value.trim() ?? ''
            const current = city.value
            const matched = all.filter((option) => option.label.includes(keyword))
            const placeholder = new Option('请选择城市', '')
            placeholder.disabled = true
            placeholder.selected = current === '' || !matched.some((option) => option.value === current)
            city.replaceChildren(placeholder, ...matched.map((option) => new Option(option.label, option.value)))
            if (!placeholder.selected) {
                city.value = current
            }
            picker.refresh()
            if (cityCount) {
                cityCount.textContent = keyword ? `匹配 ${matched.length} 个城市` : `共 ${all.length} 个城市`
            }
            syncResult()
        }

        citySearch?.addEventListener('input', renderCities)
        root.querySelector<HTMLElement>('[data-sel-city-clear]')?.addEventListener('click', () => {
            if (citySearch) {
                citySearch.value = ''
                renderCities()
                citySearch.focus()
            }
        })
    }

    const tags = root.querySelector<HTMLSelectElement>('[data-sel-tags]')
    if (tags) {
        const tagInput = root.querySelector<HTMLInputElement>('[data-sel-new-tag]')
        const tagError = root.querySelector<HTMLElement>('[data-sel-tag-error]')
        const tagCount = root.querySelector<HTMLElement>('[data-sel-tag-count]')
        const picker = SelectPicker.getOrCreate(tags)
        trackComponent(picker)

        const syncTagCount = (): void => {
            if (tagCount) {
                tagCount.textContent = `现有 ${tags.options.length} 个标签，已选 ${tags.selectedOptions.length} 个`
            }
        }

        const addTag = (): void => {
            if (!tagInput) {
                return
            }
            const label = tagInput.value.trim()
            if (!label) {
                tagInput.classList.add('is-invalid')
                tagInput.setAttribute('aria-invalid', 'true')
                if (tagError) {
                    tagError.hidden = false
                }
                return
            }
            tagInput.classList.remove('is-invalid')
            tagInput.setAttribute('aria-invalid', 'false')
            if (tagError) {
                tagError.hidden = true
            }

            let option = Array.from(tags.options).find((item) => item.value === label)
            if (!option) {
                option = new Option(label, label)
                tags.append(option)
            }
            option.selected = true
            picker.refresh()
            picker.val(Array.from(tags.selectedOptions).map((item) => item.value))
            syncTagCount()
            tagInput.value = ''
            tagInput.focus()
        }

        tags.addEventListener('change', syncTagCount)
        root.querySelector<HTMLElement>('[data-sel-add-tag]')?.addEventListener('click', addTag)
        tagInput?.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault()
                addTag()
            }
        })
        tagInput?.addEventListener('input', () => {
            tagInput.classList.remove('is-invalid')
            tagInput.setAttribute('aria-invalid', 'false')
            if (tagError) {
                tagError.hidden = true
            }
        })
    }

    const color = root.querySelector<HTMLInputElement>('[data-sel-color]')
    if (color) {
        trackComponent(
            ColorPicker.getOrCreate(color, {
                title: '选色',
                colors: ['#2563eb', '#0ea5e9', '#14b8a6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#0f172a'],
                lineCount: 9,
                tileSize: 26,
                updateText: '[data-sel-color-hex]',
            }),
        )
        color.addEventListener('change', () => {
            const hex = root.querySelector<HTMLElement>('[data-sel-color-hex]')
            if (hex) {
                hex.textContent = color.value || '未设置'
            }
            syncResult()
        })
    }

    const dateForm = root.querySelector<HTMLFormElement>('[data-sel-datetime-form]')
    if (dateForm) {
        const date = dateForm.querySelector<HTMLInputElement>('[data-sel-date]')
        const dateResult = dateForm.querySelector<HTMLElement>('[data-sel-date-result]')
        const dateEvent = dateForm.querySelector<HTMLElement>('[data-sel-date-event]')

        if (date) {
            const picker = DateTimePicker.getOrCreate(date, { autoclose: false, todayBtn: true })
            trackComponent(picker)
            let pendingAction = ''

            // 捕获阶段先记下点的是哪个动作，change 事件里再据此写说明
            date.parentElement?.addEventListener(
                'click',
                (event) => {
                    const button = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-kui-datetime-action]') : null
                    if (button) {
                        pendingAction = button.dataset.kuiDatetimeAction ?? ''
                    }
                },
                true,
            )

            const showPicker = (): void => picker.show(false)
            date.addEventListener('focus', showPicker)
            date.addEventListener('click', showPicker)
            date.addEventListener('kui:datetimepicker:change', (event) => {
                const value = (event as CustomEvent<KuiEventDetail<DateTimePayload>>).detail.payload?.date ?? null
                const action = pendingAction
                pendingAction = ''
                if (dateResult) {
                    dateResult.textContent = `当前已选：${formatDateTime(value)}`
                }
                if (dateEvent) {
                    if (action === 'cancel') {
                        dateEvent.textContent = `取消 → 回退到打开前的 ${formatDateTime(value)}`
                    } else if (action === 'clear') {
                        dateEvent.textContent = '清空 → 已移除时间'
                    } else if (action === 'confirm') {
                        dateEvent.textContent = `确定 → 写回 ${formatDateTime(value)}`
                    } else if (action === 'today') {
                        dateEvent.textContent = `今天 → ${formatDateTime(value)}`
                    } else {
                        dateEvent.textContent = `输入框变更 → 写回 ${formatDateTime(value)}`
                    }
                }
                syncResult()
            })
            if (dateResult) {
                dateResult.textContent = `当前已选：${formatDateTime(picker.getDate())}`
            }
        }

        const autoDate = dateForm.querySelector<HTMLInputElement>('[data-sel-date-auto]')
        const autoState = dateForm.querySelector<HTMLElement>('[data-sel-date-auto-state]')
        if (autoDate) {
            const picker = DateTimePicker.getOrCreate(autoDate, { autoclose: true })
            trackComponent(picker)
            autoDate.addEventListener('focus', () => picker.show(false))
            autoDate.addEventListener('click', () => picker.show(false))
            autoDate.addEventListener('kui:datetimepicker:change', (event) => {
                const value = (event as CustomEvent<KuiEventDetail<DateTimePayload>>).detail.payload?.date ?? null
                if (autoState) {
                    autoState.textContent = `autoclose: true，最近一次写回 ${formatDateTime(value)}`
                }
            })
        }

        const formatDateInput = dateForm.querySelector<HTMLInputElement>('[data-sel-date-format]')
        if (formatDateInput) {
            const picker = DateTimePicker.getOrCreate(formatDateInput, { autoclose: false, format: 'yyyy年mm月dd日 hh:ii', todayBtn: false })
            trackComponent(picker)
            formatDateInput.addEventListener('focus', () => picker.show(false))
            formatDateInput.addEventListener('click', () => picker.show(false))
        }

        const rangeDate = dateForm.querySelector<HTMLInputElement>('[data-sel-date-range]')
        if (rangeDate) {
            const picker = DateTimePicker.getOrCreate(rangeDate, { autoclose: false, todayBtn: true })
            trackComponent(picker)
            rangeDate.addEventListener('focus', () => picker.show(false))
            rangeDate.addEventListener('click', () => picker.show(false))
        }
    }

    const inlineHost = root.querySelector<HTMLElement>('[data-sel-dt-inline]')
    if (inlineHost) {
        const picker = DateTimePicker.getOrCreate(inlineHost)
        trackComponent(picker)
        // 内联面板常驻展开，不需要 aria-expanded；普通 div 上也不允许该属性
        inlineHost.removeAttribute('aria-expanded')
        picker.setDate('2026-11-05 09:00')
        const inlineValue = root.querySelector<HTMLElement>('[data-sel-dt-inline-value]')
        const inlineEvent = root.querySelector<HTMLElement>('[data-sel-dt-inline-event]')

        const syncInline = (value: Date | null): void => {
            if (inlineValue) {
                inlineValue.textContent = formatDateTime(value)
            }
        }

        inlineHost.addEventListener('kui:datetimepicker:change', (event) => {
            const value = (event as CustomEvent<KuiEventDetail<DateTimePayload>>).detail.payload?.date ?? null
            syncInline(value)
            if (inlineEvent) {
                inlineEvent.textContent = `写回：${formatDateTime(value)}`
            }
        })
        syncInline(picker.getDate())
    }

    const dateRangeForm = root.querySelector<HTMLFormElement>('[data-sel-date-range-form]')
    if (dateRangeForm) {
        const rangeInput = dateRangeForm.querySelector<HTMLInputElement>('[data-sel-daterange]')
        const daysBadge = dateRangeForm.querySelector<HTMLElement>('[data-sel-range-days]')
        const valuesLine = dateRangeForm.querySelector<HTMLElement>('[data-sel-range-values]')
        const rangeError = dateRangeForm.querySelector<HTMLElement>('[data-sel-range-error]')
        const rangeResult = dateRangeForm.querySelector<HTMLElement>('[data-sel-range-result]')
        const rangeResultText = dateRangeForm.querySelector<HTMLElement>('[data-sel-range-result-text]')
        const rangeEvent = dateRangeForm.querySelector<HTMLElement>('[data-sel-range-event]')

        if (rangeInput) {
            // 顺序由组件保证：这里只根据已确认的 start / end 显示天数与起止值
            const renderRange = (value: DateRangeValue): void => {
                const totalDays = value.startDate && value.endDate
                    ? Math.round((value.endDate.getTime() - value.startDate.getTime()) / 86400000) + 1
                    : 0
                if (daysBadge) {
                    daysBadge.textContent = totalDays ? `共 ${totalDays} 天` : '共 — 天'
                }
                if (valuesLine) {
                    valuesLine.textContent = `开始 ${value.start || '未设置'} · 结束 ${value.end || '未设置'}`
                }
                if (rangeError) {
                    rangeError.hidden = true
                }
                syncResult()
            }

            const rangePicker = DateRangePicker.getOrCreate(rangeInput, {
                min: '2026-09-01',
                max: '2027-03-31',
                onChange: renderRange,
            })
            trackComponent(rangePicker)

            rangeInput.addEventListener('kui:daterange:change', (event) => {
                const value = (event as CustomEvent<KuiEventDetail<DateRangeValue>>).detail.payload
                if (rangeEvent) {
                    rangeEvent.textContent = value && value.start && value.end
                        ? `最近写回：${value.start} → ${value.end}`
                        : '最近写回：已清空'
                }
                if (rangeResult) {
                    rangeResult.hidden = true
                }
                syncResult()
            })

            dateRangeForm.addEventListener('submit', (event) => {
                event.preventDefault()
                const startDate = rangePicker.getStart()
                const endDate = rangePicker.getEnd()
                // 组件已保证 start <= end，提交时只校验范围是否完整
                if (!startDate || !endDate) {
                    if (rangeError) {
                        rangeError.textContent = '请选择完整的开始与结束日期。'
                        rangeError.hidden = false
                    }
                    rangeInput.classList.add('is-invalid')
                    rangeInput.setAttribute('aria-invalid', 'true')
                    if (rangeResult) {
                        rangeResult.hidden = true
                    }
                    return
                }
                rangeInput.classList.remove('is-invalid')
                rangeInput.setAttribute('aria-invalid', 'false')
                if (rangeError) {
                    rangeError.hidden = true
                }
                if (rangeResultText) {
                    const totalDays = Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1
                    const value = rangePicker.getValue()
                    rangeResultText.textContent = `已提交 ${value.start} 至 ${value.end}，共 ${totalDays} 天。`
                }
                if (rangeResult) {
                    rangeResult.hidden = false
                }
            })

            renderRange(rangePicker.getValue())
        }
    }

    const dateTimeRangeForm = root.querySelector<HTMLFormElement>('[data-sel-datetime-range-form]')
    if (dateTimeRangeForm) {
        const startInput = dateTimeRangeForm.querySelector<HTMLInputElement>('[data-sel-dt-range-start]')
        const endInput = dateTimeRangeForm.querySelector<HTMLInputElement>('[data-sel-dt-range-end]')
        const duration = dateTimeRangeForm.querySelector<HTMLElement>('[data-sel-dt-range-duration]')
        const rangeError = dateTimeRangeForm.querySelector<HTMLElement>('[data-sel-dt-range-error]')

        if (startInput && endInput) {
            const startPicker = DateTimePicker.getOrCreate(startInput, { autoclose: false })
            const endPicker = DateTimePicker.getOrCreate(endInput, { autoclose: false })
            trackComponent(startPicker)
            trackComponent(endPicker)
            let pendingAction = ''

            // 捕获阶段先记下点的是哪个动作，change 事件里再决定是否计算时长
            dateTimeRangeForm.addEventListener(
                'click',
                (event) => {
                    const button = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-kui-datetime-action]') : null
                    if (button) {
                        pendingAction = button.dataset.kuiDatetimeAction ?? ''
                    }
                },
                true,
            )

            const renderDuration = (): void => {
                const startDate = startPicker.getDate()
                const endDate = endPicker.getDate()
                if (!startDate || !endDate) {
                    if (duration) {
                        duration.textContent = '请选择完整的开始与结束时间。'
                    }
                    if (rangeError) {
                        rangeError.hidden = true
                    }
                    return
                }
                if (endDate.getTime() < startDate.getTime()) {
                    if (duration) {
                        duration.textContent = '区间无效：结束时间早于开始时间。'
                    }
                    if (rangeError) {
                        rangeError.hidden = false
                    }
                    return
                }
                if (rangeError) {
                    rangeError.hidden = true
                }
                const totalMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000)
                const parts: string[] = []
                if (Math.floor(totalMinutes / 1440)) {
                    parts.push(`${Math.floor(totalMinutes / 1440)} 天`)
                }
                if (Math.floor((totalMinutes % 1440) / 60)) {
                    parts.push(`${Math.floor((totalMinutes % 1440) / 60)} 小时`)
                }
                if (totalMinutes % 60) {
                    parts.push(`${totalMinutes % 60} 分钟`)
                }
                if (!parts.length) {
                    parts.push('不足 1 分钟')
                }
                if (duration) {
                    duration.textContent = `区间时长：${parts.join(' ')}（${formatDateTime(startDate)} 至 ${formatDateTime(endDate)}）`
                }
            }

            const onPickerChange = (): void => {
                const action = pendingAction
                pendingAction = ''
                if (action === 'confirm') {
                    renderDuration()
                }
            }

            startInput.addEventListener('focus', () => startPicker.show(false))
            startInput.addEventListener('click', () => startPicker.show(false))
            endInput.addEventListener('focus', () => endPicker.show(false))
            endInput.addEventListener('click', () => endPicker.show(false))
            startInput.addEventListener('kui:datetimepicker:change', onPickerChange)
            endInput.addEventListener('kui:datetimepicker:change', onPickerChange)
        }
    }

    root.querySelectorAll<HTMLInputElement>('[data-sel-mode-input]').forEach((input) => {
        const mode = (input.dataset.mode ?? 'datetime') as DateTimePickerMode
        const picker = DateTimePicker.getOrCreate(input, { mode })
        trackComponent(picker)
        const output = root.querySelector<HTMLElement>(`[data-sel-mode-out="${mode}"]`)
        const syncModeValue = (): void => {
            if (output) {
                output.textContent = input.value || '未设置'
            }
        }
        input.addEventListener('focus', () => picker.show(false))
        input.addEventListener('click', () => picker.show(false))
        input.addEventListener('kui:datetimepicker:change', syncModeValue)
        input.addEventListener('change', syncModeValue)
        syncModeValue()
    })

    const weekdayPanel = root.querySelector<HTMLElement>('[data-sel-weekday-panel]')
    if (weekdayPanel) {
        const buttons = Array.from(weekdayPanel.querySelectorAll<HTMLButtonElement>('[data-sel-weekday]'))
        const weekdayResult = weekdayPanel.querySelector<HTMLElement>('[data-sel-weekday-result]')
        const weekdayValue = weekdayPanel.querySelector<HTMLElement>('[data-sel-weekday-value]')

        const syncWeekdays = (): void => {
            const selected = buttons.filter((button) => button.getAttribute('aria-pressed') === 'true')
            if (weekdayResult) {
                weekdayResult.textContent = selected.length ? selected.map((button) => button.textContent ?? '').join('、') : '未选择'
            }
            if (weekdayValue) {
                weekdayValue.textContent = selected.map((button) => button.dataset.selWeekday ?? '').join(',') || '—'
            }
            syncResult()
        }

        buttons.forEach((button) => {
            button.addEventListener('click', () => {
                const pressed = button.getAttribute('aria-pressed') === 'true'
                button.setAttribute('aria-pressed', String(!pressed))
                button.classList.toggle('is-active', !pressed)
                syncWeekdays()
            })
        })
        syncWeekdays()
    }

    const monthPanel = root.querySelector<HTMLElement>('[data-sel-month-panel]')
    if (monthPanel) {
        const buttons = Array.from(monthPanel.querySelectorAll<HTMLButtonElement>('[data-sel-month]'))
        const monthResult = monthPanel.querySelector<HTMLElement>('[data-sel-month-result]')
        const monthValue = monthPanel.querySelector<HTMLElement>('[data-sel-month-value]')
        const monthYear = 2026

        const syncMonth = (): void => {
            const active = buttons.find((button) => button.getAttribute('aria-pressed') === 'true')
            const month = active ? Number(active.dataset.selMonth) : 0
            if (monthResult) {
                monthResult.textContent = month ? `${monthYear} 年 ${month} 月` : '未选择月份'
            }
            if (monthValue) {
                monthValue.textContent = month ? `${monthYear}-${String(month).padStart(2, '0')}` : '—'
            }
            syncResult()
        }

        buttons.forEach((button) => {
            button.addEventListener('click', () => {
                buttons.forEach((item) => {
                    const active = item === button
                    item.setAttribute('aria-pressed', String(active))
                    item.classList.toggle('is-active', active)
                })
                syncMonth()
            })
        })
        syncMonth()
    }

    const iconTrigger = root.querySelector<HTMLElement>('[data-sel-icon-picker]')
    if (iconTrigger) {
        trackComponent(
            IconPicker.getOrCreate(iconTrigger, {
                icons: iconChoices,
                columns: 8,
                search: true,
                value: 'fa fa-star',
            }),
        )
        iconTrigger.addEventListener('kui:iconpicker:change', (event) => {
            const icon = (event as CustomEvent<KuiEventDetail<IconPayload>>).detail.payload?.icon ?? ''
            if (!icon) {
                return
            }
            selectedIcon = icon
            const value = root.querySelector<HTMLElement>('[data-sel-icon-value]')
            const eventLine = root.querySelector<HTMLElement>('[data-sel-icon-event]')
            if (value) {
                value.textContent = icon
            }
            if (eventLine) {
                eventLine.textContent = `已回写：${icon}`
            }
            syncResult()
        })
    }

    function syncResult(): void {
        const roleSelect = root.querySelector<HTMLSelectElement>('[data-sel-role]')
        const scopeSelect = root.querySelector<HTMLSelectElement>('[data-sel-scope]')
        const citySelect = root.querySelector<HTMLSelectElement>('[data-sel-city]')
        const tagsSelect = root.querySelector<HTMLSelectElement>('[data-sel-tags]')
        const colorInput = root.querySelector<HTMLInputElement>('[data-sel-color]')
        const dateInput = root.querySelector<HTMLInputElement>('[data-sel-date]')
        const rangeLine = root.querySelector<HTMLElement>('[data-sel-range-values]')
        const weekdayLine = root.querySelector<HTMLElement>('[data-sel-weekday-result]')
        const monthLine = root.querySelector<HTMLElement>('[data-sel-month-result]')

        const selectedText = (element: HTMLSelectElement | null): string =>
            element
                ? Array.from(element.selectedOptions)
                      .filter((option) => option.value !== '')
                      .map((option) => option.textContent ?? '')
                      .join('、') || '未选择'
                : '未选择'

        const setResult = (name: string, value: string): void => {
            const target = root.querySelector<HTMLElement>(`[data-sel-result-${name}]`)
            if (target) {
                target.textContent = value
            }
        }

        setResult('role', selectedText(roleSelect))
        setResult('scope', selectedText(scopeSelect))
        setResult('city', selectedText(citySelect))
        setResult('tags', selectedText(tagsSelect))
        setResult('color', colorInput?.value || '未设置')
        setResult('date', dateInput?.value || '未设置')
        setResult('range', rangeLine?.textContent ?? '未设置')
        setResult('weekday', weekdayLine?.textContent ?? '未选择')
        setResult('month', monthLine?.textContent ?? '未选择')
        setResult('icon', selectedIcon)
    }

    root.querySelectorAll<HTMLSelectElement>('[data-sel-role], [data-sel-scope], [data-sel-city], [data-sel-tags]').forEach((select) => {
        select.addEventListener('change', syncResult)
    })
    root.querySelector<HTMLElement>('[data-sel-refresh]')?.addEventListener('click', syncResult)
    syncResult()
}
