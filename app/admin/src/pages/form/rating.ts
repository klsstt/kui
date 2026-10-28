import { Rating, type KuiEventDetail } from '@kui/core'
import { trackComponent } from '../../context'
import type { DocPageContext } from '../../docs/types'
import { callout, demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 评分。
 * 星星只表达分值：悬停预览整颗、点击提交；开启 half 时第一次点击取半颗，
 * 再点同一颗取整颗；关闭 half 后点击一次就是整颗。
 * 只读与可清空是两种收尾方式，不在同一组里混用。
 */

interface RatingChangePayload {
    score: number | null
}

function readScore(event: Event): number | null {
    const detail = (event as CustomEvent<KuiEventDetail<RatingChangePayload>>).detail
    return detail.payload?.score ?? null
}

const FIVE_HINTS = ['很不满意，配送严重延误', '不太满意，等待时间偏长', '一般，按预期送达', '满意，配送及时', '非常满意，包装与时效都很好']
const TEN_HINTS = ['完全不推荐', '很不推荐', '不太推荐', '略低于预期', '中立', '基本推荐', '比较推荐', '推荐', '很推荐', '强烈推荐']

function hintAt(score: number | null, hints: string[]): string {
    if (score === null) {
        return '点击星星给出评分'
    }
    const index = Math.min(Math.max(Math.ceil(score), 1), hints.length) - 1
    return hints[index]
}

export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '评分把一段主观感受压缩成一个数字。五分制用于满意度，十分制用于推荐意愿。半星模式下点击一次取半颗、再点同一颗取整颗；关闭半星后点击一次就是整颗。悬停只预览整颗，不提交。未选中是浅灰轮廓，选中与半星用橙色状态类点亮。',
    tags: ['Rating', '.rating', '.is-on', '.is-half'],
})}

${sectionTitle('五分制与十分制', '分值的颗粒度由问题决定：满意度用五档，推荐意愿用十档。半星模式第一次点击落在半颗、第二次落在整颗；关闭半星则一次点击就是整颗。')}

${demo({
    title: '五星评分',
    desc: 'half 打开时，点第 4 颗第一次得到 3.5，再点同一颗变成 4.0；悬停只预览整颗、不提交。右侧分数与下方文案随点击同步。',
    stage: 'tinted',
    tags: ['number: 5', 'half: true', '点击两次：半颗 → 整颗'],
    script: `
const rating = document.querySelector<HTMLElement>('[data-rt-five]')
const score = document.querySelector<HTMLElement>('[data-rt-five-score]')
const hint = document.querySelector<HTMLElement>('[data-rt-five-hint]')

const hints = ['很不满意，配送严重延误', '不太满意，等待时间偏长', '一般，按预期送达', '满意，配送及时', '非常满意，包装与时效都很好']

if (rating) {
    Rating.getOrCreate(rating, {
        number: 5,
        half: true,
        score: 3,
        hints,
        click: (value) => {
            if (score) score.textContent = value === null ? '未评分' : value.toFixed(1)
            if (hint) hint.textContent = value === null ? '点击星星给出评分' : hints[Math.ceil(value) - 1]
        },
    })
}
`,
    html: `
<div class="form-section kui-max-w-md">
    <h3 class="form-section__title">本次配送满意度</h3>
    <p class="form-section__desc">订单 K-2481 · 10 月 27 日送达。你的评分会用于配送团队复盘。</p>
    <div class="kui-cluster">
        <div data-rt-five data-rating-label="配送满意度"></div>
        <span class="rating__value" aria-live="polite" data-rt-five-score>3.0</span>
    </div>
    <p class="form-hint" data-rt-five-hint>3.0 分：一般，按预期送达。</p>
</div>`,
})}

${demo({
    title: '关闭半星 · 一次一颗',
    desc: 'half: false 时不看点击位置：点第 4 颗一次就是 4.0，再点同一颗仍是 4.0，不会出现 3.5。右侧分数与文案同步，用来确认关闭半星后只按整颗取值。',
    stage: 'tinted',
    tags: ['half: false', '一次点击一颗', '0.5 步进关闭'],
    script: `
const rating = document.querySelector<HTMLElement>('[data-rt-whole]')
const score = document.querySelector<HTMLElement>('[data-rt-whole-score]')
const hint = document.querySelector<HTMLElement>('[data-rt-whole-hint]')

const hints = ['很不满意，配送严重延误', '不太满意，等待时间偏长', '一般，按预期送达', '满意，配送及时', '非常满意，包装与时效都很好']

if (rating) {
    Rating.getOrCreate(rating, {
        number: 5,
        half: false,
        score: 2,
        hints,
        click: (value) => {
            if (score) score.textContent = value === null ? '未评分' : value.toFixed(1)
            if (hint) hint.textContent = value === null ? '点击星星给出评分' : hints[Math.ceil(value) - 1]
        },
    })
}
`,
    html: `
<div class="form-section kui-max-w-md">
    <h3 class="form-section__title">关闭半星后的评分</h3>
    <p class="form-section__desc">点击第 4 颗星，右侧直接显示 4.0；再点一次仍是 4.0。没有半颗的中间值。</p>
    <div class="kui-cluster">
        <div data-rt-whole data-rating-label="整星评分"></div>
        <span class="rating__value" aria-live="polite" data-rt-whole-score>2.0</span>
    </div>
    <p class="form-hint" data-rt-whole-hint>2.0 分：不太满意，等待时间偏长。</p>
</div>`,
})}

