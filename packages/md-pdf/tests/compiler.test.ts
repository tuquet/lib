import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { compileWorkspace, findBrowserExecutable } from '../src/index.js';

describe('@tuquet/md-pdf', () => {
  let tempDir: string;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tuquet-md-pdf-test-'));

    // Create root README.md
    fs.writeFileSync(
      path.join(tempDir, 'README.md'),
      '# English Documentation\n\nWelcome to Tuquet test documentation.\n\n| Param | Type |\n|---|---|\n| id | string |\n',
      'utf-8'
    );

    // Create nested vi/README.md
    const viDir = path.join(tempDir, 'vi');
    fs.mkdirSync(viDir, { recursive: true });
    fs.writeFileSync(
      path.join(viDir, 'README.md'),
      '# Tài liệu Tiếng Việt\n\nChào mừng bạn đến với tài liệu Tuquet.\n',
      'utf-8'
    );
  });

  afterAll(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it('detects a system browser executable (Chrome or Edge)', () => {
    const browserPath = findBrowserExecutable();
    expect(browserPath).toBeDefined();
    expect(fs.existsSync(browserPath)).toBe(true);
  });

  it('compiles folder structure recursively (root + subfolder) to both PDF and HTML', async () => {
    const { results, totalDurationMs } = await compileWorkspace({
      rootDir: tempDir,
      pattern: '**/README.md',
      format: ['pdf', 'html'],
      silent: true,
    });

    expect(results).toHaveLength(2);
    expect(totalDurationMs).toBeGreaterThan(0);

    // Check root outputs
    const rootHtml = path.join(tempDir, 'README.html');
    const rootPdf = path.join(tempDir, 'README.pdf');
    expect(fs.existsSync(rootHtml)).toBe(true);
    expect(fs.existsSync(rootPdf)).toBe(true);
    expect(fs.statSync(rootPdf).size).toBeGreaterThan(1000);

    // Check nested vi outputs
    const viHtml = path.join(tempDir, 'vi', 'README.html');
    const viPdf = path.join(tempDir, 'vi', 'README.pdf');
    expect(fs.existsSync(viHtml)).toBe(true);
    expect(fs.existsSync(viPdf)).toBe(true);
    expect(fs.statSync(viPdf).size).toBeGreaterThan(1000);
  }, 45000);

  it('compiles Markdown to full-page PNG and JPEG images', async () => {
    const { results } = await compileWorkspace({
      rootDir: tempDir,
      pattern: 'README.md',
      format: ['png', 'jpeg'],
      silent: true,
    });

    expect(results).toHaveLength(1);
    const rootPng = path.join(tempDir, 'README.png');
    const rootJpeg = path.join(tempDir, 'README.jpeg');

    expect(fs.existsSync(rootPng)).toBe(true);
    expect(fs.existsSync(rootJpeg)).toBe(true);
    expect(fs.statSync(rootPng).size).toBeGreaterThan(1000);
    expect(fs.statSync(rootJpeg).size).toBeGreaterThan(1000);
  }, 45000);
});
