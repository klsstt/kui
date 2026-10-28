import { ColorPicker, IconPicker, Switchery, type KuiEventDetail } from '@kui/core'
import { trackComponent } from '../../context'
import { iconCategories } from '../../data/icons'
import type { DocPageContext } from '../../docs/types'
import { callout, codeSample, demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 基础表单。
 * 同一套字段语言按业务面板拆分：资料、上传、选择、图标与主题色、组合布局、凭证、提取、社交与费用清单。
 * 每个面板只解决一段填写任务，字段错误始终贴着自己的控件。
 */

/** 图标目录摊平成 `fa fa-*` 清单，供 IconPicker 使用 */
const iconChoices = iconCategories.flatMap((category) => category.icons.map((name) => `fa fa-${name}`))

export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '表单把一次填写拆成若干可核对的面板：每个面板只问一类问题，标签在上、控件占满一列，错误提示紧贴字段。两列只用于成对出现的信息，窄屏自动折成一列。',
    tags: ['.form-group', '.form-row', '.form-section', '.form-error'],
})}

${callout('字段级错误使用 <code>.form-error</code> 与 <code>aria-invalid</code>，在失焦和提交时同步更新；文件与头像只做本地预览，不会离开当前页面。')}

${sectionTitle('资料与上传', '先收集基础字段，再把文件与头像放在同一个信息块里，避免用户在多个页面之间来回跳。')}

${demo({
    title: '响应式表单',
    desc: '姓名、公司、邮箱与电话按两列排布，容器变窄时自动折成一列。公司字段展示错误态，邮箱展示成功态；失焦校验当前字段，提交时校验整张表单。',
    stage: 'tinted',
    tags: ['.form-row', '.is-invalid', '.is-valid'],
    script: `
const form = document.querySelector<HTMLFormElement>('[data-fb-responsive-form]')
const fields = Array.from(document.querySelectorAll<HTMLInputElement>('[data-fb-responsive-field]'))

const validate = (input: HTMLInputElement): boolean => {
    const empty = input.value.trim() === ''
    const invalid = empty || (input.type === 'email' && !input.checkValidity())
    input.classList.toggle('is-invalid', invalid)
    input.classList.toggle('is-valid', !invalid)
    input.setAttribute('aria-invalid', String(invalid))
    const error = input.closest('.form-group')?.querySelector<HTMLElement>('.form-error')
    if (error) error.hidden = !invalid
    return !invalid
}

fields.forEach((input) => {
    input.addEventListener('blur', () => validate(input))
    input.addEventListener('input', () => {
        if (input.getAttribute('aria-invalid') === 'true') validate(input)
    })
})

form?.addEventListener('submit', (event) => {
    event.preventDefault()
    const valid = fields.map(validate).every(Boolean)
    const result = document.querySelector<HTMLElement>('[data-fb-responsive-result]')
    if (result) result.hidden = !valid
})
`,
    html: `
<form class="form-section" data-fb-responsive-form novalidate>
    <h3 class="form-section__title">客户联系人</h3>
    <p class="form-section__desc">带星号的字段为必填；错误会在失焦后出现，重新输入时自动复核。</p>
    <div class="form-row">
        <div class="form-group">
            <label class="form-label" for="fb-contact-name">姓名<span class="required">*</span></label>
            <input class="form-control" id="fb-contact-name" type="text" value="林澈" autocomplete="name" data-fb-responsive-field>
        </div>
        <div class="form-group">
            <label class="form-label" for="fb-contact-company">公司<span class="required">*</span></label>
            <input class="form-control is-invalid" id="fb-contact-company" type="text" placeholder="请输入公司全称" aria-describedby="fb-contact-company-error" aria-invalid="true" data-fb-responsive-field>
            <span class="form-error" id="fb-contact-company-error">请输入公司全称</span>
        </div>
    </div>
    <div class="form-row">
        <div class="form-group">
            <label class="form-label" for="fb-contact-email">工作邮箱<span class="required">*</span></label>
            <input class="form-control is-valid" id="fb-contact-email" type="email" value="lin.che@kui.dev" autocomplete="email" aria-describedby="fb-contact-email-error" data-fb-responsive-field>
            <span class="form-error" id="fb-contact-email-error" hidden>请输入有效的邮箱地址</span>
        </div>
        <div class="form-group">
            <label class="form-label" for="fb-contact-phone">联系电话</label>
            <div class="input-group">
                <span class="input-addon"><i class="fa fa-phone" aria-hidden="true"></i></span>
                <input class="form-control" id="fb-contact-phone" type="tel" value="138 0000 1234" autocomplete="tel">
            </div>
            <span class="form-hint">用于配送异常时联系，不会展示在公开资料中。</span>
        </div>
    </div>
    <div class="kui-cluster kui-justify-between">
        <span class="form-hint">当前版本：2026-10-27 · 由林澈维护</span>
        <button type="submit" class="btn btn-primary">保存联系人</button>
    </div>
    <div class="alert alert-success" data-fb-responsive-result hidden>
        <i class="fa fa-check-circle" aria-hidden="true"></i>
        <div>联系人已保存，下一次核对会沿用这份资料。</div>
    </div>
</form>`,
})}

${demo({
    title: '输入与上传',
    desc: '文本框负责填写名称，文件选择显示选中文件的大小，头像在本地读取后立即预览；两类上传都保留文字状态，失败时用户知道下一步做什么。',
    tags: ['type="file"', '.kui-avatar', 'FileReader'],
    script: `
const fileInput = document.querySelector<HTMLInputElement>('[data-fb-file]')
const fileMeta = document.querySelector<HTMLElement>('[data-fb-file-meta]')

fileInput?.addEventListener('change', () => {
    const file = fileInput.files?.[0]
    if (!file || !fileMeta) return
    fileMeta.textContent = file.name + ' · ' + Math.ceil(file.size / 1024) + ' KB'
})

const avatarInput = document.querySelector<HTMLInputElement>('[data-fb-avatar-file]')
const avatarPreview = document.querySelector<HTMLImageElement>('[data-fb-avatar-preview]')
const avatarMeta = document.querySelector<HTMLElement>('[data-fb-avatar-meta]')

avatarInput?.addEventListener('change', () => {
    const file = avatarInput.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.addEventListener('load', () => {
        if (avatarPreview && typeof reader.result === 'string') avatarPreview.src = reader.result
    })
    reader.readAsDataURL(file)
    if (avatarMeta) avatarMeta.textContent = file.name + ' · 本地预览'
})
`,
    html: `
<form class="form-section" data-fb-upload-form>
    <h3 class="form-section__title">新建项目</h3>
    <p class="form-section__desc">名称会出现在项目列表里，附件与头像只用于当前草稿。</p>
    <div class="form-row">
        <div class="form-group">
            <label class="form-label" for="fb-project-name">项目名称<span class="required">*</span></label>
            <input class="form-control" id="fb-project-name" type="text" value="秋季门店陈列" autocomplete="off" required>
        </div>
        <div class="form-group">
            <label class="form-label" for="fb-attachment">项目附件</label>
            <input class="form-control" id="fb-attachment" type="file" accept=".pdf,.docx,image/*" data-fb-file>
            <span class="form-hint" data-fb-file-meta>支持 PDF、DOCX 与图片，大小不超过 10 MB</span>
        </div>
    </div>
    <div class="form-group">
        <span class="form-label">项目头像</span>
        <div class="kui-cluster">
            <span class="kui-avatar kui-avatar--xl">
                <img src="./images/portraits/1.jpg" alt="当前项目头像" data-fb-avatar-preview>
            </span>
            <div class="kui-stack kui-stack--tight">
                <label class="btn btn-default btn-sm" for="fb-avatar-file">
                    <i class="fa fa-upload" aria-hidden="true"></i> 更换头像
                </label>
                <input class="kui-visually-hidden" id="fb-avatar-file" type="file" accept="image/*" data-fb-avatar-file>
                <span class="form-hint" data-fb-avatar-meta>JPG / PNG，建议 1 : 1</span>
            </div>
        </div>
    </div>
    <div class="kui-cluster kui-justify-between">
        <span class="form-hint">附件与头像保存在草稿内，创建后可继续替换。</span>
        <div class="kui-cluster">
            <button type="reset" class="btn btn-default">重置</button>
            <button type="submit" class="btn btn-primary">创建项目</button>
        </div>
    </div>
    <div class="alert alert-success" data-fb-upload-result hidden>
        <i class="fa fa-check-circle" aria-hidden="true"></i>
        <div>项目已创建，附件与头像已写入草稿。</div>
    </div>
</form>`,
})}