${demo({
    title: '十星与半星',
    desc: 'half 打开后，点第 7 颗第一次得到 6.5，再点同一颗得到 7.0；悬停只预览整颗、不提交。十分制适合推荐意愿这类需要细分的场景，右侧分数与下方文案随点击同步。',
    tags: ['number: 10', 'half: true', '点击两次：6.5 → 7.0'],
    script: `
const rating = document.querySelector<HTMLElement>('[data-rt-ten]')
const score = document.querySelector<HTMLElement>('[data-rt-ten-score]')
const hint = document.querySelector<HTMLElement>('[data-rt-ten-hint]')

const hints = ['完全不推荐', '很不推荐', '不太推荐', '略低于预期', '中立', '基本推荐', '比较推荐', '推荐', '很推荐', '强烈推荐']

if (rating) {
    Rating.getOrCreate(rating, {
        number: 10,
        half: true,
        score: 7.5,
        hints,
        click: (value) => {
            if (score) score.textContent = value === null ? '未评分' : value.toFixed(1) + ' / 10'
            if (hint) {
                hint.textContent = value === null
                    ? '点击星星给出推荐分'
                    : '当前 ' + value.toFixed(1) + ' 分：' + hints[Math.ceil(value) - 1]
            }
        },
    })
}
`,
    html: `
<div class="form-section">
    <h3 class="form-section__title">推荐意愿</h3>
    <p class="form-section__desc">0 分表示完全不推荐，10 分表示愿意强烈推荐给同行；允许半星。点第 7 颗一次是 6.5，再点一次是 7.0。</p>
    <div class="kui-cluster">
        <div data-rt-ten data-rating-label="推荐意愿"></div>
        <span class="rating__value" aria-live="polite" data-rt-ten-score>7.5 / 10</span>
    </div>
    <p class="form-hint" data-rt-ten-hint>当前 7.5 分：推荐。</p>
</div>`,
})}

${sectionTitle('只读与取消', '只读用于展示既有分数，取消用于允许用户撤回；两者都不改变星星的尺寸与位置。')}

${demo({
    title: '只读与可取消',
    desc: '只读态输出总分并退出键盘序列；可取消态在左侧提供减号，点一下回到未评分，再点星星重新选择。',
    stage: 'grid',
    tags: ['readOnly', 'cancel', '清空评分'],
    script: `
const readonly = document.querySelector<HTMLElement>('[data-rt-readonly]')
if (readonly) {
    const rating = Rating.getOrCreate(readonly, { number: 5, half: true, score: 4.5, readOnly: true })
    rating.readOnly(true)
}

const cancel = document.querySelector<HTMLElement>('[data-rt-cancel]')
const score = document.querySelector<HTMLElement>('[data-rt-cancel-score]')
const hint = document.querySelector<HTMLElement>('[data-rt-cancel-hint]')

if (cancel) {
    Rating.getOrCreate(cancel, {
        number: 5,
        score: 2,
        cancel: true,
        cancelHint: '取消本次评分',
        click: (value) => {
            if (score) score.textContent = value === null ? '未评分' : value.toFixed(1)
            if (hint) hint.textContent = value === null ? '已取消评分，可重新点击星星' : '当前 ' + value.toFixed(1) + ' 分，可点减号取消'
        },
    })
}
`,
    html: `
<div class="form-section">
    <h3 class="form-section__title">只读摘要</h3>
    <p class="form-section__desc">历史订单的评分只展示结果，不响应鼠标与键盘。</p>
    <div class="kui-cluster">
        <div data-rt-readonly data-rating-label="商品满意度"></div>
        <span class="rating__value">4.5</span>
    </div>
    <p class="form-hint">4.5 / 5 · 来自 128 位购买者</p>
</div>
<div class="form-section">
    <h3 class="form-section__title">允许撤回</h3>
    <p class="form-section__desc">用户点错时可以取消，减号只在可编辑态出现。</p>
    <div class="kui-cluster">
        <div data-rt-cancel data-rating-label="本次服务"></div>
        <span class="rating__value" data-rt-cancel-score>2.0</span>
    </div>
    <p class="form-hint" data-rt-cancel-hint>当前 2.0 分，可点减号取消。</p>
</div>`,
})}

