import { Editable, type EditableOptions } from '@kui/core'
import { trackComponent } from '../../context'
import type { DocPageContext } from '../../docs/types'
import { callout, demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 可编辑字段。
 * 六种类型收敛到同一个交互：点击进入编辑、回车提交、Esc 还原，
 * 文本态保持稳定高度，只有编辑态才出现输入框。
 */

function formatMoney(value: string): string {
    const amount = Number(value)
    if (!Number.isFinite(amount)) {
        return value || '—'
    }
    return `¥ ${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '可编辑把「查看」与「修改」合成一步：单击字段就地编辑，回车提交、Esc 还原，失焦同样提交。金额、日期、数字、单选、邮箱与手机号共用一套交互，只换输入类型与文本态格式。',
    tags: ['Editable', '.kui-editable', 'onCommit'],
})}

${sectionTitle('表格内编辑', '一行业务数据里往往混着金额、日期、枚举与联系方式；它们都进入编辑态后，表格仍然保持列对齐。')}

${demo({
    title: '六种字段类型',
    desc: '金额自动补 ¥ 与千分位，日期用原生日期选择器，数字带单位，单选显示选项文案，邮箱与手机号使用对应键盘。提交后下方立即回显。',
    tags: ['money', 'date', 'number', 'select', 'email', 'tel'],
    script: `
const mount = (selector: string, options: EditableOptions): void => {
    const element = document.querySelector<HTMLElement>(selector)
    if (element) Editable.getOrCreate(element, options)
}

const show = (name: string, value: string): void => {
    const target = document.querySelector<HTMLElement>('[data-ed-result-' + name + ']')
    if (target) target.textContent = value
}

mount('[data-ed-amount]', {
    type: 'money',
    value: '1280',
    onCommit: (value) => show('amount', '¥ ' + Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2 })),
})
mount('[data-ed-date]', { type: 'date', value: '2026-10-27', onCommit: (value) => show('date', value) })
mount('[data-ed-number]', { type: 'number', value: '12', suffix: ' 件', min: 1, max: 99, onCommit: (value) => show('number', value + ' 件') })
mount('[data-ed-status]', {
    type: 'select',
    value: '已支付',
    options: [{ value: '待支付', label: '待支付' }, { value: '已支付', label: '已支付' }, { value: '已退款', label: '已退款' }],
    onCommit: (value) => show('status', value),
})
mount('[data-ed-email]', { type: 'email', value: 'lin.che@kui.dev', onCommit: (value) => show('email', value) })
mount('[data-ed-tel]', { type: 'tel', value: '13800001234', onCommit: (value) => show('tel', value) })
`,
    html: `
<div class="form-section kui-stack">
    <div class="kui-toolbar">
        <div class="kui-toolbar__group">
            <h3 class="form-section__title">订单明细</h3>
            <span class="badge badge-neutral">点击任意值编辑</span>
        </div>
        <span class="form-hint">Enter 提交 · Esc 还原</span>
    </div>
    <div class="kui-scroll-auto">
        <table class="table kui-table--responsive">
            <thead>
                <tr><th>商品</th><th>金额</th><th>交付日期</th><th>数量</th><th>状态</th><th>邮箱</th><th>手机号</th></tr>
            </thead>
            <tbody>
                <tr>
                    <td data-label="商品">秋季礼盒</td>
                    <td data-label="金额"><span class="kui-editable--numeric" data-ed-amount aria-label="金额，点击编辑">1,280.00</span></td>
                    <td data-label="交付日期"><span data-ed-date aria-label="交付日期，点击编辑">2026-10-27</span></td>
                    <td data-label="数量"><span data-ed-number aria-label="数量，点击编辑">12</span></td>
                    <td data-label="状态"><span data-ed-status aria-label="支付状态，点击编辑">已支付</span></td>
                    <td data-label="邮箱"><span data-ed-email aria-label="邮箱，点击编辑">lin.che@kui.dev</span></td>
                    <td data-label="手机号"><span data-ed-tel aria-label="手机号，点击编辑">13800001234</span></td>
                </tr>
            </tbody>
        </table>
    </div>
    <div class="kui-cluster kui-justify-between">
        <span class="form-hint">最近提交：<code data-ed-last>暂无</code></span>
        <span class="badge badge-success">值已同步</span>
    </div>
    <dl class="kui-descriptions">
        <div class="kui-descriptions__item"><dt>金额</dt><dd data-ed-result-amount>¥ 1,280.00</dd></div>
        <div class="kui-descriptions__item"><dt>交付日期</dt><dd data-ed-result-date>2026-10-27</dd></div>
        <div class="kui-descriptions__item"><dt>数量</dt><dd data-ed-result-number>12 件</dd></div>
        <div class="kui-descriptions__item"><dt>状态</dt><dd data-ed-result-status>已支付</dd></div>
        <div class="kui-descriptions__item"><dt>邮箱</dt><dd data-ed-result-email>lin.che@kui.dev</dd></div>
        <div class="kui-descriptions__item"><dt>手机号</dt><dd data-ed-result-tel>13800001234</dd></div>
    </dl>
