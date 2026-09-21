import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const storybookStaticDir = resolve(process.cwd(), 'apps/storybook/storybook-static');
const indexJsonPath = resolve(storybookStaticDir, 'index.json');

console.log('🔍 Starting Storybook Automated Acceptance Test...');

if (!existsSync(indexJsonPath)) {
  console.error(`❌ index.json not found at ${indexJsonPath}`);
  process.exit(1);
}

const indexData = JSON.parse(readFileSync(indexJsonPath, 'utf-8'));
const entries = Object.entries(indexData.entries || {});

console.log(`📦 Found ${entries.length} total entries in Storybook index.json:`);

let passedCount = 0;
let failedCount = 0;

for (const [id, entry] of entries) {
  const isStory = entry.type === 'story';
  const isDocs = entry.type === 'docs';
  const prefix = isStory ? '  [Story]' : '  [Docs] ';
  
  // Verify that the entry has a valid title and name
  if (!entry.title || !entry.name) {
    console.error(`❌ Invalid metadata for entry '${id}'`);
    failedCount++;
    continue;
  }

  // Ensure title conforms to Table/ or Introduction
  if (!entry.title.startsWith('Table') && entry.title !== 'Introduction') {
    console.warn(`⚠️ Non-standard category: ${entry.title}`);
  }

  // Check HTTP response from local static server (port 6006)
  const targetUrl = `http://127.0.0.1:6006/iframe.html?id=${encodeURIComponent(id)}&viewMode=${isStory ? 'story' : 'docs'}`;
  try {
    const res = await fetch(targetUrl);
    if (!res.ok) {
      console.error(`❌ HTTP ${res.status} fetching ${id}`);
      failedCount++;
      continue;
    }
    const html = await res.text();
    if (html.includes('sb-nopreview_heading') && !html.includes('storybook-root')) {
      console.error(`❌ No Preview error detected in ${id}`);
      failedCount++;
      continue;
    }
    console.log(`✅ ${prefix} ${entry.title} > ${entry.name} (${id})`);
    passedCount++;
  } catch (err) {
    console.error(`❌ Network error reaching ${targetUrl}:`, err.message);
    failedCount++;
  }
}

console.log('\n=========================================');
console.log(`📊 Acceptance Test Summary:`);
console.log(`   Total Entries Checked: ${entries.length}`);
console.log(`   Passed: ${passedCount}`);
console.log(`   Failed: ${failedCount}`);
console.log('=========================================');

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 All Storybook stories and docs passed acceptance testing!');
}
