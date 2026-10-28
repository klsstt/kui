import { readdirSync, statSync } from 'node:fs'
import { extname, join, relative, resolve } from 'node:path'

const repositoryRoot = process.cwd()
const limits = [
    { scope: 'packages/core/src', extension: '.ts', maximum: 40 * 1024 },
    { scope: 'packages/styles/src', extension: '.scss', maximum: 40 * 1024 },
    { scope: 'packages/tokens/src', extension: '.ts', maximum: 40 * 1024 },
]

const violations = []
let scanned = 0

function walk(dir, onFile) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name)
        if (entry.isDirectory()) {
            walk(full, onFile)
        } else if (entry.isFile()) {
            onFile(full)
        }
    }
}

for (const limit of limits) {
    const scopeRoot = resolve(repositoryRoot, limit.scope)
    walk(scopeRoot, (file) => {
        if (extname(file) !== limit.extension) return
        scanned += 1
        const size = statSync(file).size
        if (size > limit.maximum) {
            violations.push(`${relative(repositoryRoot, file)} 超过单文件上限：${size} 字节 > ${limit.maximum} 字节`)
        }
    })
}

if (violations.length) {
    console.error('源码体积校验失败：')
    for (const violation of violations) console.error(`  - ${violation}`)
    process.exit(1)
}

console.log(`源码体积校验通过，已扫描 ${scanned} 个文件。`)