${demo({
    title: '选择与勾选',
    desc: '部门用单选下拉，通知渠道用复选框，值班时段用互斥单选，工作台状态用开关。四种控件共用 .form-group 的标签与间距。',
    tags: ['select', 'checkbox', 'radio', 'Switchery'],
    script: `
const toggle = document.querySelector<HTMLInputElement>('[data-fb-workbench]')!
const state = document.querySelector<HTMLElement>('[data-fb-workbench-state]')

Switchery.getOrCreate(toggle)

toggle.addEventListener('change', () => {
    if (state) state.textContent = toggle.checked ? '当前：接单后自动置为忙碌' : '当前：保持在线'
})
`,
    html: `
<div class="form-section">
    <h3 class="form-section__title">工作台偏好</h3>
    <p class="form-section__desc">这些选项决定通知怎么发、工单怎么分配，可以在设置里随时调整。</p>
    <div class="form-row">
        <div class="form-group">
            <label class="form-label" for="fb-department">所属部门</label>
            <select class="form-control" id="fb-department">
                <option>客户成功</option>
                <option>供应链</option>
                <option>财务</option>
                <option>设计</option>
            </select>
            <span class="form-hint">部门决定默认的工单池。</span>
        </div>
        <div class="form-group">
            <span class="form-label">通知渠道</span>
            <div class="kui-stack kui-stack--tight">
                <label class="form-check"><input type="checkbox" name="fb-notice" value="email" checked><span>邮件摘要</span></label>
                <label class="form-check"><input type="checkbox" name="fb-notice" value="im" checked><span>即时消息</span></label>
                <label class="form-check"><input type="checkbox" name="fb-notice" value="sms"><span>短信提醒</span></label>
            </div>
        </div>
    </div>
    <div class="form-row">
        <div class="form-group">
            <span class="form-label">值班时段</span>
            <div class="kui-cluster">
                <label class="form-check"><input type="radio" name="fb-shift" value="day" checked><span>白班</span></label>
                <label class="form-check"><input type="radio" name="fb-shift" value="night"><span>夜班</span></label>
                <label class="form-check"><input type="radio" name="fb-shift" value="flex"><span>弹性</span></label>
            </div>
            <span class="form-hint">切换时段会影响新工单的分配顺序。</span>
        </div>
        <div class="form-group">
            <span class="form-label">工作台状态</span>
            <label class="form-switch">
                <input type="checkbox" data-kui-switchery data-fb-workbench checked>
                <span>接单后自动置为忙碌</span>
            </label>
            <span class="form-hint" data-fb-workbench-state>当前：接单后自动置为忙碌</span>
        </div>
    </div>
</div>`,
})}

${demo({
    title: '图标字段',
    desc: '触发按钮显示当前图标与名称，点开后是可搜索的图标网格；点选后按钮、取值与右侧预览同步更新，并触发 <code>kui:iconpicker:change</code>。',
    stage: 'tinted',
    tags: ['IconPicker', 'search', 'kui:iconpicker:change'],
    script: `
const icons = iconCategories.flatMap((category) => category.icons.map((name) => 'fa fa-' + name))

const trigger = document.querySelector<HTMLElement>('[data-fb-icon-picker]')!
const iconPreview = document.querySelector<HTMLElement>('[data-fb-icon-preview]')
const iconValue = document.querySelector<HTMLElement>('[data-fb-icon-value]')
const iconName = document.querySelector<HTMLElement>('[data-fb-icon-name]')
const eventLine = document.querySelector<HTMLElement>('[data-fb-icon-event]')

IconPicker.getOrCreate(trigger, { icons, columns: 8, search: true, value: 'fa fa-star' })

trigger.addEventListener('kui:iconpicker:change', (event) => {
    const icon = (event as CustomEvent<{ payload?: { icon: string } }>).detail.payload?.icon ?? ''
    if (!icon) return
    if (iconPreview) iconPreview.className = icon
    if (iconValue) iconValue.textContent = icon
    if (iconName) iconName.textContent = icon.replace(/^fa\\s+/, '')
    if (eventLine) eventLine.textContent = '图标已写回：' + icon
})
`,
    html: `
<div class="form-section" data-fb-icon-form>
    <h3 class="form-section__title">应用图标</h3>
    <p class="form-section__desc">图标会显示在导航项与卡片标题上；按钮上保留当前图标与名称，弹层里按名称搜索即可缩小范围。</p>
    <div class="kui-split" style="--kui-split-sidebar: 20rem">
        <div class="kui-stack">
            <div class="form-group">
                <span class="form-label">图标字段</span>
                <div data-kui-icon-picker data-fb-icon-picker aria-label="选择导航图标"></div>
                <span class="form-hint">弹层里输入 star、user 或 bell 都能过滤，点选后按钮显示图标与名称。</span>
            </div>
        </div>
        <div class="kui-stack kui-stack--tight">
            <span class="form-label">导航预览</span>
            <div class="kui-cluster">
                <span class="kui-avatar kui-avatar--square kui-avatar--lg">
                    <i class="fa fa-star" aria-hidden="true" data-fb-icon-preview></i>
                </span>
                <strong data-fb-icon-name>fa-star</strong>
            </div>
            <dl class="kui-descriptions">
                <div class="kui-descriptions__item"><dt>当前图标</dt><dd><code data-fb-icon-value>fa fa-star</code></dd></div>
                <div class="kui-descriptions__item"><dt>弹层</dt><dd>触发按钮 + 可搜索的图标网格</dd></div>
                <div class="kui-descriptions__item"><dt>最近事件</dt><dd data-fb-icon-event>尚未触发</dd></div>
            </dl>
            <p class="form-hint">图标清单来自 FA 4.7 目录（iconCategories），页面不需要再维护一份；点选后由 change 事件负责回写。</p>
        </div>
    </div>
</div>`,
})}

${codeSample(`
import { IconPicker } from '@kui/core'
import { iconCategories } from '../../data/icons'

const icons = iconCategories.flatMap((category) => category.icons.map((name) => 'fa fa-' + name))

IconPicker.getOrCreate(document.querySelector('[data-kui-icon-picker]')!, {
    icons,
    columns: 8,
    search: true,
    value: 'fa fa-star',
})
`, 'ts', '挂载图标选择器')}

