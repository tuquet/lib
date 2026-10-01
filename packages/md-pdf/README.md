# @tuquet/md-pdf

> **Folder-aware Markdown to PDF and HTML compiler using headless Chromium.**  
> Designed for monorepos, documentation sites, and multilingual profile structures.

---

## 🚀 Features

- **Folder-Aware Tree Traversal:** Recursively finds and compiles Markdown files across directory hierarchies (`README.md`, `vi/README.md`, `ja/README.md`) while maintaining correct relative paths.
- **Full Feature Parity with `vscode-markdown-pdf`:** Export directly to **PDF (`.pdf`)**, **HTML (`.html`)**, **PNG (`.png`)**, and **JPEG (`.jpeg`)** (or all at once).
- **Zero-Config Browser Auto-Detection:** Automatically discovers system installations of **Google Chrome** and **Microsoft Edge** across Windows, macOS, and Linux without downloading 300MB Chromium bundles.
- **Fast Batch Compilation:** Reuses a single headless browser instance across multiple documents and formats, speeding up batch exports by up to 5x.
- **Syntax Highlighting & Responsive Tables:** Integrated with `highlight.js` and responsive table wrappers.
- **Programmatic & CLI Ready:** Use directly from your scripts or via CLI (`tuquet-md-pdf` / `npx @tuquet/md-pdf`).

---

## 📦 Installation

```bash
# In your project or workspace:
pnpm add -D @tuquet/md-pdf
# or
npm install --save-dev @tuquet/md-pdf
```

---

## ⚡ CLI Usage

### Basic Compilation

Compiles all `**/README.md` files in the current directory tree into both `.pdf` and `.html`:

```bash
npx tuquet-md-pdf
```

### Export All Formats (PDF, HTML, PNG, JPEG)

```bash
npx tuquet-md-pdf --dir . --format all --styles style/pdf-export.css
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
import { compileWorkspace, compileTarget, discoverTargets } from '@tuquet/md-pdf';

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

## 📄 License

MIT © Tuquet Ecosystem
