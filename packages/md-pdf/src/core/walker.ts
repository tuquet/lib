import path from 'node:path';
import fg from 'fast-glob';
import type { CompileTarget, MdPdfOptions } from '../types/index.js';

export async function discoverTargets(options: MdPdfOptions = {}): Promise<CompileTarget[]> {
  const rootDir = path.resolve(options.rootDir || process.cwd());
  const patterns = Array.isArray(options.pattern)
    ? options.pattern
    : [options.pattern || '**/README.md'];

  const ignore = options.ignore || [
    '**/node_modules/**',
    '**/dist/**',
    '**/.git/**',
    '**/.turbo/**',
    '**/target/**',
    '**/build/**',
  ];

  const matchedFiles = await fg(patterns, {
    cwd: rootDir,
    ignore,
    dot: false,
    onlyFiles: true,
  });

  return matchedFiles.map((relFile) => {
    const mdPath = path.resolve(rootDir, relFile);
    const relDir = path.dirname(relFile);
    const normalizedRelDir = relDir === '.' ? '' : relDir.replace(/\\/g, '/');
    const parsed = path.parse(relFile);
    const basename = parsed.name; // e.g. "README"

    const depth = normalizedRelDir === '' ? 0 : normalizedRelDir.split('/').length;
    const relPrefix = depth === 0 ? './' : '../'.repeat(depth);

    let targetDir = path.dirname(mdPath);
    if (options.outputDir) {
      targetDir = path.resolve(rootDir, options.outputDir, normalizedRelDir);
    }

    const pdfPath = path.join(targetDir, `${basename}.pdf`);
    const htmlPath = path.join(targetDir, `${basename}.html`);
    const pngPath = path.join(targetDir, `${basename}.png`);
    const jpegPath = path.join(targetDir, `${basename}.jpeg`);

    return {
      mdPath,
      relativeDir: normalizedRelDir,
      basename,
      pdfPath,
      htmlPath,
      pngPath,
      jpegPath,
      relPrefix,
    };
  });
}