${sectionTitle('事件', '评分结果既可以通过 click 回调拿到，也可以在容器上监听 kui:rating:change；事件里同时能读到组件实例与当前分数。')}

${demo({
    title: 'kui:rating:change 实时日志',
    desc: '每次点击提交或取消都会触发同一事件。下方日志保留最近一次分数，清空后可以继续操作。',
    stage: 'tinted',
    tags: ['kui:rating:change', 'detail.payload.score'],
    script: `
const rating = document.querySelector<HTMLElement>('[data-rt-event]')
const log = document.querySelector<HTMLElement>('[data-rt-log]')

if (rating) {
    Rating.getOrCreate(rating, { number: 5, half: true, score: 4, cancel: true, cancelHint: '取消本次评分' })
}

rating?.addEventListener('kui:rating:change', (event) => {
    const score = event.detail.payload?.score ?? null
    if (log) log.textContent = 'score: ' + (score ?? 'null')
})

document.querySelector('[data-rt-log-clear]')?.addEventListener('click', () => {
    if (log) log.textContent = '暂无事件'
})
`,
    html: `
<div class="kui-split kui-split--main-first">
    <div class="form-section">
        <h3 class="form-section__title">填写体验</h3>
        <p class="form-section__desc">悬停预览，点击一次半星、再点一次整颗；减号取消。每次变化都会写入右侧日志。</p>
        <div class="kui-cluster">
            <div data-rt-event data-rating-label="填写体验"></div>
            <span class="form-hint">点击星星或减号观察日志</span>
        </div>
    </div>
    <div class="form-section">
        <h3 class="form-section__title">事件日志</h3>
        <div class="alert alert-info" aria-live="polite">
            <i class="fa fa-info-circle" aria-hidden="true"></i>
            <div><code data-rt-log>score: 4</code></div>
        </div>
        <div class="kui-cluster kui-justify-end">
            <button type="button" class="btn btn-default btn-sm" data-rt-log-clear>
                <i class="fa fa-times" aria-hidden="true"></i> 清空日志
            </button>
        </div>
    </div>
</div>`,
})}

${callout('半星模式下第一次点击第 N 颗得到 N-0.5，再点同一颗得到 N；关闭 <code>half</code> 后点击一次就是 N。评分值同时写入一个名为 <code>score</code> 的隐藏字段，表单可以直接提交；只读态不产生新值，取消时事件里的分数为 <code>null</code>。')}

${propsTable([
    { name: 'number', type: 'number', defaultValue: '10', desc: '星星数量，五分制传 5。' },
    { name: 'score', type: 'number | null', defaultValue: 'null', desc: '初始分值；half 打开时按 0.5 归一化。' },
    { name: 'half', type: 'boolean', defaultValue: 'false', desc: '允许半星：点击一次取半颗，再点同一颗取整颗；关闭后点击一次就是整颗。键盘方向键以 0.5 步进。' },
    { name: 'readOnly', type: 'boolean', defaultValue: 'false', desc: '只读展示，容器输出 role="img" 与总分，退出键盘序列。' },
    { name: 'readOnly()', type: 'method', desc: '切换只读态并同步 <code>.is-readonly</code> 与无障碍属性。' },
    { name: 'cancel / cancelHint', type: 'boolean / string', defaultValue: 'false / 取消评级！', desc: '是否提供左侧减号，以及它的提示文案。' },
    { name: 'hints', type: 'string[]', desc: '每颗星的提示与无障碍名称，长度与 number 对齐。' },
    { name: 'click / mouseover', type: '(score, event) => void', desc: '提交与悬停回调；悬停只预览整颗，取消时 score 为 null。' },
    { name: 'target / targetType / targetFormat', type: 'string / hint | score / string', desc: '把分数或提示写到指定元素，格式由 targetFormat 决定。' },
    { name: '.rating-sm / .rating-md / .rating-lg', type: 'class', desc: '三档星星尺寸，默认 20px。' },
    { name: '.is-on / .is-half / .is-off', type: 'class', desc: '选中、半星与未选中状态；前两者显示橙色，未选中保持浅灰轮廓。' },
    { name: 'kui:rating:change', type: 'event', desc: '提交或取消后触发，读取 <code>detail.payload.score</code> 得到当前分数。' },
])}

