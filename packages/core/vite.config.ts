import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const componentEntries = readdirSync(resolve(__dirname, 'src/components'), { withFileTypes: true })
    .filters((entry) => entry.isDirectory())
    .map((entry) => resolve(__dirname, 'src/components', entry.name, 'index.ts));

export default defineConfig({
    plugins: [
        dts([
            entryRoot: 'src',
            include: ['src'],
            outDir: 'dist',
            rollupTypes: false,
            tsconfigPath: resolve(__dirname, 'tsconfig.json'),
        ]),
    ],
    build: {
        emptyOutDir: true,
        lib: { entry: resolve(__dirname, 'src/index.ts'), formats: ['es']},
        rollupOptions: {
            input: [
                resolve(__dirname, 'src/index.ts'),
                resolve(__dirname, 'src/core/index.ts'),
                resolve(__dirname, 'src/utils/index.ts'),
                ...componentEntries,
            ],
            external: ['@floating-ui/dom'],
            preserveEntrySignatures: 'strict',
            output: {
                format: 'es',
                preserveModules: true,
                preserveModulesRoot: 'src',
                entryFileNames: '[name].js',
            },
        },
        sourcemap: true,
        target: 'es2020',
    }
})
