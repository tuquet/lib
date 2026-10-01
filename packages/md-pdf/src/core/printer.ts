import fs from 'node:fs';
import path from 'node:path';
import puppeteer, { type Browser, type PaperFormat, type PDFMargin } from 'puppeteer-core';
import { findBrowserExecutable } from './browser.js';

export interface PrintOptions {
  executablePath?: string;
  pdfFormat?: PaperFormat;
  margin?: PDFMargin;
  printBackground?: boolean;
  imageQuality?: number;
}

export interface RenderMediaOutputs {
  pdfPath?: string;
  pngPath?: string;
  jpegPath?: string;
}

export async function createPdfBrowser(executablePath?: string): Promise<Browser> {
  const resolvedExecutable = findBrowserExecutable(executablePath);

  return puppeteer.launch({
    executablePath: resolvedExecutable,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--font-render-hinting=medium',
    ],
  });
}

export async function renderHtmlToMedia(
  htmlPath: string,
  outputs: RenderMediaOutputs,
  options: PrintOptions = {},
  existingBrowser?: Browser
): Promise<void> {
  const browser = existingBrowser || (await createPdfBrowser(options.executablePath));
  const shouldCloseBrowser = !existingBrowser;

  try {
    const page = await browser.newPage();

    // Use file:// URL so that relative assets (images, fonts, stylesheets) resolve correctly
    const fileUrl = 'file:///' + path.resolve(htmlPath).replace(/\\/g, '/');

    await page.goto(fileUrl, {
      waitUntil: ['load', 'networkidle0'],
      timeout: 30000,
    });

    if (outputs.pdfPath) {
      const outDir = path.dirname(outputs.pdfPath);
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }
      await page.pdf({
        path: outputs.pdfPath,
        format: options.pdfFormat || 'A4',
        printBackground: options.printBackground !== false,
        margin: options.margin || {
          top: '1.5cm',
          bottom: '1cm',
          left: '1cm',
          right: '1cm',
        },
      });
    }

    if (outputs.pngPath) {
      const outDir = path.dirname(outputs.pngPath);
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }
      await page.screenshot({
        path: outputs.pngPath,
        type: 'png',
        fullPage: true,
      });
    }

    if (outputs.jpegPath) {
      const outDir = path.dirname(outputs.jpegPath);
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }
      await page.screenshot({
        path: outputs.jpegPath,
        type: 'jpeg',
        quality: options.imageQuality ?? 90,
        fullPage: true,
      });
    }

    await page.close();
  } finally {
    if (shouldCloseBrowser) {
      await browser.close();
    }
  }
}

export async function printHtmlFileToPdf(
  htmlPath: string,
  outputPath: string,
  options: PrintOptions = {},
  existingBrowser?: Browser
): Promise<void> {
  return renderHtmlToMedia(htmlPath, { pdfPath: outputPath }, options, existingBrowser);
}

export async function captureHtmlFileToImage(
  htmlPath: string,
  outputPath: string,
  format: 'png' | 'jpeg',
  options: PrintOptions = {},
  existingBrowser?: Browser
): Promise<void> {
  const outputs: RenderMediaOutputs =
    format === 'jpeg' ? { jpegPath: outputPath } : { pngPath: outputPath };
  return renderHtmlToMedia(htmlPath, outputs, options, existingBrowser);
}