`

    const five = root.querySelector<HTMLElement>('[data-rt-five]')
    const fiveScore = root.querySelector<HTMLElement>('[data-rt-five-score]')
    const fiveHint = root.querySelector<HTMLElement>('[data-rt-five-hint]')
    if (five) {
        const rating = Rating.getOrCreate(five, {
            number: 5,
            half: true,
            score: 3,
            hints: FIVE_HINTS,
        })
        trackComponent(rating)
        five.addEventListener('kui:rating:change', (event) => {
            const score = readScore(event)
            if (fiveScore) {
                fiveScore.textContent = score === null ? '未评分' : score.toFixed(1)
            }
            if (fiveHint) {
                fiveHint.textContent = score === null ? '点击星星给出评分' : `${score.toFixed(1)} 分：${hintAt(score, FIVE_HINTS)}。`
            }
        })
        if (fiveHint) {
            fiveHint.textContent = `3.0 分：${hintAt(3, FIVE_HINTS)}。`
        }
    }

    const whole = root.querySelector<HTMLElement>('[data-rt-whole]')
    const wholeScore = root.querySelector<HTMLElement>('[data-rt-whole-score]')
    const wholeHint = root.querySelector<HTMLElement>('[data-rt-whole-hint]')
    if (whole) {
        const rating = Rating.getOrCreate(whole, {
            number: 5,
            half: false,
            score: 2,
            hints: FIVE_HINTS,
        })
        trackComponent(rating)
        whole.addEventListener('kui:rating:change', (event) => {
            const score = readScore(event)
            if (wholeScore) {
                wholeScore.textContent = score === null ? '未评分' : score.toFixed(1)
            }
            if (wholeHint) {
                wholeHint.textContent = score === null ? '点击星星给出评分' : `${score.toFixed(1)} 分：${hintAt(score, FIVE_HINTS)}。`
            }
        })
        if (wholeHint) {
            wholeHint.textContent = `2.0 分：${hintAt(2, FIVE_HINTS)}。`
        }
    }

    const ten = root.querySelector<HTMLElement>('[data-rt-ten]')
    const tenScore = root.querySelector<HTMLElement>('[data-rt-ten-score]')
    const tenHint = root.querySelector<HTMLElement>('[data-rt-ten-hint]')
    if (ten) {
        const rating = Rating.getOrCreate(ten, {
            number: 10,
            half: true,
            score: 7.5,
            hints: TEN_HINTS,
        })
        trackComponent(rating)
        ten.addEventListener('kui:rating:change', (event) => {
            const score = readScore(event)
            if (tenScore) {
                tenScore.textContent = score === null ? '未评分' : `${score.toFixed(1)} / 10`
            }
            if (tenHint) {
                tenHint.textContent =
                    score === null
                        ? '点击星星给出推荐分'
                        : `当前 ${score.toFixed(1)} 分：${hintAt(score, TEN_HINTS)}。`
            }
        })
        if (tenHint) {
            tenHint.textContent = `当前 7.5 分：${hintAt(7.5, TEN_HINTS)}。`
        }
    }

    const readonly = root.querySelector<HTMLElement>('[data-rt-readonly]')
    if (readonly) {
        const rating = Rating.getOrCreate(readonly, { number: 5, half: true, score: 4.5, readOnly: true })
        rating.readOnly(true)
        trackComponent(rating)
    }

    const cancel = root.querySelector<HTMLElement>('[data-rt-cancel]')
    const cancelScore = root.querySelector<HTMLElement>('[data-rt-cancel-score]')
    const cancelHint = root.querySelector<HTMLElement>('[data-rt-cancel-hint]')
    if (cancel) {
        const rating = Rating.getOrCreate(cancel, {
            number: 5,
            score: 2,
            cancel: true,
            cancelHint: '取消本次评分',
        })
        trackComponent(rating)
        cancel.addEventListener('kui:rating:change', (event) => {
            const score = readScore(event)
            if (cancelScore) {
                cancelScore.textContent = score === null ? '未评分' : score.toFixed(1)
            }
            if (cancelHint) {
                cancelHint.textContent =
                    score === null ? '已取消评分，可重新点击星星' : `当前 ${score.toFixed(1)} 分，可点减号取消。`
            }
        })
    }

    const eventRating = root.querySelector<HTMLElement>('[data-rt-event]')
    const eventLog = root.querySelector<HTMLElement>('[data-rt-log]')
    if (eventRating) {
        const rating = Rating.getOrCreate(eventRating, {
            number: 5,
            half: true,
            score: 4,
            cancel: true,
            cancelHint: '取消本次评分',
        })
        trackComponent(rating)
        eventRating.addEventListener('kui:rating:change', (event) => {
            const score = readScore(event)
            if (eventLog) {
                eventLog.textContent = `score: ${score === null ? 'null' : score}`
            }
        })
    }

    root.querySelector<HTMLElement>('[data-rt-log-clear]')?.addEventListener('click', () => {
        if (eventLog) {
            eventLog.textContent = '暂无事件'
        }
    })
}
