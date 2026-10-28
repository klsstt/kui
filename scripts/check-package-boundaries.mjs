import { readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join, relative, resolve } from 'node:path'

const repositoryRoot = process.cwd()
const violations = []

const forbiddenImports = {
    'packages/core': ['@kui/style', '@kui/tokens', 'packages/styles', 'packages/tokens'],
    'packages/styles': ['@kui/core', 'packages/core'],
    'packages/tokens': ['@kui/core', '@kui/style', 'packages/core', 'packages/styles'],
}

function walk(dir, onFile) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name)
        if (entry.isDirectory()) {
            if (['node_modules', 'dist', '.git'].includes(entry.name)) continue
            walk(full, onFile)
        } else if (entry.isFile()) {
            onFile(full)
        }
    }
}

for (const [scope, forbidden] of Object.entries(forbiddenImports)) {
    const scopeRoot = resolve(repositoryRoot, scope)
    walk(scopeRoot, (file) => {
        if (!['.ts', '.mjs', '.scss', '.js'].includes(extname(file))) return
        const content = readFileSync(file, 'utf8')
        const matched = forbidden.find((name) => content.includes(name))
        if (matched) {
            violations.push(`${relative(repositoryRoot, file)} 违反了包边界，引用了 ${matched}`)
        }
    })
}

/**
 * 展示站（app/admin）只允许消费 packages 的“编译产物”。
 * packages 会单独发布到 npm，因此展示站必须像外部使用者一样引用 dist，
 * 不允许穿透到 packages/*\/src。
 */
const adminRoot = resolve(repositoryRoot, 'app/admin')
const sourceRefs = [/from\s+['"][^'"]*packages\/[^'"]*\/src\//, /from\s+['"]@kui\/[^'"]*\/src\//, /from\s+['"]\.\.\/\.\.\/packages\//]

if (statSync(adminRoot, { throwIfNoEntry: false })) {
    walk(adminRoot, (file) => {
        if (!['.ts', '.js', '.mjs', '.html', '.scss'].includes(extname(file))) return
        const content = readFileSync(file, 'utf8')
        for (const pattern of sourceRefs) {
            if (pattern.test(content)) {
                violations.push(`${relative(repositoryRoot, file)} 引用了 packages 源码，应改为引用编译产物（dist）`)
                break
            }
        }
    })
}

if (violations.length) {
    console.error('包边界校验失败：')
    for (const violation of violations) console.error(`  - ${violation}`)
    process.exit(1)
}

console.log('包边界校验通过。')
void statSync
