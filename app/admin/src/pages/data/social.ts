import type { DocPageContext } from '../../docs/types'
import { callout, demo, pageHead, propsTable, sectionTitle } from '../../docs/ui'

/**
 * 社交页面。
 * 一条动态由「作者 + 正文 + 媒体 + 计数 + 操作栏」组成，
 * 媒体决定结构：四图用网格、单图用 16:9、没有媒体就纯文本收尾。
 */

function bindFeed(scope: HTMLElement): void {
    scope.querySelectorAll<HTMLElement>('[data-social-post]').forEach((post) => {
        const likeCount = post.querySelector<HTMLElement>('[data-social-like-count]')

        post.querySelectorAll<HTMLElement>('[data-social-like]').forEach((button) => {
            button.addEventListener('click', () => {
                const liked = button.classList.toggle('is-active')
                button.setAttribute('aria-pressed', String(liked))
                button.innerHTML = `<i class="fa ${liked ? 'fa-thumbs-up' : 'fa-thumbs-o-up'}" aria-hidden="true"></i> ${liked ? '已赞' : '赞'}`
                if (likeCount) {
                    likeCount.textContent = String(Number(likeCount.textContent ?? '0') + (liked ? 1 : -1))
                }
            })
        })

        post.querySelectorAll<HTMLElement>('[data-social-save]').forEach((button) => {
            button.addEventListener('click', () => {
                const saved = button.classList.toggle('is-active')
                button.setAttribute('aria-pressed', String(saved))
                button.innerHTML = `<i class="fa ${saved ? 'fa-bookmark' : 'fa-bookmark-o'}" aria-hidden="true"></i> ${saved ? '已收藏' : '收藏'}`
            })
        })
    })
}

