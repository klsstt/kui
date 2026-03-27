#!/usr/bin/env node

/**
 * KUI 项目迁移脚本
 * 用于从 Gulp 版本升级到 Vite 版本
 * 
 * 使用方法:
 * node migrate.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 KUI 项目迁移工具 - 从 Gulp 到 Vite\n');

// 需要删除的旧文件
const filesToRemove = [
  'gulpfile.js',
  'gulpfile.bak.js'
];

// 检查并删除文件
filesToRemove.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`📁 删除旧文件：${file}`);
    fs.unlinkSync(filePath);
  } else {
    console.log(`⏭️  跳过（不存在）：${file}`);
  }
});

console.log('\n✅ 迁移完成！\n');
console.log('下一步操作：');
console.log('1. 查看 package.json 确认新配置');
console.log('2. 运行 npm run dev 启动开发服务器');
console.log('3. 查看 README.md 了解新功能');
console.log('\n📖 详细信息请查看 QUICKSTART.md\n');
