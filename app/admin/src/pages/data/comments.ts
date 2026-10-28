import type { DocPageContext } from '../../docs/types'
import { callout, demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 评论页面。
 * 一条评论由「头像 + 作者 + 时间 + 正文 + 工具条」组成，回复挂在同一列里缩进，
 * 最多两层；发表区与列表共用同一套间距，提交后真实追加到列表末尾。
 */

const replyTemplate =
    '<button type="button" data-cm-like data-cm-likes="0" aria-pressed="false"><i class="fa fa-thumbs-o-up" aria-hidden="true"></i> 0</button>' +
    '<button type="button" data-cm-reply="我"><i class="fa fa-reply" aria-hidden="true"></i> 回复</button>'

function bindThread(thread: HTMLElement, input: HTMLTextAreaElement | null): void {
    thread.addEventListener('click', (event) => {
        const target = event.target instanceof Element ? event.target : null
        if (!target) {
            return
        }

        const like = target.closest<HTMLElement>('[data-cm-like]')
        if (like) {
            const base = Number(like.dataset.cmLikes ?? '0')
            const liked = like.classList.toggle('is-active')
            like.setAttribute('aria-pressed', String(liked))
            like.innerHTML = `<i class="fa ${liked ? 'fa-thumbs-up' : 'fa-thumbs-o-up'}" aria-hidden="true"></i> ${base + (liked ? 1 : 0)}`
            return
        }

        const reply = target.closest<HTMLElement>('[data-cm-reply]')
        if (reply && input) {
            input.value = `@${reply.dataset.cmReply ?? ''} `
            input.focus()
            input.scrollIntoView({ block: 'center', behavior: 'smooth' })
        }
    })
}

export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '评论把一条内容变成对话。两层以内保持可读，超过两层改用「查看更多回复」；点赞与回复放在正文下方，与输入区保持同一条竖线。',
    tags: ['.kui-comment', '.kui-comment__replies', '.kui-composer'],
})}

${sectionTitle('对话与发表', '一条线程最多两层回复；发表区与线程共用同一套间距，提交后直接追加到当前列表。')}

${demo({
    title: '两层评论线程',
    desc: '主评论下挂一层回复，回复里的引用块保留上下文；点赞只切换图标、aria-pressed 与计数，不改变排序。头像与正文共用本地图片与同一套行高。',
    tags: ['.kui-comment__replies', 'aria-pressed', './images/portraits'],
    script: `
const thread = document.querySelector<HTMLElement>('[data-cm-thread]')
const input = document.querySelector<HTMLTextAreaElement>('[data-cm-input]')

thread?.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null

    const like = target?.closest<HTMLElement>('[data-cm-like]')
    if (like) {
        const base = Number(like.dataset.cmLikes ?? '0')
        const liked = like.classList.toggle('is-active')
        like.setAttribute('aria-pressed', String(liked))
        like.innerHTML = '<i class="fa ' + (liked ? 'fa-thumbs-up' : 'fa-thumbs-o-up') + '" aria-hidden="true"></i> ' + (base + (liked ? 1 : 0))
        return
    }

    const reply = target?.closest<HTMLElement>('[data-cm-reply]')
    if (reply && input) {
        input.value = '@' + (reply.dataset.cmReply ?? '') + ' '
        input.focus()
        input.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
})
`,
    html: `
<div class="kui-stack" data-cm-thread>
    <article class="kui-comment">
        <span class="kui-avatar"><img src="./images/portraits/1.jpg" alt="林澈"></span>
        <div class="kui-comment__body">
            <div class="kui-comment__head">
                <span class="kui-comment__author">林澈</span>
                <span class="badge badge-primary">作者</span>
                <span class="kui-comment__time">今天 09:24</span>
            </div>
            <p class="kui-comment__content">这版报价单把年度框架价单独拆出来了，华南区的三档折扣看起来更清楚。接下来会把交付周期也放进同一张表。</p>
            <div class="kui-comment__toolbar">
                <button type="button" data-cm-like data-cm-likes="12" aria-pressed="false"><i class="fa fa-thumbs-o-up" aria-hidden="true"></i> 12</button>
                <button type="button" data-cm-reply="林澈"><i class="fa fa-reply" aria-hidden="true"></i> 回复</button>
            </div>
            <div class="kui-comment__replies">
                <article class="kui-comment">
                    <span class="kui-avatar kui-avatar--sm"><img src="./images/portraits/4.jpg" alt="苏晚"></span>
                    <div class="kui-comment__body">
                        <div class="kui-comment__head">
                            <span class="kui-comment__author">苏晚</span>
                            <span class="kui-comment__time">今天 09:41</span>
                        </div>
                        <p class="kui-comment__content">交付周期建议按大区拆，华东和华南的仓配时效差两天。</p>
                        <div class="kui-comment__toolbar">
                            <button type="button" data-cm-like data-cm-likes="3" aria-pressed="false"><i class="fa fa-thumbs-o-up" aria-hidden="true"></i> 3</button>
                            <button type="button" data-cm-reply="苏晚"><i class="fa fa-reply" aria-hidden="true"></i> 回复</button>
                        </div>
                    </div>
                </article>
                <article class="kui-comment">
                    <span class="kui-avatar kui-avatar--sm"><img src="./images/portraits/2.jpg" alt="周昕"></span>
                    <div class="kui-comment__body">
                        <div class="kui-comment__head">
                            <span class="kui-comment__author">周昕</span>
                            <span class="kui-comment__time">今天 10:02</span>
                        </div>
                        <p class="kui-comment__quote">交付周期建议按大区拆</p>
                        <p class="kui-comment__content">同意，补货申请里已经按大区记录了在途天数，可以直接沿用到这张表。</p>
                        <div class="kui-comment__toolbar">
                            <button type="button" data-cm-like data-cm-likes="1" aria-pressed="false"><i class="fa fa-thumbs-o-up" aria-hidden="true"></i> 1</button>
                            <button type="button" data-cm-reply="周昕"><i class="fa fa-reply" aria-hidden="true"></i> 回复</button>
                        </div>
                    </div>
                </article>
            </div>
        </div>
    </article>
    <article class="kui-comment">
        <span class="kui-avatar"><img src="./images/portraits/7.jpg" alt="何晏"></span>
        <div class="kui-comment__body">
            <div class="kui-comment__head">
                <span class="kui-comment__author">何晏</span>
                <span class="kui-comment__time">昨天 18:30</span>
            </div>
            <p class="kui-comment__content">已同步到报价单 v3，历史版本可以在右侧版本列表里回看。华南区的三家门店这周会先用到新版。</p>
            <div class="kui-comment__toolbar">
                <button type="button" data-cm-like data-cm-likes="6" aria-pressed="false"><i class="fa fa-thumbs-o-up" aria-hidden="true"></i> 6</button>
                <button type="button" data-cm-reply="何晏"><i class="fa fa-reply" aria-hidden="true"></i> 回复</button>
            </div>
        </div>
    </article>
</div>`,
})}

