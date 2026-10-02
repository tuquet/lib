<div align="center">
  <img src="./assets/logo.svg" width="76" height="76" alt="MD Export Logo" />
  <h1>@tuquet/md-export</h1>
  <p><strong>Folder-Aware Markdown to PDF, HTML, PNG, and JPEG Exporter</strong></p>

  <p>
    <a href="https://pnpm.io/"><img src="https://img.shields.io/badge/pnpm-ready-orange.svg" alt="pnpm" /></a>
    <img src="https://img.shields.io/badge/Formats-PDF%20%7C%20HTML%20%7C%20PNG%20%7C%20JPEG-blue.svg" alt="Formats" />
    <img src="https://img.shields.io/badge/Engine-Chromium%20Zero--Config-brightgreen.svg" alt="Chromium" />
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License" /></a>
  </p>
</div>

---

> **Folder-aware Markdown to PDF, HTML, PNG, and JPEG multi-format exporter using headless Chromium.**  
> Designed for monorepos, documentation sites, and multilingual profile structures.

## 🚀 Features

- **Folder-Aware Tree Traversal:** Recursively finds and compiles Markdown files across directory hierarchies (`README.md`, `vi/README.md`, `ja/README.md`) while maintaining correct relative paths.
- **Full Feature Parity with `vscode-markdown-pdf`:** Export directly to **PDF (`.pdf`)**, **HTML (`.html`)**, **PNG (`.png`)**, and **JPEG (`.jpeg`)** (or all at once).
- **Zero-Config Browser Auto-Detection:** Automatically discovers system installations of **Google Chrome** and **Microsoft Edge** across Windows, macOS, and Linux without downloading 300MB Chromium bundles.
- **Fast Batch Compilation:** Reuses a single headless browser instance across multiple documents and formats, speeding up batch exports by up to 5x.
- **Syntax Highlighting & Responsive Tables:** Integrated with `highlight.js` and responsive table wrappers.
- **Programmatic & CLI Ready:** Use directly from your scripts or via CLI (`tuquet-md-export` / `npx @tuquet/md-export`).

---

## 📦 Installation

```bash
# In your project or workspace:
pnpm add -D @tuquet/md-export
# or
npm install --save-dev @tuquet/md-export
```

---

## ⚡ CLI Usage

### Basic Compilation

Compiles all `**/README.md` files in the current directory tree into both `.pdf` and `.html`:

```bash
npx tuquet-md-export
```

### Export All Formats (PDF, HTML, PNG, JPEG)

```bash
npx tuquet-md-export --dir . --format all --styles style/pdf-export.css
```

### Options

| Flag                     | Description                                      | Default                 |
| :----------------------- | :----------------------------------------------- | :---------------------- |
| `[dir]`, `-d, --dir`     | Target root directory to scan                    | `.` (current directory) |
| `-f, --format <formats>` | Formats to export (`pdf,html,png,jpeg` or `all`) | `pdf,html`              |
| `-q, --quality <number>` | JPEG image quality (0-100)                       | `90`                    |
| `-p, --pattern <glob>`   | Glob pattern for markdown files                  | `**/README.md`          |
| `-s, --styles <paths>`   | Comma-separated paths to custom CSS files        | `none`                  |
| `-c, --chrome <path>`    | Custom Chrome / Chromium / Edge executable path  | _Auto-detected_         |
| `-o, --output-dir <dir>` | Custom output directory                          | _Same as source file_   |
| `--no-redirect`          | Disable smart HTTP redirect script in HTML       | `false`                 |
| `--silent`               | Suppress non-error logs                          | `false`                 |

---

## 💻 Programmatic API

```typescript
import { compileWorkspace, compileTarget, discoverTargets } from '@tuquet/md-export';

// Compile an entire directory tree
const { results, totalDurationMs } = await compileWorkspace({
  rootDir: process.cwd(),
  pattern: '**/README.md',
  format: ['pdf', 'html'],
  styles: ['style/pdf-export.css'],
});

console.log(`Compiled ${results.length} files in ${totalDurationMs}ms`);
```

---

## 🌐 Ecosystem

Part of the **Automation & Agent Ecosystem**:

- [Automa](https://github.com/tuquet/automa) — Native Chrome/Edge Desktop UI Automation Browser.
- [Runner](https://github.com/tuquet/runner) — High-Performance Distributed Process Supervision Engine in Rust.
- [Browser](https://github.com/tuquet/browser) — High-Performance Headless Web Scraping & Stealth Automation Core.
- [Cloud](https://github.com/tuquet/cloud) — Enterprise Orchestration & Real-time Task Control Plane.
- [CLI](https://github.com/tuquet/cli) — Developer Ergonomic CLI & Unified Command Center.
- [Lib](https://github.com/tuquet/lib) — Monorepo for Shared Enterprise UI & Utilities (`vue-ui`, `vue-table`, `md-export`, `extension-runner`, `lunar`).
- [Scoop Bucket](https://github.com/tuquet/scoop-bucket) — Official Windows Scoop Distribution Channel.

---

## 📄 License

Distributed under the [MIT License](LICENSE).

---

<div align="center">
  <samp>
    <a href="https://tuquet.github.io">Portfolio</a> •
    <a href="https://tuquet.github.io/cv">CV &amp; Resume</a> •
    <a href="https://tuquet.github.io/automa">Automa Studio</a> •
    <a href="https://tuquet.github.io/lib">Component Lab</a> •
    <a href="https://github.com/tuquet/scoop-bucket">Scoop Bucket</a>
  </samp>
</div>