</div>`,
})}

${sectionTitle('数值联动', '数量和单价都能原地改，金额与合计随之重算；只读的结果列不进入编辑，避免两处数字互相覆盖。')}

${demo({
    title: '数量 × 单价',
    desc: '修改数量或单价后，行金额与合计同步更新；金额列由计算得出，只做展示，不开放编辑。',
    tags: ['onCommit', 'kui-editable--numeric', '金额重算'],
    script: `
const qtyCell = document.querySelector<HTMLElement>('[data-ed-line-qty]')
const priceCell = document.querySelector<HTMLElement>('[data-ed-line-price]')
const amountCell = document.querySelector<HTMLElement>('[data-ed-line-amount]')
const totalCell = document.querySelector<HTMLElement>('[data-ed-line-total]')
const line = { qty: 12, price: 128 }

const sync = (): void => {
    const amount = line.qty * line.price
    const text = '¥ ' + amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    if (amountCell) amountCell.textContent = text
    if (totalCell) totalCell.textContent = text
}

if (qtyCell) {
    Editable.getOrCreate(qtyCell, {
        type: 'number',
        value: '12',
        suffix: ' 件',
        min: 1,
        max: 99,
        onCommit: (value) => { line.qty = Number(value) || 0; sync() },
    })
}
if (priceCell) {
    Editable.getOrCreate(priceCell, {
        type: 'money',
        value: '128',
        onCommit: (value) => { line.price = Number(value) || 0; sync() },
    })
}
`,
    html: `
<div class="form-section kui-stack">
    <h3 class="form-section__title">采购单</h3>
    <p class="form-section__desc" style="margin-bottom: 0">供应商：青禾包装 · 币种：人民币</p>
    <div class="kui-scroll-auto">
        <table class="table kui-table--responsive">
            <thead>
                <tr><th>商品</th><th>数量</th><th>单价</th><th class="kui-text-right">金额</th></tr>
            </thead>
            <tbody>
                <tr>
                    <td data-label="商品">秋季礼盒</td>
                    <td data-label="数量"><span data-ed-line-qty aria-label="数量，点击编辑">12 件</span></td>
                    <td data-label="单价"><span class="kui-editable--numeric" data-ed-line-price aria-label="单价，点击编辑">128</span></td>
                    <td class="kui-text-right" data-label="金额" data-ed-line-amount>¥ 1,536.00</td>
                </tr>
            </tbody>
        </table>
    </div>
    <div class="kui-cluster kui-justify-end">
        <span class="form-hint">合计</span>
        <strong class="kui-nowrap" data-ed-line-total>¥ 1,536.00</strong>
    </div>
    <p class="form-hint">金额列不参与编辑；提交数量或单价后，行金额与合计同时更新。</p>