${demo({
    title: '颜色字段',
    desc: '输入框承载十六进制值，色板与输入双向同步：点色块写回输入框，手改色值会点亮对应色块，并触发 <code>kui:color-picker:change</code>。',
    tags: ['ColorPicker', 'colors', 'updateText'],
    script: `
const color = document.querySelector<HTMLInputElement>('[data-fb-app-color]')!
const eventLine = document.querySelector<HTMLElement>('[data-fb-color-event]')

ColorPicker.getOrCreate(color, {
    title: '选色',
    colors: ['#2563eb', '#0ea5e9', '#14b8a6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#0f172a'],
    lineCount: 9,
    tileSize: 24,
    updateText: '[data-fb-color-hex]',
})

color.addEventListener('change', () => {
    if (eventLine) eventLine.textContent = '主题色已写回：' + (color.value || '未设置')
})
`,
    html: `
<div class="form-section" data-fb-brand-color>
    <h3 class="form-section__title">主题色</h3>
    <p class="form-section__desc">主题色决定导航、按钮与图表强调色；色板与输入框读写同一个十六进制值。</p>
    <div class="kui-split" style="--kui-split-sidebar: 18rem">
        <div class="kui-stack kui-stack--tight">
            <label class="form-label" for="fb-app-color">主题色</label>
            <input class="form-control" id="fb-app-color" type="text" value="#2563eb" autocomplete="off" aria-describedby="fb-app-color-hint" data-fb-app-color>
        </div>
        <div class="kui-stack kui-stack--tight">
            <p class="form-hint" id="fb-app-color-hint">色板放在页面流里、没有套任何滚动容器；选色后写回输入框并触发 <code>kui:color-picker:change</code>。</p>
            <dl class="kui-descriptions">
                <div class="kui-descriptions__item"><dt>当前色值</dt><dd><code data-fb-color-hex>#2563eb</code></dd></div>
                <div class="kui-descriptions__item"><dt>应用范围</dt><dd>导航、按钮与图表强调色</dd></div>
                <div class="kui-descriptions__item"><dt>色板</dt><dd>8 个预设色 +「不设置」</dd></div>
                <div class="kui-descriptions__item"><dt>最近事件</dt><dd data-fb-color-event>尚未触发</dd></div>
            </dl>
            <p class="form-hint">选中的色值会同时写回输入框与页面里的回显位置；点「不设置」会清空输入框并移除主题色。</p>
        </div>
    </div>
</div>`,
})}

${sectionTitle('组合布局', '当一张表单跨越多段业务时，用 .form-section 分段、用 .form-row 排成两列；每段只保留一个标题和一句说明。')}

${demo({
    title: '表单组合布局',
    desc: '活动报名拆成活动信息、参与设置、联系信息三段。每段内部两列成对排布，段与段之间留出可扫描的标题。',
    tags: ['.form-section', '.form-row', '段落标题'],
    html: `
<form class="kui-stack" data-fb-compose-form>
    <section class="form-section">
        <h3 class="form-section__title">活动信息</h3>
        <p class="form-section__desc">这一组决定活动是什么，以及在哪里发生。</p>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label" for="fb-event-title">活动名称<span class="required">*</span></label>
                <input class="form-control" id="fb-event-title" type="text" value="秋季陈列工作坊" required>
            </div>
            <div class="form-group">
                <label class="form-label" for="fb-event-type">活动类型</label>
                <select class="form-control" id="fb-event-type">
                    <option>线下培训</option>
                    <option>线上直播</option>
                    <option>门店走访</option>
                </select>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label" for="fb-event-date">开始日期</label>
                <input class="form-control" id="fb-event-date" type="date" value="2026-11-02">
            </div>
            <div class="form-group">
                <label class="form-label" for="fb-event-place">活动地点<span class="required">*</span></label>
                <input class="form-control" id="fb-event-place" type="text" value="杭州 · 余杭仓" required>
            </div>
        </div>
    </section>
    <section class="form-section">
        <h3 class="form-section__title">参与设置</h3>
        <p class="form-section__desc">人数上限与报名截止决定名额什么时候关闭。</p>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label" for="fb-event-capacity">人数上限</label>
                <div class="input-group">
                    <input class="form-control" id="fb-event-capacity" type="number" min="1" step="1" value="40">
                    <span class="input-addon">人</span>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label" for="fb-event-deadline">报名截止</label>
                <input class="form-control" id="fb-event-deadline" type="date" value="2026-10-30">
            </div>
        </div>
    </section>
    <section class="form-section">
        <h3 class="form-section__title">联系信息</h3>
        <p class="form-section__desc">报名成功后的通知会发送到这里。</p>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label" for="fb-event-owner">联系人<span class="required">*</span></label>
                <input class="form-control" id="fb-event-owner" type="text" value="苏晚" required>
            </div>
            <div class="form-group">
                <label class="form-label" for="fb-event-email">联系邮箱</label>
                <input class="form-control" id="fb-event-email" type="email" value="su.wan@kui.dev">
            </div>
        </div>
    </section>
    <div class="kui-cluster kui-justify-end">
        <button type="reset" class="btn btn-default">重置</button>
        <button type="submit" class="btn btn-primary">发布活动</button>
    </div>
    <div class="alert alert-success" data-fb-compose-result hidden>
        <i class="fa fa-check-circle" aria-hidden="true"></i>
        <div>活动已发布，报名页可以开始分享。</div>
    </div>
</form>`,
})}

${demo({
    title: '公积金提取表单',
    desc: '金额、银行卡与提取原因分别落在两列里；金额上限和卡号长度在提交时校验，承诺项不勾选就不会提交。',
    tags: ['.input-group', '.form-error', '提交校验'],
    stage: 'tinted',
    script: `
const form = document.querySelector<HTMLFormElement>('[data-fb-fund-form]')
const amount = document.querySelector<HTMLInputElement>('[data-fb-fund-amount]')
const card = document.querySelector<HTMLInputElement>('[data-fb-fund-card]')
const reason = document.querySelector<HTMLSelectElement>('[data-fb-fund-reason]')
const agree = document.querySelector<HTMLInputElement>('[data-fb-fund-agree]')

form?.addEventListener('submit', (event) => {
    event.preventDefault()
    const amountInvalid = !amount || Number(amount.value) < 1000 || Number(amount.value) > 86400
    const cardInvalid = !card || !/^\\d{16,19}$/.test(card.value.replace(/\\s/g, ''))
    const reasonInvalid = !reason?.value
    const agreeInvalid = !agree?.checked
    const valid = !amountInvalid && !cardInvalid && !reasonInvalid && !agreeInvalid
    const result = document.querySelector<HTMLElement>('[data-fb-fund-result]')
    if (result) result.hidden = !valid
})
`,
    html: `
<form class="form-section" data-fb-fund-form novalidate>
    <h3 class="form-section__title">公积金提取申请</h3>
    <p class="form-section__desc">可提取额度 ¥86,400.00，本次申请预计 3 个工作日内到账。</p>
    <div class="form-row">
        <div class="form-group">
            <label class="form-label" for="fb-fund-amount">提取金额<span class="required">*</span></label>
            <div class="input-group">
                <span class="input-addon">¥</span>
                <input class="form-control" id="fb-fund-amount" type="number" min="1000" max="86400" step="100" value="24000" data-fb-fund-amount>
                <span class="input-addon">元</span>
            </div>
            <span class="form-hint">单次最低 ¥1,000.00，不超过可提取额度。</span>
        </div>
        <div class="form-group">
            <label class="form-label" for="fb-fund-card">收款银行卡<span class="required">*</span></label>
            <div class="input-group">
                <span class="input-addon"><i class="fa fa-credit-card" aria-hidden="true"></i></span>
                <input class="form-control" id="fb-fund-card" type="text" inputmode="numeric" value="6222 0212 3456 7890" autocomplete="cc-number" data-fb-fund-card>
            </div>
            <span class="form-hint">仅支持申请人本人名下的一类储蓄卡。</span>
        </div>
    </div>
    <div class="form-row">
        <div class="form-group">
            <label class="form-label" for="fb-fund-reason">提取原因<span class="required">*</span></label>
            <select class="form-control" id="fb-fund-reason" data-fb-fund-reason>
                <option value="">请选择提取原因</option>
                <option value="buy">购买自住住房</option>
                <option value="loan">偿还住房贷款</option>
                <option value="rent">支付房租</option>
                <option value="retire">退休提取</option>
                <option value="other">其他情形</option>
            </select>
        </div>
        <div class="form-group">
            <label class="form-label" for="fb-fund-note">补充说明</label>
            <textarea class="form-control" id="fb-fund-note" rows="3" placeholder="例如：购房合同编号、贷款银行等"></textarea>
            <span class="form-hint">选填，审核人员会结合材料一并查看。</span>
        </div>
    </div>
    <div class="kui-stack kui-stack--tight">
        <label class="form-check">
            <input type="checkbox" data-fb-fund-agree>
            <span>我已确认填写信息真实，并同意按公积金管理规定接受核查</span>
        </label>
    </div>
    <div class="kui-cluster kui-justify-between">
        <div class="kui-stack kui-stack--tight">
            <span class="form-hint">材料齐全后通常 3 个工作日内完成审核。</span>
            <span class="form-error" data-fb-fund-error hidden>请检查金额、银行卡、提取原因与承诺项。</span>
        </div>
        <div class="kui-cluster">
            <button type="reset" class="btn btn-default">重置</button>
            <button type="submit" class="btn btn-primary">提交申请</button>
        </div>
    </div>
    <div class="alert alert-success" data-fb-fund-result hidden>
        <i class="fa fa-check-circle" aria-hidden="true"></i>
        <div>提取申请已提交，到账进度可在「我的公积金」里查看。</div>
    </div>
</form>`,
})}

