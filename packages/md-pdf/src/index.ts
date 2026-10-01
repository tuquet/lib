import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import type { Browser } from 'puppeteer-core';
import { createMarkdownParser, extractDocumentTitle } from './core/parser.js';
import { createPdfBrowser, printHtmlFileToPdf } from './core/printer.js';
import { renderFullHtml } from './core/template.js';
import { discoverTargets } from './core/walker.js';
import type {
  CompileFileResult,
  CompileTarget,
  CompileWorkspaceResult,
  MdPdfOptions,
} from './types/index.js';

export * from './types/index.js';
export { findBrowserExecutable } from './core/browser.js';
export { createMarkdownParser } from './core/parser.js';
export { printHtmlFileToPdf, createPdfBrowser } from './core/printer.js';
export { renderFullHtml } from './core/template.js';
export { discoverTargets } from './core/walker.js';

/**
 * Compiles a single markdown target to HTML and/or PDF.
 */
export async function compileTarget(
  target: CompileTarget,
  options: MdPdfOptions = {},
  sharedBrowser?: Browser
): Promise<CompileFileResult> {
  const startTime = performance.now();
  const rootDir = path.resolve(options.rootDir || process.cwd());
  const formats = options.format || ['pdf', 'html'];
  const shouldExportHtml = formats.includes('html');
  const shouldExportPdf = formats.includes('pdf');

  // 1. Read Markdown content
  const markdownText = fs.readFileSync(target.mdPath, 'utf-8');
  const title = extractDocumentTitle(markdownText, target.basename);

  // 2. Parse Markdown to HTML
  const mdParser = createMarkdownParser();
  const renderedContent = mdParser.render(markdownText);

  // 3. Render full HTML document with styles
  const targetDir = path.dirname(target.htmlPath);
  const fullHtml = renderFullHtml({
    title,
    content: renderedContent,
    styles: options.styles,
    rootDir,
    targetDir,
    relPrefix: target.relPrefix,
    autoRedirectHtml: options.autoRedirectHtml !== false,
  });

  // Ensure target directory exists
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Always write HTML (needed for PDF rendering and if html format is chosen)
  fs.writeFileSync(target.htmlPath, fullHtml, 'utf-8');

  let exportedHtmlPath: string | undefined = shouldExportHtml ? target.htmlPath : undefined;
  let exportedPdfPath: string | undefined = undefined;

  // 4. Print to PDF if requested
  if (shouldExportPdf) {
    await printHtmlFileToPdf(
      target.htmlPath,
      target.pdfPath,
      {
        executablePath: options.executablePath,
        pdfFormat: options.pdfFormat,
        margin: options.margin,
        printBackground: options.printBackground,
      },
      sharedBrowser
    );
    exportedPdfPath = target.pdfPath;
  }

  // If user only wanted PDF and not HTML, delete intermediate HTML
  if (!shouldExportHtml && fs.existsSync(target.htmlPath)) {
    fs.unlinkSync(target.htmlPath);
    exportedHtmlPath = undefined;
  }

  const durationMs = Math.round(performance.now() - startTime);

  return {
    target,
    htmlPath: exportedHtmlPath,
    pdfPath: exportedPdfPath,
    durationMs,
  };
}

/**
 * Scans the workspace directory tree and compiles all matching Markdown files.
 * Reuses a single headless browser instance across all PDF operations for peak performance.
 */
export async function compileWorkspace(
  options: MdPdfOptions = {}
): Promise<CompileWorkspaceResult> {
  const overallStart = performance.now();
  const rootDir = path.resolve(options.rootDir || process.cwd());
  const formats = options.format || ['pdf', 'html'];
  const targets = await discoverTargets(options);

  if (targets.length === 0) {
    if (!options.silent) {
      console.warn(`[tuquet/md-pdf] No markdown files matched in: ${rootDir}`);
    }
    return { results: [], totalDurationMs: 0 };
  }

  let sharedBrowser: Browser | undefined = undefined;
  if (formats.includes('pdf')) {
    sharedBrowser = await createPdfBrowser(options.executablePath);
  }

  const results: CompileFileResult[] = [];

  try {
    for (const target of targets) {
      const res = await compileTarget(target, options, sharedBrowser);
      results.push(res);
      if (!options.silent) {
        const outList = [res.htmlPath, res.pdfPath]
          .filter(Boolean)
          .map((p) => path.basename(p!))
          .join(', ');
        const rel = target.relativeDir ? `${target.relativeDir}/` : '';
        console.log(
          `[tuquet/md-pdf] Compiled ${rel}${target.basename}.md -> [${outList}] (${res.durationMs}ms)`
        );
      }
    }
  } finally {
    if (sharedBrowser) {
      await sharedBrowser.close();
    }
  }

  const totalDurationMs = Math.round(performance.now() - overallStart);
  return { results, totalDurationMs };
}
