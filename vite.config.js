import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    publicDir: false,
    resolve: {
        alias: [
            {find: /^@kuiuni\/core\/Components\/V(.+)$/, replacement: resolve(__dirname, 'packages/core/src/components/$1/index.ts')},
            {find: /^@kuiuni\/core\/internals$/, replacement: resolve(__dirname, 'packages/core/src/core/index.ts')},
            {find: /^@kuiuni\/core\/utils$/, replacement: resolve(__dirname, 'packages/core/src/utils/index.ts')},
            {find: /^@kuiuni\/core$/, replacement: resolve(__dirname, 'packages/core/src/index.ts')},
            {find: /^@kuiuni\/tokens\/styles/, replacement: resolve(__dirname, 'packages/tokens/src/styles')},
            {find: /^@kuiuni\/styles\/source/, replacement: resolve(__dirname, 'packages/styles/src')},
            {find: /^@kuiuni\/tokens$/, replacement: resolve(__dirname, 'packages/tokens/src/index.ts')},
        ],
    },
    test: {
        environment: 'jsdom',
        globals: true,
        include: ['tests/unit/**/*.test.ts'],
    },
    server: {
        open: '/index.html',
    },
});