${sectionTitle('业务表单', '凭证、资料与费用清单都要求字段可对照：表头说明列的含义，行内只放输入控件，合计与错误信息留在表尾。')}

${demo({
    title: '会计凭证表单',
    desc: '摘要、科目、借方与贷方按表格排列；输入金额时实时重算借贷合计，只有借贷相等且大于零才允许保存。',
    tags: ['table', '借贷合计', '表格化字段'],
    script: `
const form = document.querySelector<HTMLFormElement>('[data-fb-voucher-form]')
const error = document.querySelector<HTMLElement>('[data-fb-voucher-error]')
const debitTotal = document.querySelector<HTMLElement>('[data-fb-voucher-debit-total]')
const creditTotal = document.querySelector<HTMLElement>('[data-fb-voucher-credit-total]')

const sync = (): void => {
    let debit = 0
    let credit = 0
    form?.querySelectorAll<HTMLElement>('[data-fb-voucher-row]').forEach((row) => {
        debit += Number(row.querySelector<HTMLInputElement>('[data-fb-voucher-debit]')?.value) || 0
        credit += Number(row.querySelector<HTMLInputElement>('[data-fb-voucher-credit]')?.value) || 0
    })
    if (debitTotal) debitTotal.textContent = '¥ ' + debit.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
    if (creditTotal) creditTotal.textContent = '¥ ' + credit.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
    if (error) error.hidden = debit === credit && debit > 0
}

form?.addEventListener('input', sync)
form?.addEventListener('submit', (event) => {
    event.preventDefault()
    sync()
    const result = document.querySelector<HTMLElement>('[data-fb-voucher-result]')
    if (result) result.hidden = !error?.hidden
})
`,
    html: `
<form class="form-section" data-fb-voucher-form novalidate>
    <div class="kui-toolbar">
        <div class="kui-toolbar__group">
            <span class="badge badge-primary">记账凭证</span>
            <span class="form-hint">记 - 2026 - 1027 · 人民币</span>
        </div>
        <label class="form-check"><input type="checkbox" checked><span>附件 2 张</span></label>
    </div>
    <div class="kui-scroll-auto">
        <table class="table kui-table--responsive">
            <thead>
                <tr>
                    <th>摘要</th>
                    <th>会计科目</th>
                    <th class="kui-text-right">借方金额</th>
                    <th class="kui-text-right">贷方金额</th>
                </tr>
            </thead>
            <tbody>
                <tr data-fb-voucher-row>
                    <td data-label="摘要"><input class="form-control form-control-sm" type="text" value="支付九月办公租金" aria-label="第 1 行摘要" data-fb-voucher-summary></td>
                    <td data-label="会计科目">
                        <select class="form-control form-control-sm" aria-label="第 1 行会计科目" data-fb-voucher-account>
                            <option>管理费用</option>
                            <option>销售费用</option>
                            <option>银行存款</option>
                        </select>
                    </td>
                    <td data-label="借方金额"><input class="form-control form-control-sm kui-text-right" type="number" min="0" step="0.01" value="12800" aria-label="第 1 行借方金额" data-fb-voucher-debit></td>
                    <td data-label="贷方金额"><input class="form-control form-control-sm kui-text-right" type="number" min="0" step="0.01" placeholder="0.00" aria-label="第 1 行贷方金额" data-fb-voucher-credit></td>
                </tr>
                <tr data-fb-voucher-row>
                    <td data-label="摘要"><input class="form-control form-control-sm" type="text" value="银行付款" aria-label="第 2 行摘要" data-fb-voucher-summary></td>
                    <td data-label="会计科目">
                        <select class="form-control form-control-sm" aria-label="第 2 行会计科目" data-fb-voucher-account>
                            <option>银行存款</option>
                            <option>管理费用</option>
                            <option>其他应付款</option>
                        </select>
                    </td>
                    <td data-label="借方金额"><input class="form-control form-control-sm kui-text-right" type="number" min="0" step="0.01" placeholder="0.00" aria-label="第 2 行借方金额" data-fb-voucher-debit></td>
                    <td data-label="贷方金额"><input class="form-control form-control-sm kui-text-right" type="number" min="0" step="0.01" value="12800" aria-label="第 2 行贷方金额" data-fb-voucher-credit></td>
                </tr>
            </tbody>
        </table>
    </div>
    <dl class="kui-descriptions">
        <div class="kui-descriptions__item"><dt>借方合计</dt><dd data-fb-voucher-debit-total>¥ 12,800.00</dd></div>
        <div class="kui-descriptions__item"><dt>贷方合计</dt><dd data-fb-voucher-credit-total>¥ 12,800.00</dd></div>
    </dl>
    <div class="kui-cluster kui-justify-between">
        <span class="form-error" data-fb-voucher-error hidden>借贷合计不相等，请检查两列金额。</span>
        <span class="form-hint">制单人：林澈 · 审核：待提交</span>
    </div>
    <div class="kui-cluster kui-justify-end">
        <button type="submit" class="btn btn-primary">保存凭证</button>
    </div>
    <div class="alert alert-success" data-fb-voucher-result hidden>
        <i class="fa fa-check-circle" aria-hidden="true"></i>
        <div>凭证已保存，借贷平衡校验通过。</div>
    </div>
</form>`,
})}

