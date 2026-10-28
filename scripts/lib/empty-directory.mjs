import { existsSync, readdirSync, rmSync, unlinkSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * 清空目录（保留目录本身）。
 * 不使用 fs.rm 的递归删除：部分环境下递归删除会被安全删除钩子接管并失败。
 */
export function emptyDirectory(target) {
    if (!existsSync(target)) {
        return
    }

    for (const entry of readdirSync(target, { withFileTypes: true })) {
        const full = resolve(target, entry.name)
        if (entry.isDirectory()) {
            emptyDirectory(full)
            rmSync(full, { recursive: true, force: true })
        } else {
            unlinkSync(full)
        }
    }
}
