import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

const errors = [];

// 1. Check packages/
const packagesDir = path.join(rootDir, 'packages');
if (fs.existsSync(packagesDir)) {
  const packageFolders = fs
    .readdirSync(packagesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const pkgName of packageFolders) {
    const pkgPath = path.join(packagesDir, pkgName);
    const readmePath = path.join(pkgPath, 'README.md');
    const pkgJsonPath = path.join(pkgPath, 'package.json');

    if (fs.existsSync(pkgJsonPath)) {
      try {
        JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
      } catch (e) {
        errors.push(`[${pkgName}] Invalid package.json: ${e.message}`);
      }
    }

    if (!fs.existsSync(readmePath)) {
      errors.push(`[${pkgName}] Missing README.md at packages/${pkgName}/README.md`);
      continue;
    }

    const content = fs.readFileSync(readmePath, 'utf8');
    if (content.length < 150) {
      errors.push(
        `[${pkgName}] README.md is too short (${content.length} chars, minimum 150 chars). Please provide proper documentation.`
      );
    }

    if (!content.includes('```')) {
      errors.push(`[${pkgName}] README.md must contain at least one code block (\`\`\`) with usage examples.`);
    }

    if (!content.toLowerCase().includes(pkgName.toLowerCase())) {
      errors.push(`[${pkgName}] README.md must reference the package name (${pkgName}).`);
    }
  }
}

// 2. Check apps/
const appsDir = path.join(rootDir, 'apps');
if (fs.existsSync(appsDir)) {
  const appFolders = fs
    .readdirSync(appsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== '.gitkeep')
    .map((d) => d.name);

  for (const appName of appFolders) {
    const appPath = path.join(appsDir, appName);
    const readmePath = path.join(appPath, 'README.md');

    if (!fs.existsSync(readmePath)) {
      errors.push(`[apps/${appName}] Missing README.md at apps/${appName}/README.md`);
      continue;
    }

    const content = fs.readFileSync(readmePath, 'utf8');
    if (content.length < 150) {
      errors.push(`[apps/${appName}] README.md is too short (${content.length} chars, minimum 150 chars).`);
    }
  }
}

// 3. Check Root README.md sync
const rootReadmePath = path.join(rootDir, 'README.md');
if (!fs.existsSync(rootReadmePath)) {
  errors.push('Root README.md is missing!');
} else {
  const rootContent = fs.readFileSync(rootReadmePath, 'utf8');
  if (fs.existsSync(packagesDir)) {
    const packageFolders = fs
      .readdirSync(packagesDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    for (const pkgName of packageFolders) {
      const pattern1 = `@tuquet/${pkgName}`;
      const pattern2 = `packages/${pkgName}`;
      if (!rootContent.includes(pattern1) && !rootContent.includes(pattern2)) {
        errors.push(
          `[Root README] Package "${pkgName}" (@tuquet/${pkgName}) is not cataloged in root README.md! Every package in packages/ must be listed in root README.md.`
        );
      }
    }
  }
}

if (errors.length > 0) {
  console.error('\n❌ Documentation Verification Failed!');
  console.error('The following documentation invariants were violated:\n');
  for (const err of errors) {
    console.error(`  - ${err}`);
  }
  console.error('\n💡 Rule: "Zero-Undocumented Code Invariant"');
  console.error(
    'Every package and app MUST have a comprehensive README.md with code examples, and MUST be cataloged in root README.md before committing.\n'
  );
  process.exit(1);
} else {
  console.log('✔ All packages and apps have valid documentation in README.md!');
}