${demo({
    title: '社交资料表单',
    desc: '头像、昵称、简介与通知偏好放在同一页：头像即时预览，昵称失焦校验，简介实时计数，通知偏好用单选锁定一种频率。',
    tags: ['.kui-split', 'textarea', '.form-check'],
    script: `
const nick = document.querySelector<HTMLInputElement>('[data-fb-profile-nickname]')!
const error = document.querySelector<HTMLElement>('[data-fb-profile-error]')

const validateNick = (): boolean => {
    const invalid = nick.value.trim().length < 2
    nick.classList.toggle('is-invalid', invalid)
    nick.classList.toggle('is-valid', !invalid)
    nick.setAttribute('aria-invalid', String(invalid))
    if (error) error.hidden = !invalid
    return !invalid
}

nick.addEventListener('blur', validateNick)
nick.addEventListener('input', () => {
    if (nick.getAttribute('aria-invalid') === 'true') validateNick()
})

const bio = document.querySelector<HTMLTextAreaElement>('[data-fb-profile-bio]')
const count = document.querySelector<HTMLElement>('[data-fb-profile-bio-count]')
bio?.addEventListener('input', () => {
    if (count) count.textContent = bio.value.length + ' / 120'
})
`,
    html: `
<form class="form-section" data-fb-profile-form>
    <h3 class="form-section__title">编辑社交资料</h3>
    <p class="form-section__desc">头像和昵称会展示在团队目录、评论与活动报名页。</p>
    <div class="kui-split" style="--kui-split-sidebar: 10rem">
        <div class="kui-stack kui-stack--tight">
            <span class="kui-avatar kui-avatar--xl">
                <img src="./images/portraits/2.jpg" alt="当前社交头像" data-fb-profile-avatar>
            </span>
            <label class="btn btn-default btn-sm" for="fb-profile-avatar-file">
                <i class="fa fa-upload" aria-hidden="true"></i> 更换头像
            </label>
            <input class="kui-visually-hidden" id="fb-profile-avatar-file" type="file" accept="image/*" data-fb-profile-avatar-file>
            <span class="form-hint" data-fb-profile-avatar-meta>JPG / PNG，建议 1 : 1</span>
        </div>
        <div class="kui-stack">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label" for="fb-profile-nickname">昵称<span class="required">*</span></label>
                    <input class="form-control is-invalid" id="fb-profile-nickname" type="text" value="林" aria-describedby="fb-profile-error" aria-invalid="true" data-fb-profile-nickname>
                    <span class="form-error" id="fb-profile-error" data-fb-profile-error>昵称至少 2 个字符</span>
                </div>
                <div class="form-group">
                    <label class="form-label" for="fb-profile-email">公开邮箱</label>
                    <input class="form-control is-valid" id="fb-profile-email" type="email" value="lin.che@kui.dev">
                    <span class="form-hint">会展示在个人主页，可随时关闭。</span>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label" for="fb-profile-bio">一句话简介</label>
                <textarea class="form-control" id="fb-profile-bio" maxlength="120" placeholder="例如：负责华东区渠道运营，关注转化与复购。" data-fb-profile-bio>把每一次门店走访，变成下一次陈列的输入。</textarea>
                <span class="form-hint" data-fb-profile-bio-count>24 / 120</span>
            </div>
            <div class="form-group">
                <span class="form-label">通知偏好</span>
                <div class="kui-stack kui-stack--tight">
                    <label class="form-check"><input type="radio" name="fb-profile-notify" value="仅重要事项" checked><span>仅重要事项</span></label>
                    <label class="form-check"><input type="radio" name="fb-profile-notify" value="全部消息"><span>全部消息</span></label>
                    <label class="form-check"><input type="radio" name="fb-profile-notify" value="每天汇总"><span>每天汇总</span></label>
                </div>
                <span class="form-hint" data-fb-profile-notify-result>已选：仅重要事项</span>
            </div>
            <div class="kui-cluster kui-justify-end">
                <button type="reset" class="btn btn-default">还原</button>
                <button type="submit" class="btn btn-primary">保存资料</button>
            </div>
            <div class="alert alert-success" data-fb-profile-result hidden>
                <i class="fa fa-check-circle" aria-hidden="true"></i>
                <div>资料已更新，公开页面会立即生效。</div>
            </div>
        </div>
    </div>
</form>`,
})}

${demo({
    title: '医院明细表单',
    desc: '患者信息在上，费用明细按行录入；增删行会重算合计，删除按钮统一使用关闭图标，提交前检查费用项目是否填写。',
    stage: 'tinted',
    tags: ['table', '动态行', '合计'],
    script: `
const body = document.querySelector<HTMLElement>('[data-fb-fee-body]')!
const total = document.querySelector<HTMLElement>('[data-fb-fee-total]')!

const sync = (): void => {
    let sum = 0
    body.querySelectorAll<HTMLElement>('[data-fb-fee-row]').forEach((row) => {
        const qty = Number(row.querySelector<HTMLInputElement>('[data-fb-fee-qty]')?.value) || 0
        const price = Number(row.querySelector<HTMLInputElement>('[data-fb-fee-price]')?.value) || 0
        const amount = qty * price
        sum += amount
        const cell = row.querySelector<HTMLElement>('[data-fb-fee-amount]')
        if (cell) cell.textContent = '¥ ' + amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
    })
    if (total) total.textContent = '¥ ' + sum.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

body.addEventListener('input', sync)
body.addEventListener('click', (event) => {
    const remove = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-fb-fee-remove]') : null
    if (!remove) return
    remove.closest('[data-fb-fee-row]')?.remove()
    sync()
})

document.querySelector('[data-fb-fee-add]')?.addEventListener('click', () => {
    body.insertAdjacentHTML('beforeend', '<tr data-fb-fee-row><td data-label="费用项目"><input class="form-control form-control-sm" data-fb-fee-name aria-label="费用项目" value="新增项目"></td><td data-label="数量"><input class="form-control form-control-sm" data-fb-fee-qty type="number" min="1" value="1" aria-label="数量"></td><td data-label="单价"><input class="form-control form-control-sm" data-fb-fee-price type="number" min="0" step="0.01" value="0" aria-label="单价"></td><td class="kui-text-right" data-label="金额" data-fb-fee-amount>¥ 0.00</td><td data-label="操作"><button type="button" class="btn btn-ghost btn-sm" data-fb-fee-remove aria-label="删除费用行"><i class="fa fa-times" aria-hidden="true"></i></button></td></tr>')
    sync()
})
`,
    html: `
<form class="kui-stack" data-fb-hospital-form>
    <section class="form-section">
        <h3 class="form-section__title">患者信息</h3>
        <p class="form-section__desc">姓名与就诊号用于核对身份，过敏史会随费用清单一并提交。</p>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label" for="fb-patient-name">患者姓名<span class="required">*</span></label>
                <input class="form-control" id="fb-patient-name" type="text" value="周启明" required>
            </div>
            <div class="form-group">
                <label class="form-label" for="fb-patient-no">就诊号</label>
                <input class="form-control" id="fb-patient-no" type="text" value="OP-20261027-0842">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label" for="fb-patient-gender">性别</label>
                <select class="form-control" id="fb-patient-gender">
                    <option>男</option>
                    <option>女</option>
                    <option>其他 / 不愿透露</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label" for="fb-patient-age">年龄</label>
                <div class="input-group">
                    <input class="form-control" id="fb-patient-age" type="number" min="0" max="120" value="38">
                    <span class="input-addon">岁</span>
                </div>
            </div>
        </div>
        <div class="form-group">
            <label class="form-label" for="fb-patient-allergy">过敏史</label>
            <textarea class="form-control" id="fb-patient-allergy" rows="2" placeholder="没有请填「无」">青霉素过敏</textarea>
        </div>
    </section>
    <section class="form-section">
        <div class="kui-cluster kui-justify-between">
            <div>
                <h3 class="form-section__title">费用明细</h3>
                <p class="form-section__desc">每行只填项目、数量与单价，金额由行内自动计算。</p>
            </div>
            <button type="button" class="btn btn-default btn-sm" data-fb-fee-add>
                <i class="fa fa-plus" aria-hidden="true"></i> 添加费用行
            </button>
        </div>
        <div class="kui-scroll-auto">
            <table class="table kui-table--responsive">
                <thead>
                    <tr><th>费用项目</th><th>数量</th><th>单价</th><th class="kui-text-right">金额</th><th>操作</th></tr>
                </thead>
                <tbody data-fb-fee-body>
                    <tr data-fb-fee-row>
                        <td data-label="费用项目"><input class="form-control form-control-sm" type="text" value="门诊诊查" aria-label="费用项目" data-fb-fee-name></td>
                        <td data-label="数量"><input class="form-control form-control-sm" type="number" min="1" step="1" value="1" aria-label="数量" data-fb-fee-qty></td>
                        <td data-label="单价"><input class="form-control form-control-sm" type="number" min="0" step="0.01" value="50" aria-label="单价" data-fb-fee-price></td>
                        <td class="kui-text-right" data-label="金额" data-fb-fee-amount>¥ 50.00</td>
                        <td data-label="操作"><button type="button" class="btn btn-ghost btn-sm" data-fb-fee-remove aria-label="删除门诊诊查"><i class="fa fa-times" aria-hidden="true"></i></button></td>
                    </tr>
                    <tr data-fb-fee-row>
                        <td data-label="费用项目"><input class="form-control form-control-sm" type="text" value="血常规" aria-label="费用项目" data-fb-fee-name></td>
                        <td data-label="数量"><input class="form-control form-control-sm" type="number" min="1" step="1" value="1" aria-label="数量" data-fb-fee-qty></td>
                        <td data-label="单价"><input class="form-control form-control-sm" type="number" min="0" step="0.01" value="28" aria-label="单价" data-fb-fee-price></td>
                        <td class="kui-text-right" data-label="金额" data-fb-fee-amount>¥ 28.00</td>
                        <td data-label="操作"><button type="button" class="btn btn-ghost btn-sm" data-fb-fee-remove aria-label="删除血常规"><i class="fa fa-times" aria-hidden="true"></i></button></td>
                    </tr>
                    <tr data-fb-fee-row>
                        <td data-label="费用项目"><input class="form-control form-control-sm" type="text" value="阿莫西林胶囊" aria-label="费用项目" data-fb-fee-name></td>
                        <td data-label="数量"><input class="form-control form-control-sm" type="number" min="1" step="1" value="2" aria-label="数量" data-fb-fee-qty></td>
                        <td data-label="单价"><input class="form-control form-control-sm" type="number" min="0" step="0.01" value="36.5" aria-label="单价" data-fb-fee-price></td>
                        <td class="kui-text-right" data-label="金额" data-fb-fee-amount>¥ 73.00</td>
                        <td data-label="操作"><button type="button" class="btn btn-ghost btn-sm" data-fb-fee-remove aria-label="删除阿莫西林胶囊"><i class="fa fa-times" aria-hidden="true"></i></button></td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="kui-cluster kui-justify-end">
            <span class="form-hint">费用合计</span>
            <strong class="kui-nowrap" data-fb-fee-total>¥ 151.00</strong>
        </div>
        <div class="kui-cluster kui-justify-between">
            <span class="form-error" data-fb-fee-error hidden>请填写每一行的费用项目，或删除空行。</span>
            <span class="form-hint">费用清单保存后仍需财务复核。</span>
        </div>
        <div class="kui-cluster kui-justify-end">
            <button type="submit" class="btn btn-primary">提交费用清单</button>
        </div>
        <div class="alert alert-success" data-fb-fee-result hidden>
            <i class="fa fa-check-circle" aria-hidden="true"></i>
            <div>费用清单已提交，可在就诊记录中继续补充材料。</div>
        </div>
    </section>
</form>`,
})}