${demo({
    title: '发表评论：真实追加到列表',
    desc: '提交后把新评论插到当前线程末尾，计数同步更新；回复按钮把 @昵称写进输入框并聚焦，不弹二次对话框。输入为空时不产生空评论。',
    tags: ['.kui-composer', 'submit', '追加评论'],
    script: `
const form = document.querySelector<HTMLFormElement>('[data-cm-composer]')
const input = document.querySelector<HTMLTextAreaElement>('[data-cm-input]')
const thread = document.querySelector<HTMLElement>('[data-cm-live-thread]')
const count = document.querySelector<HTMLElement>('[data-cm-count]')

form?.addEventListener('submit', (event) => {
    event.preventDefault()
    const text = input?.value.trim()
    if (!input || !text || !thread) return

    const comment = document.createElement('article')
    comment.className = 'kui-comment'
    comment.innerHTML = '<span class="kui-avatar"><img src="./images/portraits/8.jpg" alt="我"></span>' +
        '<div class="kui-comment__body"><div class="kui-comment__head">' +
        '<span class="kui-comment__author">我</span><span class="kui-comment__time">刚刚</span></div>' +
        '<p class="kui-comment__content"></p><div class="kui-comment__toolbar">' +
        '<button type="button" data-cm-like data-cm-likes="0" aria-pressed="false">' +
        '<i class="fa fa-thumbs-o-up" aria-hidden="true"></i> 0</button>' +
        '<button type="button" data-cm-reply="我"><i class="fa fa-reply" aria-hidden="true"></i> 回复</button>' +
        '</div></div>'

    comment.querySelector('.kui-comment__content')!.textContent = text
    thread.append(comment)
    input.value = ''
    if (count) count.textContent = '共 ' + thread.querySelectorAll('.kui-comment').length + ' 条评论'
})
`,
    html: `
<div class="kui-stack">
    <div class="kui-stack" data-cm-live-thread>
        <article class="kui-comment">
            <span class="kui-avatar"><img src="./images/portraits/4.jpg" alt="苏晚"></span>
            <div class="kui-comment__body">
                <div class="kui-comment__head">
                    <span class="kui-comment__author">苏晚</span>
                    <span class="kui-comment__time">今天 10:18</span>
                </div>
                <p class="kui-comment__content">秋季主视觉已经交稿，门店物料这周五可以到仓。需要先确认一下灯箱的尺寸。</p>
                <div class="kui-comment__toolbar">
                    <button type="button" data-cm-like data-cm-likes="4" aria-pressed="false"><i class="fa fa-thumbs-o-up" aria-hidden="true"></i> 4</button>
                    <button type="button" data-cm-reply="苏晚"><i class="fa fa-reply" aria-hidden="true"></i> 回复</button>
                </div>
            </div>
        </article>
    </div>
    <form class="kui-composer" data-cm-composer>
        <span class="kui-avatar"><img src="./images/portraits/8.jpg" alt="我"></span>
        <div class="kui-composer__body">
            <textarea class="kui-composer__input" data-cm-input placeholder="写下你的想法，支持 Markdown" aria-label="评论内容"></textarea>
            <div class="kui-composer__footer">
                <div class="kui-composer__tools">
                    <button type="button" class="btn btn-ghost btn-sm" aria-label="插入图片"><i class="fa fa-image" aria-hidden="true"></i></button>
                    <button type="button" class="btn btn-ghost btn-sm" aria-label="插入表情"><i class="fa fa-smile-o" aria-hidden="true"></i></button>
                </div>
                <div class="kui-cluster">
                    <span class="form-hint" data-cm-count>共 1 条评论</span>
                    <button type="submit" class="btn btn-primary btn-sm">发表评论</button>
                </div>
            </div>
        </div>
    </form>
</div>`,
})}