</div>`,
})}

${sectionTitle('边界状态', '禁用字段只读，空字段从占位开始输入；两者都保持与普通字段相同的高度，不会引起表格跳动。')}

${demo({
    title: '只读与空值',
    desc: '归档日期不可编辑，备注为空时显示占位文案；提交后回显到右侧结果，两者都保持与普通字段相同的高度。',
    stage: 'tinted',
    tags: ['disabled', 'placeholder', '空值'],
    script: `
const archived = document.querySelector<HTMLElement>('[data-ed-disabled]')
if (archived) {
    Editable.getOrCreate(archived, { type: 'date', value: '2026-10-20', disabled: true })
}

const note = document.querySelector<HTMLElement>('[data-ed-empty]')
const result = document.querySelector<HTMLElement>('[data-ed-empty-result]')
if (note) {
    Editable.getOrCreate(note, {
        type: 'text',
        value: '',
        placeholder: '点击补充备注',
        onCommit: (value) => {
            if (result) result.textContent = value ? '备注：' + value : '未填写'
        },
    })
}
`,
    html: `
<div class="kui-grid">
    <div class="form-section kui-stack">
        <h3 class="form-section__title">归档信息</h3>
        <p class="form-section__desc">只读字段仍然能被读屏读取，但不能进入编辑态。</p>
        <div class="kui-cluster">
            <span class="form-hint">归档时间</span>
            <span data-ed-disabled aria-label="归档时间，只读">2026-10-20</span>
        </div>
    </div>
    <div class="form-section kui-stack">
        <h3 class="form-section__title">补充备注</h3>
        <p class="form-section__desc">空值显示占位文案，点击后从空白开始输入。</p>
        <div class="kui-cluster">
            <span data-ed-empty aria-label="备注，点击编辑"></span>
            <span class="form-hint" data-ed-empty-result>未填写</span>
        </div>
    </div>