${propsTable([
    { name: '.form-group', type: 'class', desc: '字段容器：纵向排列标签、控件、提示与错误，默认保留一档下间距。' },
    { name: '.form-row', type: 'class', desc: '自适应两列，最小列宽 15rem；容器变窄时自动折成一列。' },
    { name: '.form-section', type: 'class', desc: '带标题与说明的字段分组，内部继续用 form-group 组织。' },
    { name: '.form-control', type: 'class', desc: '输入框、下拉与多行文本共用；提供 <code>-sm</code> / <code>-lg</code> 两档高度。' },
    { name: '.input-group / .input-addon', type: 'class', desc: '把图标、单位或货币符号贴在控件两侧，圆角自动合并。' },
    { name: '.form-check / .form-switch', type: 'class', desc: '复选框、单选项与开关的行内标签；多行时把每项放进 <code>.kui-stack--tight</code>，首行与后续行左对齐、间距一致。' },
    { name: '.form-hint / .form-error', type: 'class', desc: '辅助说明用弱化色，字段错误用危险色；错误紧贴对应的 form-control。' },
    { name: '.is-valid / .is-invalid / .has-error', type: 'class', desc: '成功、字段失败与容器级失败；配合 <code>aria-invalid</code> 与错误 id。' },
    { name: 'data-kui-switchery', type: 'attribute', desc: '声明开关输入，初始化 Switchery 后生成可点击的轨道与滑块。' },
    { name: '.kui-visually-hidden', type: 'class', desc: '视觉隐藏但保留可访问性，用于由按钮触发的文件选择。' },
    { name: 'IconPicker.getOrCreate(element, options)', type: 'method', desc: '挂载图标选择器：<code>icons</code> 为 <code>fa fa-*</code> 清单，<code>columns</code> 为每行列数，<code>search</code> 决定弹层是否带搜索框，<code>value</code> 是初始图标。' },
    { name: 'kui:iconpicker:change', type: 'event', desc: '点选图标后触发，<code>detail.payload.icon</code> 为新的 class 名；用它把结果写回预览或其他字段。' },
    { name: 'ColorPicker.getOrCreate(element, options)', type: 'method', desc: '把色板挂到十六进制输入框：<code>colors</code> 为色值数组，<code>lineCount</code> 为每行个数，<code>updateText</code> / <code>updateBackground</code> 指定回显目标。' },
])}

