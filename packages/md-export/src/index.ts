import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import type { Browser } from 'puppeteer-core';
import { createMarkdownParser, extractDocumentTitle } from './core/parser.js';
import { createPdfBrowser, renderHtmlToMedia } from './core/printer.js';
import { renderFullHtml } from './core/template.js';
import { discoverTargets } from './core/walker.js';
import type {
  CompileFileResult,
  CompileTarget,
  CompileWorkspaceResult,
  MdExportOptions,
  MdPdfOptions,
} from './types/index.js';

export * from './types/index.js';
export { findBrowserExecutable } from './core/browser.js';
export { createMarkdownParser } from './core/parser.js';
export {
  printHtmlFileToPdf,
  captureHtmlFileToImage,
  renderHtmlToMedia,
  createPdfBrowser,
} from './core/printer.js';
export { renderFullHtml } from './core/template.js';
export { discoverTargets } from './core/walker.js';

/**
 * Compiles a single markdown target to HTML and/or PDF.
 */
export async function compileTarget(
  target: CompileTarget,
  options: MdExportOptions = {},
  sharedBrowser?: Browser
): Promise<CompileFileResult> {
  const startTime = performance.now();
  const rootDir = path.resolve(options.rootDir || process.cwd());
  const formats = options.format || ['pdf', 'html'];
  const shouldExportHtml = formats.includes('html');
  const shouldExportPdf = formats.includes('pdf');
  const shouldExportPng = formats.includes('png');
  const shouldExportJpeg = formats.includes('jpeg');
  const needsMediaRender = shouldExportPdf || shouldExportPng || shouldExportJpeg;

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
  let exportedPngPath: string | undefined = undefined;
  let exportedJpegPath: string | undefined = undefined;

  // 4. Render media (PDF, PNG, JPEG) if requested
  if (needsMediaRender) {
    await renderHtmlToMedia(
      target.htmlPath,
      {
        pdfPath: shouldExportPdf ? target.pdfPath : undefined,
        pngPath: shouldExportPng ? target.pngPath : undefined,
        jpegPath: shouldExportJpeg ? target.jpegPath : undefined,
      },
      {
        executablePath: options.executablePath,
        pdfFormat: options.pdfFormat,
        margin: options.margin,
        printBackground: options.printBackground,
        imageQuality: options.imageQuality,
      },
      sharedBrowser
    );

    if (shouldExportPdf) exportedPdfPath = target.pdfPath;
    if (shouldExportPng) exportedPngPath = target.pngPath;
    if (shouldExportJpeg) exportedJpegPath = target.jpegPath;
  }

  // If user only wanted media and not HTML, delete intermediate HTML
  if (!shouldExportHtml && fs.existsSync(target.htmlPath)) {
    fs.unlinkSync(target.htmlPath);
    exportedHtmlPath = undefined;
  }

  const durationMs = Math.round(performance.now() - startTime);

  return {
    target,
    htmlPath: exportedHtmlPath,
    pdfPath: exportedPdfPath,
    pngPath: exportedPngPath,
    jpegPath: exportedJpegPath,
    durationMs,
  };
}

/**
 * Scans the workspace directory tree and compiles all matching Markdown files.
 * Reuses a single headless browser instance across all PDF operations for peak performance.
 */
export async function compileWorkspace(
  options: MdExportOptions = {}
): Promise<CompileWorkspaceResult> {
  const overallStart = performance.now();
  const rootDir = path.resolve(options.rootDir || process.cwd());
  const formats = options.format || ['pdf', 'html'];
  const targets = await discoverTargets(options);

  if (targets.length === 0) {
    if (!options.silent) {
      console.warn(`[tuquet/md-export] No markdown files matched in: ${rootDir}`);
    }
    return { results: [], totalDurationMs: 0 };
  }

  const needsBrowser =
    targets.length > 0 && formats.some((f) => ['pdf', 'png', 'jpeg'].includes(f));
  let sharedBrowser: Browser | undefined = undefined;
  if (needsBrowser) {
    sharedBrowser = await createPdfBrowser(options.executablePath);
  }

  const results: CompileFileResult[] = [];

  try {
    for (const target of targets) {
      const res = await compileTarget(target, options, sharedBrowser);
      results.push(res);
      if (!options.silent) {
        const outList = [res.htmlPath, res.pdfPath, res.pngPath, res.jpegPath]
          .filter(Boolean)
          .map((p) => path.basename(p!))
          .join(', ');
        const rel = target.relativeDir ? `${target.relativeDir}/` : '';
        console.log(
          `[tuquet/md-export] Compiled ${rel}${target.basename}.md -> [${outList}] (${res.durationMs}ms)`
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
