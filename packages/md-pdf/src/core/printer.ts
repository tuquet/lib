import fs from 'node:fs';
import path from 'node:path';
import puppeteer, { type Browser, type PaperFormat, type PDFMargin } from 'puppeteer-core';
import { findBrowserExecutable } from './browser.js';

export interface PrintOptions {
  executablePath?: string;
  pdfFormat?: PaperFormat;
  margin?: PDFMargin;
  printBackground?: boolean;
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

export async function printHtmlFileToPdf(
  htmlPath: string,
  outputPath: string,
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

    // Ensure output directory exists
    const outDir = path.dirname(outputPath);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    await page.pdf({
      path: outputPath,
      format: options.pdfFormat || 'A4',
      printBackground: options.printBackground !== false,
      margin: options.margin || {
        top: '1.5cm',
        bottom: '1cm',
        left: '1cm',
        right: '1cm',
      },
    });

    await page.close();
  } finally {
    if (shouldCloseBrowser) {
      await browser.close();
    }
  }
}