</div>`,
})}

${callout('点击字段进入编辑，<kbd class="kui-kbd">Enter</kbd> 提交、<kbd class="kui-kbd">Esc</kbd> 还原；失焦也会提交。值没有变化时不会触发 <code>onCommit</code>，只读字段不会产生编辑态。')}

${propsTable([
    { name: 'type', type: 'text | number | money | date | email | tel | select', defaultValue: 'text', desc: '决定编辑态的控件类型与文本态的格式。' },
    { name: 'value', type: 'string', defaultValue: "''", desc: '当前值；为空时读取元素文本，并在文本态显示 placeholder。' },
    { name: 'options', type: 'EditableOption[]', desc: 'select 的候选项，同时提供 value 与 label。' },
    { name: 'placeholder / prefix / suffix', type: 'string', desc: '空值占位与前后缀，例如 ¥、元、件。' },
    { name: 'step / min / max', type: 'number', desc: 'number 与 money 的步进和取值范围。' },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', desc: '只读，移除 tabindex 并阻止进入编辑态。' },
    { name: 'onCommit', type: '(value: string) => void', desc: '回车或失焦提交时回调，值未变化不触发。' },
    { name: '.kui-editable / .is-editing', type: 'class', desc: '文本态与编辑态：悬停出现虚线，编辑时转为实线主色。' },
    { name: '.kui-editable__value / __input / __pen', type: 'class', desc: '文本、编辑框与铅笔图标；金额使用等宽数字。' },
    { name: '.kui-editable--numeric', type: 'class', desc: '数值右对齐并对齐小数位，用于表格里的金额列。' },
    { name: 'kui:editable:commit', type: 'event', desc: '提交新值时触发，<code>detail.payload.value</code> 为提交后的值。' },
])}

`

    const editableState = {
        amount: '1280',
        date: '2026-10-27',
        number: '12',
        status: '已支付',
        email: 'lin.che@kui.dev',
        tel: '13800001234',
    }
    const lastCommit = root.querySelector<HTMLElement>('[data-ed-last]')
    const updateLast = (label: string, value: string): void => {
        if (lastCommit) {
            lastCommit.textContent = `${label}：${value || '空'}`
        }
    }

    const mountEditable = (selector: string, options: Partial<EditableOptions>, label: string): void => {
        const element = root.querySelector<HTMLElement>(selector)
        if (!element) {
            return
        }
        const commit = options.onCommit
        trackComponent(
            Editable.getOrCreate(element, {
                ...options,
                onCommit: (value) => {
                    commit?.(value)
                    updateLast(label, value)
                },
            }),
        )
    }

    mountEditable(
        '[data-ed-amount]',
        {
            type: 'money',
            value: editableState.amount,
            onCommit: (value) => {
                editableState.amount = value
                const target = root.querySelector<HTMLElement>('[data-ed-result-amount]')
                if (target) {
                    target.textContent = formatMoney(value)
                }
            },
        },
        '金额',
    )
    mountEditable(
        '[data-ed-date]',
        {
            type: 'date',
            value: editableState.date,
            onCommit: (value) => {
                editableState.date = value
                const target = root.querySelector<HTMLElement>('[data-ed-result-date]')
                if (target) {
                    target.textContent = value
                }
            },
        },
        '交付日期',
    )
    mountEditable(
        '[data-ed-number]',
        {
            type: 'number',
            value: editableState.number,
            suffix: ' 件',
            min: 1,
            max: 99,
            onCommit: (value) => {
                editableState.number = value
                const target = root.querySelector<HTMLElement>('[data-ed-result-number]')
                if (target) {
                    target.textContent = `${value} 件`
                }
            },
        },
        '数量',
    )
    mountEditable(
        '[data-ed-status]',
        {
            type: 'select',
            value: editableState.status,
            options: [
                { value: '待支付', label: '待支付' },
                { value: '已支付', label: '已支付' },
                { value: '已退款', label: '已退款' },
            ],
            onCommit: (value) => {
                editableState.status = value
                const target = root.querySelector<HTMLElement>('[data-ed-result-status]')
                if (target) {
                    target.textContent = value
                }
            },
        },
        '状态',
    )
    mountEditable(
        '[data-ed-email]',
        {
            type: 'email',
            value: editableState.email,
            onCommit: (value) => {
                editableState.email = value
                const target = root.querySelector<HTMLElement>('[data-ed-result-email]')
                if (target) {
                    target.textContent = value
                }
            },
        },
        '邮箱',
    )
    mountEditable(
        '[data-ed-tel]',
        {
            type: 'tel',
            value: editableState.tel,
            onCommit: (value) => {
                editableState.tel = value
                const target = root.querySelector<HTMLElement>('[data-ed-result-tel]')
                if (target) {
                    target.textContent = value
                }
            },
        },
        '手机号',
    )

    const amountCell = root.querySelector<HTMLElement>('[data-ed-line-amount]')
    const totalCell = root.querySelector<HTMLElement>('[data-ed-line-total]')
    const line = { qty: 12, price: 128 }

    const syncLine = (): void => {
        const amount = line.qty * line.price
        const text = formatMoney(String(amount))
        if (amountCell) {
            amountCell.textContent = text
        }
        if (totalCell) {
            totalCell.textContent = text
        }
    }

    mountEditable(
        '[data-ed-line-qty]',
        {
            type: 'number',
            value: String(line.qty),
            suffix: ' 件',
            min: 1,
            max: 99,
            onCommit: (value) => {
                line.qty = Number(value) || 0
                syncLine()
            },
        },
        '采购数量',
    )
    mountEditable(
        '[data-ed-line-price]',
        {
            type: 'money',
            value: String(line.price),
            onCommit: (value) => {
                line.price = Number(value) || 0
                syncLine()
            },
        },
        '采购单价',
    )

    mountEditable('[data-ed-disabled]', { type: 'date', value: '2026-10-20', disabled: true }, '归档时间')
    mountEditable(
        '[data-ed-empty]',
        {
            type: 'text',
            value: '',
            placeholder: '点击补充备注',
            onCommit: (value) => {
                const target = root.querySelector<HTMLElement>('[data-ed-empty-result]')
                if (target) {
                    target.textContent = value ? `备注：${value}` : '未填写'
                }
            },
        },
        '备注',
    )
}
