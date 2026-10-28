import { existsSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const repositoryRoot = process.cwd()
const manifestPath = resolve(repositoryRoot, 'dist-demo/.vite/manifest.json')

if (!existsSync(manifestPath)) {
    console.error('未找到 dist-demo/.vite/manifest.json，请先执行 vite build')
    process.exit(1)
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const records = Object.entries(manifest)
const htmlEntries = records.filter(([name]) => name.endsWith('.html'))
const scriptChunks = records.filter(([name, item]) => !name.endsWith('.html') && item.file?.endsWith('.js'))
console.log(`[ok] HTML 入口 ${htmlEntries.length} 个，脚本分块 ${scriptChunks.length} 个`)

// 展示站必须依赖 @kui/core 的产物，而非源码目录，否则产物无法独立部署
const violations = []
let cssChunkCount = 0
for (const [name, item] of records) {
    if (name.includes('packages/core/src')) {
        violations.push(`${name} 直接引用了 core 源码`)
    }
    cssChunkCount += (item.css ?? []).length
}
if (!cssChunkCount) {
    violations.push('产物中没有任何 CSS 分块，样式可能未参与构建')
}

if (!htmlEntries.length) {
    violations.push('产物中没有 HTML 入口')
}

// 页面应当按需加载：主入口之外必须存在独立页面分块
const pageChunks = records.filter(([name]) => name.includes('src/pages/'))
if (pageChunks.length < 10) {
    violations.push(`页面分块只有 ${pageChunks.length} 个，页面可能没有按需加载`)
}

const indexHtml = resolve(repositoryRoot, 'dist-demo/index.html')
if (existsSync(indexHtml)) {
    const size = statSync(indexHtml).size
    if (size < 512) {
        violations.push(`dist-demo/index.html 过小（${size} 字节）`)
    }
}

if (violations.length) {
    console.error('\n展示站产物校验失败：')
    for (const violation of violations) {
        console.error(`  - ${violation}`)
    }
    process.exit(1)
}

console.log('展示站产物校验通过。')
