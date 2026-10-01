import type { PaperFormat, PDFMargin } from 'puppeteer-core';

export type ExportFormat = 'pdf' | 'html';

export interface MdPdfOptions {
  /** Root directory to scan (default: current working directory) */
  rootDir?: string;
  /** Glob pattern(s) to match markdown files (default: all README.md files) */
  pattern?: string | string[];
  /** Glob patterns to ignore (default: node_modules, dist, .git) */
  ignore?: string[];
  /** Formats to export (default: ['pdf', 'html']) */
  format?: ExportFormat[];
  /** Stylesheet paths or URLs to inject */
  styles?: string[];
  /** PDF paper format (default: 'A4') */
  pdfFormat?: PaperFormat;
  /** PDF margins (default: { top: '1.5cm', bottom: '1cm', left: '1cm', right: '1cm' }) */
  margin?: PDFMargin;
  /** Print background colors and images (default: true) */
  printBackground?: boolean;
  /** Custom Chromium/Chrome/Edge executable path */
  executablePath?: string;
  /** Custom output directory. If omitted, outputs are placed next to the source markdown file */
  outputDir?: string;
  /** If true, converts file named README.html to index.html or generates smart redirect */
  autoRedirectHtml?: boolean;
  /** Suppress console logs */
  silent?: boolean;
}

export interface CompileTarget {
  /** Absolute path to markdown source */
  mdPath: string;
  /** Directory relative to rootDir */
  relativeDir: string;
  /** Basename without extension */
  basename: string;
  /** Output PDF destination path */
  pdfPath: string;
  /** Output HTML destination path */
  htmlPath: string;
  /** Relative prefix back to root (e.g. "./" or "../") */
  relPrefix: string;
}

export interface CompileFileResult {
  target: CompileTarget;
  htmlPath?: string;
  pdfPath?: string;
  durationMs: number;
}

export interface CompileWorkspaceResult {
  results: CompileFileResult[];
  totalDurationMs: number;
}