`

    const responsiveForm = root.querySelector<HTMLFormElement>('[data-fb-responsive-form]')
    const responsiveFields = Array.from(root.querySelectorAll<HTMLInputElement>('[data-fb-responsive-field]'))

    const validateResponsiveField = (input: HTMLInputElement): boolean => {
        const empty = input.value.trim() === ''
        const invalid = empty || (input.type === 'email' && !input.checkValidity())
        input.classList.toggle('is-invalid', invalid)
        input.classList.toggle('is-valid', !invalid)
        input.setAttribute('aria-invalid', String(invalid))
        const error = input.closest('.form-group')?.querySelector<HTMLElement>('.form-error')
        if (error) {
            error.hidden = !invalid
        }
        return !invalid
    }

    responsiveFields.forEach((input) => {
        input.addEventListener('blur', () => validateResponsiveField(input))
        input.addEventListener('input', () => {
            if (input.getAttribute('aria-invalid') === 'true') {
                validateResponsiveField(input)
            }
        })
    })

    responsiveForm?.addEventListener('submit', (event) => {
        event.preventDefault()
        const valid = responsiveFields.map(validateResponsiveField).every(Boolean)
        const result = root.querySelector<HTMLElement>('[data-fb-responsive-result]')
        if (result) {
            result.hidden = !valid
        }
    })

    const attachment = root.querySelector<HTMLInputElement>('[data-fb-file]')
    const attachmentMeta = root.querySelector<HTMLElement>('[data-fb-file-meta]')
    attachment?.addEventListener('change', () => {
        const file = attachment.files?.[0]
        if (!file || !attachmentMeta) {
            return
        }
        attachmentMeta.textContent = `${file.name} · ${Math.ceil(file.size / 1024)} KB`
    })

    const bindAvatarPreview = (inputSelector: string, previewSelector: string, metaSelector: string): void => {
        const input = root.querySelector<HTMLInputElement>(inputSelector)
        const preview = root.querySelector<HTMLImageElement>(previewSelector)
        const meta = root.querySelector<HTMLElement>(metaSelector)
        input?.addEventListener('change', () => {
            const file = input.files?.[0]
            if (!file) {
                return
            }
            const reader = new FileReader()
            reader.addEventListener('load', () => {
                if (preview && typeof reader.result === 'string') {
                    preview.src = reader.result
                }
            })
            reader.readAsDataURL(file)
            if (meta) {
                meta.textContent = `${file.name} · 本地预览`
            }
        })
    }

    bindAvatarPreview('[data-fb-avatar-file]', '[data-fb-avatar-preview]', '[data-fb-avatar-meta]')
    bindAvatarPreview('[data-fb-profile-avatar-file]', '[data-fb-profile-avatar]', '[data-fb-profile-avatar-meta]')

    const iconForm = root.querySelector<HTMLElement>('[data-fb-icon-form]')
    if (iconForm) {
        const iconTrigger = iconForm.querySelector<HTMLElement>('[data-fb-icon-picker]')
        const iconPreview = iconForm.querySelector<HTMLElement>('[data-fb-icon-preview]')
        const iconValue = iconForm.querySelector<HTMLElement>('[data-fb-icon-value]')
        const iconName = iconForm.querySelector<HTMLElement>('[data-fb-icon-name]')
        const iconEvent = iconForm.querySelector<HTMLElement>('[data-fb-icon-event]')

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
                const icon = (event as CustomEvent<KuiEventDetail<{ icon: string }>>).detail.payload?.icon ?? ''
                if (!icon) {
                    return
                }
                if (iconPreview) {
                    iconPreview.className = icon
                }
                if (iconValue) {
                    iconValue.textContent = icon
                }
                if (iconName) {
                    iconName.textContent = icon.replace(/^fa\s+/, '')
                }
                if (iconEvent) {
                    iconEvent.textContent = `图标已写回：${icon}`
                }
            })
        }
    }

    const colorForm = root.querySelector<HTMLElement>('[data-fb-brand-color]')
    if (colorForm) {
        const colorInput = colorForm.querySelector<HTMLInputElement>('[data-fb-app-color]')
        const colorEvent = colorForm.querySelector<HTMLElement>('[data-fb-color-event]')

        if (colorInput) {
            trackComponent(
                ColorPicker.getOrCreate(colorInput, {
                    title: '选色',
                    colors: ['#2563eb', '#0ea5e9', '#14b8a6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#0f172a'],
                    lineCount: 9,
                    tileSize: 24,
                    updateText: '[data-fb-color-hex]',
                }),
            )
            colorInput.addEventListener('change', () => {
                if (colorEvent) {
                    colorEvent.textContent = `主题色已写回：${colorInput.value || '未设置'}`
                }
            })
        }
    }

    const uploadForm = root.querySelector<HTMLFormElement>('[data-fb-upload-form]')
    uploadForm?.addEventListener('submit', (event) => {
        event.preventDefault()
        const result = root.querySelector<HTMLElement>('[data-fb-upload-result]')
        if (result && uploadForm.checkValidity()) {
            result.hidden = false
        }
    })
    uploadForm?.addEventListener('reset', () => {
        const result = root.querySelector<HTMLElement>('[data-fb-upload-result]')
        const avatarMeta = root.querySelector<HTMLElement>('[data-fb-avatar-meta]')
        const avatarPreview = root.querySelector<HTMLImageElement>('[data-fb-avatar-preview]')
        const fileMeta = root.querySelector<HTMLElement>('[data-fb-file-meta]')
        if (result) {
            result.hidden = true
        }
        if (avatarMeta) {
            avatarMeta.textContent = 'JPG / PNG，建议 1 : 1'
        }
        if (avatarPreview) {
            avatarPreview.src = './images/portraits/1.jpg'
        }
        if (fileMeta) {
            fileMeta.textContent = '支持 PDF、DOCX 与图片，大小不超过 10 MB'
        }
    })

    const workbench = root.querySelector<HTMLInputElement>('[data-fb-workbench]')
    const workbenchState = root.querySelector<HTMLElement>('[data-fb-workbench-state]')
    if (workbench) {
        trackComponent(Switchery.getOrCreate(workbench))
        workbench.addEventListener('change', () => {
            if (workbenchState) {
                workbenchState.textContent = workbench.checked ? '当前：接单后自动置为忙碌' : '当前：保持在线'
            }
        })
    }

    const composeForm = root.querySelector<HTMLFormElement>('[data-fb-compose-form]')
    composeForm?.addEventListener('submit', (event) => {
        event.preventDefault()
        const result = root.querySelector<HTMLElement>('[data-fb-compose-result]')
        if (result && composeForm.checkValidity()) {
            result.hidden = false
        }
    })
    composeForm?.addEventListener('reset', () => {
        const result = root.querySelector<HTMLElement>('[data-fb-compose-result]')
        if (result) {
            result.hidden = true
        }
    })

    const fundForm = root.querySelector<HTMLFormElement>('[data-fb-fund-form]')
    if (fundForm) {
        const amount = fundForm.querySelector<HTMLInputElement>('[data-fb-fund-amount]')
        const card = fundForm.querySelector<HTMLInputElement>('[data-fb-fund-card]')
        const reason = fundForm.querySelector<HTMLSelectElement>('[data-fb-fund-reason]')
        const agree = fundForm.querySelector<HTMLInputElement>('[data-fb-fund-agree]')
        const error = fundForm.querySelector<HTMLElement>('[data-fb-fund-error]')
        const result = fundForm.querySelector<HTMLElement>('[data-fb-fund-result]')

        fundForm.addEventListener('submit', (event) => {
            event.preventDefault()
            const amountInvalid = !amount || Number(amount.value) < 1000 || Number(amount.value) > 86400
            const cardInvalid = !card || !/^\d{16,19}$/.test(card.value.replace(/\s/g, ''))
            const reasonInvalid = !reason?.value
            const agreeInvalid = !agree?.checked
            const valid = !amountInvalid && !cardInvalid && !reasonInvalid && !agreeInvalid

            if (amount) {
                amount.classList.toggle('is-invalid', amountInvalid)
                amount.setAttribute('aria-invalid', String(amountInvalid))
            }
            if (card) {
                card.classList.toggle('is-invalid', cardInvalid)
                card.setAttribute('aria-invalid', String(cardInvalid))
            }
            if (reason) {
                reason.classList.toggle('is-invalid', reasonInvalid)
                reason.setAttribute('aria-invalid', String(reasonInvalid))
            }
            if (error) {
                error.hidden = valid
            }
            if (result) {
                result.hidden = !valid
            }
        })
        fundForm.addEventListener('input', () => {
            if (result) {
                result.hidden = true
            }
        })
        fundForm.addEventListener('reset', () => {
            if (error) {
                error.hidden = true
            }
            if (result) {
                result.hidden = true
            }
            for (const field of [amount, card, reason]) {
                field?.classList.remove('is-invalid')
                field?.removeAttribute('aria-invalid')
            }
        })
    }

    const voucherForm = root.querySelector<HTMLFormElement>('[data-fb-voucher-form]')
    if (voucherForm) {
        const debitTotal = voucherForm.querySelector<HTMLElement>('[data-fb-voucher-debit-total]')
        const creditTotal = voucherForm.querySelector<HTMLElement>('[data-fb-voucher-credit-total]')
        const error = voucherForm.querySelector<HTMLElement>('[data-fb-voucher-error]')
        const result = voucherForm.querySelector<HTMLElement>('[data-fb-voucher-result]')
        const formatAmount = (value: number): string =>
            `¥ ${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

        const syncVoucher = (): { debit: number; credit: number } => {
            let debit = 0
            let credit = 0
            voucherForm.querySelectorAll<HTMLElement>('[data-fb-voucher-row]').forEach((row) => {
                debit += Number(row.querySelector<HTMLInputElement>('[data-fb-voucher-debit]')?.value) || 0
                credit += Number(row.querySelector<HTMLInputElement>('[data-fb-voucher-credit]')?.value) || 0
            })
            if (debitTotal) {
                debitTotal.textContent = formatAmount(debit)
            }
            if (creditTotal) {
                creditTotal.textContent = formatAmount(credit)
            }
            if (error) {
                error.hidden = debit === credit && debit > 0
            }
            return { debit, credit }
        }

        voucherForm.addEventListener('input', () => {
            if (result) {
                result.hidden = true
            }
            syncVoucher()
        })
        voucherForm.addEventListener('submit', (event) => {
            event.preventDefault()
            const totals = syncVoucher()
            const valid = totals.debit > 0 && totals.debit === totals.credit
            if (error) {
                error.hidden = valid
            }
            if (result) {
                result.hidden = !valid
            }
        })
        syncVoucher()
    }

    const profileForm = root.querySelector<HTMLFormElement>('[data-fb-profile-form]')
    if (profileForm) {
        const nickname = profileForm.querySelector<HTMLInputElement>('[data-fb-profile-nickname]')
        const nicknameError = profileForm.querySelector<HTMLElement>('[data-fb-profile-error]')
        const bio = profileForm.querySelector<HTMLTextAreaElement>('[data-fb-profile-bio]')
        const bioCount = profileForm.querySelector<HTMLElement>('[data-fb-profile-bio-count]')
        const notifyResult = profileForm.querySelector<HTMLElement>('[data-fb-profile-notify-result]')
        const result = profileForm.querySelector<HTMLElement>('[data-fb-profile-result]')
        const validateNickname = (): boolean => {
            if (!nickname) {
                return false
            }
            const invalid = nickname.value.trim().length < 2
            nickname.classList.toggle('is-invalid', invalid)
            nickname.classList.toggle('is-valid', !invalid)
            nickname.setAttribute('aria-invalid', String(invalid))
            if (nicknameError) {
                nicknameError.hidden = !invalid
            }
            return !invalid
        }

        if (bio && bioCount) {
            const syncBioCount = (): void => {
                bioCount.textContent = `${bio.value.length} / 120`
            }
            syncBioCount()
            bio.addEventListener('input', syncBioCount)
        }

        nickname?.addEventListener('blur', validateNickname)
        nickname?.addEventListener('input', () => {
            if (nickname.getAttribute('aria-invalid') === 'true') {
                validateNickname()
            }
        })

        if (notifyResult) {
            const syncNotify = (): void => {
                const checked = profileForm.querySelector<HTMLInputElement>('input[name="fb-profile-notify"]:checked')
                notifyResult.textContent = `已选：${checked?.value ?? '未选择'}`
            }
            profileForm.querySelectorAll<HTMLInputElement>('input[name="fb-profile-notify"]').forEach((input) => {
                input.addEventListener('change', syncNotify)
            })
            syncNotify()
        }

        profileForm.addEventListener('submit', (event) => {
            event.preventDefault()
            if (!validateNickname()) {
                return
            }
            if (result) {
                result.hidden = false
            }
        })
        profileForm.addEventListener('reset', () => {
            if (result) {
                result.hidden = true
            }
            window.requestAnimationFrame(() => {
                validateNickname()
                if (bio && bioCount) {
                    bioCount.textContent = `${bio.value.length} / 120`
                }
                if (notifyResult) {
                    const checked = profileForm.querySelector<HTMLInputElement>('input[name="fb-profile-notify"]:checked')
                    notifyResult.textContent = `已选：${checked?.value ?? '未选择'}`
                }
                const avatarPreview = profileForm.querySelector<HTMLImageElement>('[data-fb-profile-avatar]')
                const avatarMeta = profileForm.querySelector<HTMLElement>('[data-fb-profile-avatar-meta]')
                if (avatarPreview) {
                    avatarPreview.src = './images/portraits/2.jpg'
                }
                if (avatarMeta) {
                    avatarMeta.textContent = 'JPG / PNG，建议 1 : 1'
                }
            })
        })
    }

    const hospitalForm = root.querySelector<HTMLFormElement>('[data-fb-hospital-form]')
    if (hospitalForm) {
        const feeBody = hospitalForm.querySelector<HTMLElement>('[data-fb-fee-body]')
        const feeTotal = hospitalForm.querySelector<HTMLElement>('[data-fb-fee-total]')
        const feeError = hospitalForm.querySelector<HTMLElement>('[data-fb-fee-error]')
        const feeResult = hospitalForm.querySelector<HTMLElement>('[data-fb-fee-result]')
        const feeAdd = hospitalForm.querySelector<HTMLButtonElement>('[data-fb-fee-add]')
        const formatAmount = (value: number): string =>
            `¥ ${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

        const syncFees = (): number => {
            if (!feeBody) {
                return 0
            }
            let sum = 0
            feeBody.querySelectorAll<HTMLElement>('[data-fb-fee-row]').forEach((row) => {
                const qty = Number(row.querySelector<HTMLInputElement>('[data-fb-fee-qty]')?.value) || 0
                const price = Number(row.querySelector<HTMLInputElement>('[data-fb-fee-price]')?.value) || 0
                const amount = qty * price
                sum += amount
                const cell = row.querySelector<HTMLElement>('[data-fb-fee-amount]')
                if (cell) {
                    cell.textContent = formatAmount(amount)
                }
            })
            if (feeTotal) {
                feeTotal.textContent = formatAmount(sum)
            }
            return sum
        }

        feeBody?.addEventListener('input', (event) => {
            if (event.target instanceof HTMLInputElement) {
                if (feeError) {
                    feeError.hidden = true
                }
                if (feeResult) {
                    feeResult.hidden = true
                }
                syncFees()
            }
        })

        feeBody?.addEventListener('click', (event) => {
            const button = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-fb-fee-remove]') : null
            if (!button || !feeBody) {
                return
            }
            const rows = feeBody.querySelectorAll<HTMLElement>('[data-fb-fee-row]')
            if (rows.length <= 1) {
                if (feeError) {
                    feeError.textContent = '至少保留一条费用明细。'
                    feeError.hidden = false
                }
                return
            }
            button.closest<HTMLElement>('[data-fb-fee-row]')?.remove()
            if (feeError) {
                feeError.hidden = true
            }
            if (feeResult) {
                feeResult.hidden = true
            }
            syncFees()
        })

        feeAdd?.addEventListener('click', () => {
            if (!feeBody) {
                return
            }
            const row = document.createElement('tr')
            row.dataset.fbFeeRow = ''
            row.innerHTML = `
                <td data-label="费用项目"><input class="form-control form-control-sm" type="text" value="新增项目" aria-label="费用项目" data-fb-fee-name></td>
                <td data-label="数量"><input class="form-control form-control-sm" type="number" min="1" step="1" value="1" aria-label="数量" data-fb-fee-qty></td>
                <td data-label="单价"><input class="form-control form-control-sm" type="number" min="0" step="0.01" value="0" aria-label="单价" data-fb-fee-price></td>
                <td class="kui-text-right" data-label="金额" data-fb-fee-amount>¥ 0.00</td>
                <td data-label="操作"><button type="button" class="btn btn-ghost btn-sm" data-fb-fee-remove aria-label="删除费用行"><i class="fa fa-times" aria-hidden="true"></i></button></td>
            `
            feeBody.append(row)
            if (feeError) {
                feeError.hidden = true
            }
            if (feeResult) {
                feeResult.hidden = true
            }
            syncFees()
        })

        hospitalForm.addEventListener('submit', (event) => {
            event.preventDefault()
            if (!feeBody) {
                return
            }
            const names = Array.from(feeBody.querySelectorAll<HTMLInputElement>('[data-fb-fee-name]'))
            const invalid = names.some((input) => input.value.trim() === '')
            if (feeError) {
                feeError.textContent = '请填写每一行的费用项目，或删除空行。'
                feeError.hidden = !invalid
            }
            if (feeResult) {
                feeResult.hidden = invalid
            }
            if (!invalid) {
                syncFees()
            }
        })

        syncFees()
    }
}
