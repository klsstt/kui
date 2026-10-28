import js from '@eslint/js'
import tseslint from 'typescript-eslint'

/**
 * ESLint 9 的扁平配置。
 * 只保留与 KUI 命名/术语规范强相关的规则，不做风格强制（风格交给 Prettier）。
 */
export default tseslint.config(
    {
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            '**/dist-demo/**',
            '**/public/**',
            '**/.codebuddy/**',
            '**/coverage/**',
            'packages/*/dist/**',
        ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.{ts,js,mjs,cjs}'],
        rules: {
            '@typescript-eslint/no-require-imports': 'off',
            // 与 kui-naming-terminology 一致：接口不使用 I 前缀，此处只约束显式 any
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            // typescript-eslint 官方建议关闭 no-undef：类型检查已覆盖该问题，
            // 而为 node / browser / vitest 三套全局分别声明成本更高。
            'no-undef': 'off',
            'no-console': 'off',
            eqeqeq: ['error', 'smart'],
            'prefer-const': 'error',
            // 空 catch 在资源释放路径上是刻意的（失败不阻塞切换）
            'no-empty': ['error', { allowEmptyCatch: true }],
            // KUI 用空接口作为可配置选项的扩展点（interface XOptions extends BaseOptions {}）
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/no-unused-expressions': 'off',
        },
    },
    {
        files: ['scripts/**/*.mjs'],
        rules: {
            '@typescript-eslint/no-require-imports': 'off',
        },
    },
)