${demo({
    title: '关闭评论',
    desc: '内容归档或锁定后不再提供输入区，用空态说明原因并给出替代路径，而不是保留一个禁用的输入框。',
    tags: ['.kui-empty', '归档'],
    stage: 'tinted',
    html: `
<div class="panel">
    <div class="kui-empty">
        <i class="fa fa-comments-o" aria-hidden="true"></i>
        <strong>这条内容已归档</strong>
        <p>归档内容不再接受新评论，需要继续讨论请到「十月渠道复盘」的看板留言。</p>
        <button type="button" class="btn btn-default btn-sm">前往看板</button>
    </div>
</div>`,
})}

${callout('回复最多保留两层，超过两层改用「查看更多回复」进入单独页面。点赞状态用 <code>aria-pressed</code> 表达，计数留在按钮文字里，不另外做悬浮数字。')}

${propsTable([
    { name: '.kui-comment', type: 'class', desc: '单条评论：头像与正文两列，正文列内部纵向排列头、正文、工具条与回复。' },
    { name: '.kui-comment__head', type: 'class', desc: '作者、身份徽章与时间的横排；正文使用 <code>__content</code>，行高 1.75。' },
    { name: '.kui-comment__quote', type: 'class', desc: '引用上一层的片段，灰底小块，不使用引号字符。' },
    { name: '.kui-comment__toolbar', type: 'class', desc: '点赞与回复按钮，按钮为无边框文字按钮，激活态转主色。' },
    { name: '.kui-comment__replies', type: 'class', desc: '回复容器，左侧一条细线表示层级，最多嵌套一层。' },
    { name: '.kui-composer / __input / __footer', type: 'class', desc: '发表区与它的多行输入、底部工具行；输入最小高度 64px。' },
    { name: '[data-cm-like] / aria-pressed', type: 'attribute', desc: '示例钩子：点赞切换图标、计数与按下状态。' },
    { name: '[data-cm-reply]', type: 'attribute', desc: '示例钩子：把被回复人的昵称写入输入框并聚焦。' },
])}

`

    const input = root.querySelector<HTMLTextAreaElement>('[data-cm-input]')
    const thread = root.querySelector<HTMLElement>('[data-cm-thread]')
    const liveThread = root.querySelector<HTMLElement>('[data-cm-live-thread]')

    if (thread) {
        bindThread(thread, input)
    }
    if (liveThread) {
        bindThread(liveThread, input)
    }

    const form = root.querySelector<HTMLFormElement>('[data-cm-composer]')
    const count = root.querySelector<HTMLElement>('[data-cm-count]')

    form?.addEventListener('submit', (event) => {
        event.preventDefault()
        const text = input?.value.trim()
        if (!input || !text || !liveThread) {
            return
        }

        const comment = document.createElement('article')
        comment.className = 'kui-comment'
        comment.innerHTML =
            '<span class="kui-avatar"><img src="./images/portraits/8.jpg" alt="我"></span>' +
            '<div class="kui-comment__body"><div class="kui-comment__head">' +
            '<span class="kui-comment__author">我</span><span class="kui-comment__time">刚刚</span></div>' +
            '<p class="kui-comment__content"></p><div class="kui-comment__toolbar">' +
            replyTemplate +
            '</div></div>'

        comment.querySelector('.kui-comment__content')!.textContent = text
        liveThread.append(comment)
        input.value = ''
        if (count) {
            count.textContent = `共 ${liveThread.querySelectorAll('.kui-comment').length} 条评论`
        }
    })
}
