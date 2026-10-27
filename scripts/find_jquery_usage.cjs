const fs = require('fs');
const path = require('path');

const root = path.resolve(process.cwd());
const srcDir = path.join(root, 'src');
const outDir = path.join(root, 'reports');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const exts = ['.html', '.js', '.ts'];
const pattern = /\$\(|\bjQuery\b/g;

function walk(dir) {
  const files = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      files.push(...walk(full));
    } else if (stat.isFile() && exts.includes(path.extname(name))) {
      files.push(full);
    }
  }
  return files;
}

const files = walk(srcDir);
const results = [];
for (const f of files) {
  try {
    const content = fs.readFileSync(f, 'utf8');
    const matches = content.match(pattern);
    if (matches && matches.length) {
      results.push({ file: path.relative(root, f).replace(/\\/g, '/'), count: matches.length });
    }
  } catch (e) {
    // ignore
  }
}

results.sort((a,b) => b.count - a.count);
const out = [];
out.push('# jQuery 使用报告');
out.push('生成时间: ' + new Date().toISOString());
out.push('');
out.push('| 文件 | 匹配次数 |');
out.push('| ---- | ------: |');
for (const r of results) {
  out.push(`| ${r.file} | ${r.count} |`);
}
if (results.length === 0) out.push('*未发现 $() 或 jQuery 使用*');

fs.writeFileSync(path.join(outDir, 'jquery-usage.md'), out.join('\n'), 'utf8');
console.log('报告已生成: reports/jquery-usage.md');
