<div align="center">
  <img src="https://tuquet.com/icons/lib.svg" width="76" height="76" alt="Lib Logo" />
  <h1>Tuquet UI &amp; Utilities Library Monorepo</h1>
  <p><strong>Enterprise Shadcn-Vue Component Library &amp; Modular Developer Utilities</strong></p>

  <p>
    <a href="https://storybook.tuquet.com/"><img src="https://img.shields.io/badge/Storybook-Live%20Showcase-ff4785.svg" alt="Storybook" /></a>
    <a href="https://pnpm.io/"><img src="https://img.shields.io/badge/pnpm-9.x-orange.svg" alt="pnpm" /></a>
    <a href="https://turbo.build/"><img src="https://img.shields.io/badge/Turborepo-2.x-blue.svg" alt="Turborepo" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License" /></a>
  </p>
</div>

---

> Production-ready TypeScript & Vue 3 library monorepo architecture using **pnpm**, **Turborepo**, **tsup**, **Vitest**, **publint**, and **Changesets**.
>
> 🎨 **Live Storybook Showcase**: [https://storybook.tuquet.com/](https://storybook.tuquet.com/)

---

## 📂 Repository Structure

```text
tuquet-lib/
├── apps/
│   └── storybook/            # @tuquet/storybook (Interactive Storybook showcase)
├── packages/                 # Publishable libraries (@tuquet/*)
│   ├── vue-ui/               # @tuquet/vue-ui (Enterprise Shadcn-Vue component library)
│   ├── lunar/                # @tuquet/lunar (Vietnamese astronomical Lunar-Solar calendar)
│   └── md-export/            # @tuquet/md-export (Folder-aware Markdown to PDF, HTML, PNG, and JPEG exporter)
├── tooling/                  # Shared configurations across packages
│   ├── tsconfig/             # @tuquet/tsconfig (Shared TypeScript configs)
│   ├── eslint-config/        # @tuquet/eslint-config (Shared ESLint configs)
│   └── scripts/              # Monorepo governance & verification scripts
├── .changeset/               # Versioning and release management configuration
├── .github/workflows/        # CI/CD workflows (CI check & Automated npm release)
├── package.json              # Root workspace orchestrator
├── pnpm-workspace.yaml       # pnpm workspace definition
├── turbo.json                # Turborepo task pipeline definition
├── vitest.workspace.ts       # Vitest workspace definition
└── README.md
```

---

## 📦 Packages & Applications Catalog

| Package / Directory     | Path                                       | Description                                                                                                                                                                | Status & Build                             |
| :---------------------- | :----------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------- |
| **`@tuquet/vue-ui`**    | [`packages/vue-ui`](packages/vue-ui)       | Official Shadcn-Vue component library with 58+ accessible components powered by Reka UI, Tailwind CSS, and Sonner Toaster.                                                 | Dual ESM/CJS • Types • Style.css • Publint |
| **`@tuquet/lunar`**     | [`packages/lunar`](packages/lunar)         | Astronomical Vietnamese Lunar-Solar calendar converter, Sexagenary Cycle (Can Chi), 24 Solar Terms (Tiet Khi), and recurrence calculator (Memorials, Full Moon, New Moon). | Zero-dep • Dual ESM/CJS • 17/17 tests      |
| **`@tuquet/md-export`** | [`packages/md-export`](packages/md-export) | Folder-aware Markdown to PDF, HTML, PNG, and JPEG multi-format exporter via Chromium (zero-config discovery), CLI & API.                                                   | Dual ESM/CJS • CLI • Types • Vitest        |
| **`@tuquet/storybook`** | [`apps/storybook`](apps/storybook)         | Interactive component showcase and documentation portal deployed at `storybook.tuquet.com`.                                                                                | Storybook 8 • Vue 3 • Vite                 |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `>= 20.0.0`
- **pnpm**: `>= 9.0.0`

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Build All Packages

```bash
pnpm build
```

Turborepo orchestrates builds across packages based on dependency order, caching build outputs in `.turbo`.

### 3. Run Unit Tests

```bash
pnpm test
```

Runs Vitest across all workspace packages in parallel and verifies documentation compliance.

---

## 🛠 Available Scripts

| Command                 | Description                                           |
| :---------------------- | :---------------------------------------------------- |
| `pnpm build`            | Compiles all packages using `tsup` via Turborepo      |
| `pnpm dev`              | Starts watch mode for active library development      |
| `pnpm test`             | Runs all unit test suites using Vitest                |
| `pnpm test:watch`       | Starts Vitest in interactive watch mode               |
| `pnpm typecheck`        | Type-checks all TypeScript code across the repository |
| `pnpm lint`             | Lints all packages using ESLint 9 Flat Config         |
| `pnpm lint:fix`         | Automatically fixes linting issues                    |
| `pnpm format`           | Formats all files using Prettier                      |
| `pnpm format:check`     | Validates code formatting compliance                  |
| `pnpm check:exports`    | Validates package exports compliance using `publint`  |
| `pnpm clean`            | Cleans build artifacts (`dist/`) and caches           |
| `pnpm changeset`        | Generates a changeset entry for modified packages     |
| `pnpm version-packages` | Bumps package versions based on changesets            |
| `pnpm release`          | Publishes updated packages to npm registry            |

---

## 📦 Packages Overview

### 1. `@tuquet/vue-ui`

Enterprise UI component library based on **Shadcn-Vue** and **Reka UI**, providing accessible primitives, dark mode tokens, and toast notifications.

```vue
<script setup lang="ts">
import { Button, Input, Dialog, DialogTrigger, DialogContent } from '@tuquet/vue-ui';
</script>

<template>
  <div class="flex items-center gap-3 p-4">
    <Input placeholder="Enter workspace name..." />
    <Button variant="default">Create Workspace</Button>
  </div>
</template>
```

📖 _Detailed Documentation_: See [`packages/vue-ui/README.md`](packages/vue-ui/README.md).

### 2. `@tuquet/lunar`

High-precision astronomical Vietnamese Lunar-Solar calendar engine based on Jean Meeus' algorithms. Zero dependencies, dual ESM/CJS, supporting Sexagenary Cycle (Can Chi), 24 Solar Terms, and recurrence calculations for lunar holidays and memorial events.

```typescript
import { solarToLunar, getSolarTerm, getCanChiYear } from '@tuquet/lunar';

const lunar = solarToLunar({ day: 10, month: 2, year: 2024 });
console.log(lunar); // { day: 1, month: 1, year: 2024, isLeap: false }

const term = getSolarTerm(2024, 2, 4); // "Lap Xuan" (Beginning of Spring)
const canChi = getCanChiYear(2024); // "Giap Thin" (Year of the Dragon)
```

📖 _Detailed Documentation_: See [`packages/lunar/README.md`](packages/lunar/README.md).

### 3. `@tuquet/md-export`

High-performance, directory-aware Markdown to PDF, HTML, PNG, and JPEG multi-format exporter powered by headless Chromium (Chrome/Edge zero-config discovery). Designed for monorepos, automated documentation pipelines, and multi-lingual resume/profile generation.

```bash
# Compile root README and all locale subfolders (vi/README.md, etc.)
tuquet-md-export --dir . --format all --styles style/pdf-export.css
```

```typescript
import { compileWorkspace } from '@tuquet/md-export';

const { results } = await compileWorkspace({
  rootDir: process.cwd(),
  pattern: '**/README.md',
  format: ['pdf', 'html', 'png', 'jpeg'],
  styles: ['style/pdf-export.css'],
});
```

📖 _Detailed Documentation_: See [`packages/md-export/README.md`](packages/md-export/README.md).

---

## 📄 License

Distributed under the [MIT License](LICENSE).