export default function render({ root, meta }: DocPageContext): void {
    root.innerHTML = `
${pageHead(meta, {
    lead: '动态流要在同一列里容纳长短不一的正文与不同数量的图片。结构由媒体数量决定，操作栏固定在卡片底部，计数与按钮共用同一行状态。',
    tags: ['.kui-feed', '.kui-post', '.kui-post__media'],
})}

${sectionTitle('动态流', '媒体数量决定结构：四图网格、单图 16:9、纯文本自然收束。')}

${demo({
    title: '图文动态：四图网格',
    desc: '四张图按 2×2 排布，比例固定为 4:3；作者行右侧留一个「更多」入口，计数与操作栏分开，避免计数被误点。点赞与收藏都同步 aria-pressed。',
    tags: ['.kui-post__media', '.kui-post__actions', 'aria-pressed'],
    script: `
document.querySelectorAll<HTMLElement>('[data-social-post]').forEach((post) => {
    const count = post.querySelector<HTMLElement>('[data-social-like-count]')

    post.querySelectorAll<HTMLElement>('[data-social-like]').forEach((button) => {
        button.addEventListener('click', () => {
            const liked = button.classList.toggle('is-active')
            button.setAttribute('aria-pressed', String(liked))
            button.innerHTML = '<i class="fa ' + (liked ? 'fa-thumbs-up' : 'fa-thumbs-o-up') + '" aria-hidden="true"></i> ' + (liked ? '已赞' : '赞')
            if (count) count.textContent = String(Number(count.textContent ?? '0') + (liked ? 1 : -1))
        })
    })

    post.querySelectorAll<HTMLElement>('[data-social-save]').forEach((button) => {
        button.addEventListener('click', () => {
            const saved = button.classList.toggle('is-active')
            button.setAttribute('aria-pressed', String(saved))
            button.innerHTML = '<i class="fa ' + (saved ? 'fa-bookmark' : 'fa-bookmark-o') + '" aria-hidden="true"></i> ' + (saved ? '已收藏' : '收藏')
        })
    })
})
`,
    html: `
<div class="kui-feed" data-social-feed>
    <article class="kui-post" data-social-post>
        <header class="kui-post__head">
            <span class="kui-avatar kui-avatar--lg"><img src="./images/portraits/1.jpg" alt="林澈"><span class="kui-avatar__status"></span></span>
            <div class="kui-post__author">
                <span class="kui-post__name">林澈 <span class="badge badge-primary">运营</span></span>
                <span class="kui-post__time">今天 09:24 · 来自 Web</span>
            </div>
            <button type="button" class="btn btn-ghost btn-sm" aria-label="更多操作"><i class="fa fa-ellipsis-h" aria-hidden="true"></i></button>
        </header>
        <p class="kui-post__content">秋季视觉素材的第一轮选片结束，四张备选按人物与场景分组。等门店确认主图后，再统一下发物料尺寸。</p>
        <div class="kui-post__media">
            <img src="./images/photos/city-1.jpg" alt="秋季视觉素材 1" loading="lazy">
            <img src="./images/photos/city-2.jpg" alt="秋季视觉素材 2" loading="lazy">
            <img src="./images/photos/city-3.jpg" alt="秋季视觉素材 3" loading="lazy">
            <img src="./images/photos/city-4.jpg" alt="秋季视觉素材 4" loading="lazy">
        </div>
        <div class="kui-post__stats">
            <span><i class="fa fa-thumbs-o-up" aria-hidden="true"></i> <span data-social-like-count>32</span> 赞</span>
            <span><i class="fa fa-comment-o" aria-hidden="true"></i> 8 条评论</span>
            <span><i class="fa fa-share-alt" aria-hidden="true"></i> 转发 3</span>
        </div>
        <div class="kui-post__actions">
            <button type="button" class="kui-post__action" data-social-like aria-pressed="false"><i class="fa fa-thumbs-o-up" aria-hidden="true"></i> 赞</button>
            <button type="button" class="kui-post__action"><i class="fa fa-comment-o" aria-hidden="true"></i> 评论</button>
            <button type="button" class="kui-post__action"><i class="fa fa-share-alt" aria-hidden="true"></i> 转发</button>
            <button type="button" class="kui-post__action" data-social-save aria-pressed="false"><i class="fa fa-bookmark-o" aria-hidden="true"></i> 收藏</button>
        </div>
    </article>
</div>`,
})}

${demo({
    title: '单图与纯文本',
    desc: '单图用 16:9 保持横向构图；没有媒体时正文直接接计数，卡片高度由内容决定，不强行撑满。两种形态都不改变作者行与操作栏的位置。',
    tags: ['.kui-post__media--single', '纯文本'],
    html: `
<div class="kui-feed" data-social-feed>
    <article class="kui-post" data-social-post>
        <header class="kui-post__head">
            <span class="kui-avatar kui-avatar--lg"><img src="./images/portraits/4.jpg" alt="苏晚"><span class="kui-avatar__status is-busy"></span></span>
            <div class="kui-post__author">
                <span class="kui-post__name">苏晚 <span class="badge badge-neutral">设计</span></span>
                <span class="kui-post__time">昨天 18:30</span>
            </div>
        </header>
        <p class="kui-post__content">新版报价单的封面换成横向版式，压在打印纸上刚好一页。封面用了这张石像纹理做底，内页的折扣表也一起收窄了，留给备注的宽度更充足。</p>
        <div class="kui-post__media kui-post__media--single">
            <img src="./images/photos/city-5.jpg" alt="封面纹理参考">
        </div>
        <div class="kui-post__stats">
            <span><i class="fa fa-thumbs-o-up" aria-hidden="true"></i> <span data-social-like-count>18</span> 赞</span>
            <span><i class="fa fa-comment-o" aria-hidden="true"></i> 4 条评论</span>
        </div>
        <div class="kui-post__actions">
            <button type="button" class="kui-post__action" data-social-like aria-pressed="false"><i class="fa fa-thumbs-o-up" aria-hidden="true"></i> 赞</button>
            <button type="button" class="kui-post__action"><i class="fa fa-comment-o" aria-hidden="true"></i> 评论</button>
            <button type="button" class="kui-post__action" data-social-save aria-pressed="false"><i class="fa fa-bookmark-o" aria-hidden="true"></i> 收藏</button>
        </div>
    </article>
    <article class="kui-post" data-social-post>
        <header class="kui-post__head">
            <span class="kui-avatar kui-avatar--lg"><img src="./images/portraits/7.jpg" alt="何晏"></span>
            <div class="kui-post__author">
                <span class="kui-post__name">何晏 <span class="badge badge-warning">供应链</span></span>
                <span class="kui-post__time">昨天 11:08</span>
            </div>
        </header>
        <p class="kui-post__content">华东仓 12 个 SKU 已补货到位，本周的调拨计划不用再往后顺延。相关单据已经同步到看板，需要核对的同学直接看「在途」那一列。</p>
        <div class="kui-post__stats">
            <span><i class="fa fa-thumbs-o-up" aria-hidden="true"></i> <span data-social-like-count>9</span> 赞</span>
            <span><i class="fa fa-comment-o" aria-hidden="true"></i> 2 条评论</span>
        </div>
        <div class="kui-post__actions">
            <button type="button" class="kui-post__action" data-social-like aria-pressed="false"><i class="fa fa-thumbs-o-up" aria-hidden="true"></i> 赞</button>
            <button type="button" class="kui-post__action"><i class="fa fa-share-alt" aria-hidden="true"></i> 转发</button>
        </div>
    </article>
</div>`,
})}

${demo({
    title: '两图动态与已收藏状态',
    desc: '两张图仍按 2×2 网格排布，只占第一行；收藏按钮的初始状态用 is-active 与 aria-pressed=true 同时表达，点一下就能回到未收藏。',
    tags: ['.kui-post__media', '.is-active', '收藏'],
    stage: 'tinted',
    html: `
<div class="kui-feed" data-social-feed>
    <article class="kui-post" data-social-post>
        <header class="kui-post__head">
            <span class="kui-avatar kui-avatar--lg"><img src="./images/portraits/7.jpg" alt="宁夏"></span>
            <div class="kui-post__author">
                <span class="kui-post__name">宁夏 <span class="badge badge-info">财务</span></span>
                <span class="kui-post__time">10 月 25 日 16:40</span>
            </div>
            <button type="button" class="btn btn-ghost btn-sm" aria-label="更多操作"><i class="fa fa-ellipsis-h" aria-hidden="true"></i></button>
        </header>
        <p class="kui-post__content">月度结算的最后一轮核对结束，华南区的两笔差异已经定位到运费模板。附上两张现场素材，下周会把模板也一起归档。</p>
        <div class="kui-post__media">
            <img src="./images/photos/city-6.jpg" alt="结算现场素材 1">
            <img src="./images/photos/city-2.jpg" alt="结算现场素材 2">
        </div>
        <div class="kui-post__stats">
            <span class="tag">结算</span>
            <span class="tag">华南区</span>
            <span class="tag">对账</span>
        </div>
        <div class="kui-post__stats">
            <span><i class="fa fa-thumbs-o-up" aria-hidden="true"></i> <span data-social-like-count>24</span> 赞</span>
            <span><i class="fa fa-comment-o" aria-hidden="true"></i> 6 条评论</span>
            <span><i class="fa fa-share-alt" aria-hidden="true"></i> 转发 1</span>
        </div>
        <div class="kui-post__actions">
            <button type="button" class="kui-post__action" data-social-like aria-pressed="false"><i class="fa fa-thumbs-o-up" aria-hidden="true"></i> 赞</button>
            <button type="button" class="kui-post__action"><i class="fa fa-comment-o" aria-hidden="true"></i> 评论</button>
            <button type="button" class="kui-post__action is-active" data-social-save aria-pressed="true"><i class="fa fa-bookmark" aria-hidden="true"></i> 已收藏</button>
        </div>
    </article>
</div>`,
})}

${callout('媒体区只使用本地图片：四图与两图共用 <code>.kui-post__media</code> 的 4:3 裁切，单图加 <code>--single</code> 变为 16:9。同一组图片保持同一比例，混用比例会让网格出现高度差。')}

${propsTable([
    { name: '.kui-feed', type: 'class', desc: '动态流容器，纵向排列，卡片之间保持一档间距。' },
    { name: '.kui-post', type: 'class', desc: '单条动态卡片：作者行、正文、媒体、计数、操作栏五段。' },
    { name: '.kui-post__head / __author', type: 'class', desc: '作者行：头像、姓名与身份徽章、时间；右侧可放更多操作。' },
    { name: '.kui-avatar__status', type: 'class', desc: '头像右下角在线状态；is-busy 为忙碌，is-offline 为离线。' },
    { name: '.kui-post__content', type: 'class', desc: '正文，行高 1.75，允许换行与长段落。' },
    { name: '.kui-post__media', type: 'class', desc: '两列图片网格，图片按 4:3 裁切；两图与四图共用同一套网格。' },
    { name: '.kui-post__media--single', type: 'class', desc: '单图修饰：单列网格，图片按 16:9 裁切。' },
    { name: '.kui-post__stats', type: 'class', desc: '计数行：赞、评论、转发，只读文本，不承载点击。' },
    { name: '.kui-post__actions / __action', type: 'class', desc: '底部等分操作栏，悬停转主色，激活态用 is-active 与 aria-pressed 同步。' },
    { name: 'data-social-like / data-social-save', type: 'attribute', desc: '示例页的钩子：点赞计数与收藏状态，业务里换成接口调用。' },
])}

`

    root.querySelectorAll<HTMLElement>('[data-social-feed]').forEach((feed) => bindFeed(feed))
}
