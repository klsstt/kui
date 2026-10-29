import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'

const repositoryRoot = process.cwd()
// 阈值按「最小合理产物」设定：桶文件（仅 re-export）与压缩后的 reset 都很小，
// 这里只用于捕捉「构建失败产出空文件」，不做体积门禁。
const expectations = [
    { file: 'packages/tokens/dist/index.js', minimum: 64 },
    { file: 'packages/tokens/dist/default-tokens.js', minimum: 2048 },
    { file: 'packages/tokens/dist/index.d.ts', minimum: 64 },
    { file: 'packages/tokens/dist/tokens.css', minimum: 2048 },
    { file: 'packages/styles/dist/full.css', minimum: 20480 },
    { file: 'packages/styles/dist/components.css', minimum: 20480 },
    { file: 'packages/styles/dist/reset.css', minimum: 192 },
    { file: 'packages/styles/dist/layout.css', minimum: 512 },
    { file: 'packages/core/dist/index.js', minimum: 2048 },
    { file: 'packages/core/dist/index.d.ts', minimum: 64 },
]

const failures = []
const checkedStylesheets = new Set()

function checkStylesheetAssets(file) {
    if (checkedStylesheets.has(file) || !existsSync(file)) return
    checkedStylesheets.add(file)
    const content = readFileSync(file, 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '')
    const references = [
        ...[...content.matchAll(/@import\s+['"]([^'"]+)['"]/g)].map((match) => match[1]),
        ...[...content.matchAll(/url\(\s*(?:'([^']*)'|"([^"]*)"|([^\s)]+))\s*\)/g)]
            .map((match) => match[1] ?? match[2] ?? match[3]),
    ]
    for (const reference of new Set(references)) {
        if (!reference || /^(?:[a-z][z-z\d+.-]*:|\/|#)/i.test(reference)) continue
        const path = reference.split(/[?#]/, 1)[0]
        if (!path) continue
        const target = resolve(dirname(file), path)
        if (!existsSync(target) || !statSync(target).isFile()) {
            failures.push(`CSS 引用缺少资源：${relative(repositoryRoot, file)} → ${reference}`)
        } else if (target.endsWith('.css')) {
            checkStylesheetAssets(target)
        }
    }
}

for (const expectation of expectations) {
    const target = resolve(repositoryRoot, expectation.file)
    if (!existsSync(target)) {
        failures.push(`缺少产物：${expectation.file}`)
        continue
    }
    const size = statSync(target).size
    if (size < expectation.minimum) {
        failures.push(`产物异常偏小：${expectation.file}（${size} 字节 < ${expectation.minimum} 字节）`)
        continue
    }
    console.log(`[ok] ${expectation.file} ${size} 字节`)
    if (target.endsWith('.css')) checkStylesheetAssets(target)
}

const tokensCss = resolve(repositoryRoot, 'packages/tokens/dist/tokens.css')
if (existsSync(tokensCss)) {
    const content = readFileSync(tokensCss, 'utf8')
    const layerOrder = ['kui.tokens', 'kui.base', 'kui.components', 'kui.utilities', 'kui.overrides']
    const declaration = content.match(/@layer\s+([^;{}]+);/)?.[1].split(',').map((layer) => layer.trim())
    const declared = declaration?.length === layerOrder.length && layerOrder.every((layer, index) => declaration[index] === layer)
    if (!declared) {
        failures.push('tokens.css 未声明完整的 @layer 顺序')
    }
}

if (failures.length) {
    console.error('\n分层产物校验失败：')
    for (const failure of failures) console.error(`  - ${failure}`)
    process.exit(1)
}

console.log('\n分层产物校验通过。')
