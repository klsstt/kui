import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import * as sass from 'sass';

const run = promisify(execFile);
const packageRoot = fileURLToPath(new URL('.', import.meta.url));
const output = resolve(packageRoot, 'dist');

await rm(output, { force: true, recursive: true });
await mkdir(output, { recursive: true });
await run(process.execPath, [resolve(packageRoot, '../../node_modules/typescript/bin/tsc'), '-p', resolve(packageRoot, 'tsconfig.json')]);

const result = await sass.compileAsync(resolve(packageRoot, 'src/styles/_layers.scss'), {style: 'compressed' });
await writeFile(resolve(output, 'tokens.css'), result.css);

const tokenModule = await import (`${pathToFileURL(resolve(output, 'index.js')).href}?build=${Date.now()}`);
const flattened = tokenModule.flattenThemeTokens(tokenModule.defaultTokens);
const css = await readFile(resolve(output, 'tokens.css'), 'utf8');
const cssTokenNames = new Set(css.match(/--kui-[\w-]+(?=:)/g) ?? []);
const dataTokenNames = Object.keys(flattened);
const missing = dataTokenNames.filter((name) => !cssTokenNames.has(name));
const unmanaged = [...cssTokenNames].filter((name) => !(name in flattened));
if (missing.length || unmanaged.length) {
    throw new Error(`Token ouputs are inconsistent. Missing CSS: ${missing.join(', ') || 'none'}; missing data: ${unmanaged.join(', ') || 'none' }.`);
}

await writeFile(resolve(output, 'tokens.json'), `${JSON.stringify(tokenModule.defaultTokens, null, 2)}\n`);
