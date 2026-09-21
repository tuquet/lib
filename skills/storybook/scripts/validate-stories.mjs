#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../../');

console.log('🔍 [Storybook Validator] Đang quét kiểm tra các file *.stories.ts...');

function findStoryFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === 'dist' || file === '.turbo' || file === 'storybook-static') {
      continue;
    }
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findStoryFiles(fullPath, fileList);
    } else if (file.endsWith('.stories.ts') || file.endsWith('.stories.js')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const storyFiles = [
  ...findStoryFiles(path.join(REPO_ROOT, 'packages')),
  ...findStoryFiles(path.join(REPO_ROOT, 'apps')),
];

let totalErrors = 0;

for (const filePath of storyFiles) {
  const relPath = path.relative(REPO_ROOT, filePath);
  const content = fs.readFileSync(filePath, 'utf-8');

  // 1. Kiểm tra từ khóa 'as' trong chuỗi template: ` ... `
  const templateRegex = /template:\s*`([^`]+)`/gs;
  let match;
  while ((match = templateRegex.exec(content)) !== null) {
    const templateStr = match[1];
    // Tìm các trường hợp ép kiểu: 'as Type', 'as any', 'as string' bên trong template
    const asMatch = templateStr.match(/\bas\s+[A-Za-z0-9_]+/g);
    if (asMatch) {
      console.error(`❌ [${relPath}]: Phát hiện từ khóa ép kiểu 'as' trong chuỗi HTML template: [${asMatch.join(', ')}]`);
      console.error(`   👉 Giải pháp: Di chuyển logic ép kiểu vào setup(), không dùng 'as' trong template HTML.`);
      totalErrors++;
    }
  }

  // 2. Kiểm tra khai báo default export meta
  if (!content.includes('export default meta')) {
    console.error(`❌ [${relPath}]: Thiếu 'export default meta;' chuẩn CSF3.`);
    totalErrors++;
  }
}

if (totalErrors > 0) {
  console.error(`\n🚨 Phát hiện ${totalErrors} lỗi cú pháp trong các file Storybook! Vui lòng sửa trước khi commit.`);
  process.exit(1);
} else {
  console.log(`\n✨ Tuyệt vời! Tất cả ${storyFiles.length} file stories đều đạt chuẩn CSF3 và không có lỗi cú pháp template.`);
}
