<div align="center">
  <img src="./assets/logo.svg" width="76" height="76" alt="Lib Logo" />
  <h1>Lib Monorepo</h1>
  <p><strong>Enterprise UI Design System, Remote Data Grids &amp; Modular Developer Toolchain</strong></p>

  <p>
    <a href="https://tuquet.github.io/lib/"><img src="https://img.shields.io/badge/Storybook-Live%20Showcase-ff4785.svg" alt="Storybook" /></a>
    <a href="https://pnpm.io/"><img src="https://img.shields.io/badge/pnpm-9.x-orange.svg" alt="pnpm" /></a>
    <a href="https://turbo.build/"><img src="https://img.shields.io/badge/Turborepo-2.x-blue.svg" alt="Turborepo" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License" /></a>
  </p>
</div>

---

> Production-ready TypeScript & Vue 3 library monorepo architecture using **pnpm**, **Turborepo**, **tsup**, **Vitest**, **publint**, and **Changesets**.
>
> 🎨 **Live Storybook Showcase**: [https://tuquet.github.io/lib/](https://tuquet.github.io/lib/)

---

## 📂 Repository Structure

```text
tuquet-lib/
├── apps/                     # Runnable applications & consumer products
├── packages/                 # Publishable libraries (@tuquet/*)
│   ├── lunar/                # @tuquet/lunar (Vietnamese astronomical Lunar-Solar calendar)
│   ├── extension-runner/     # @tuquet/extension-runner (Isomorphic WebExtension polyfill & headless bundler)
│   ├── md-export/            # @tuquet/md-export (Folder-aware Markdown to PDF, HTML, PNG, and JPEG multi-format exporter)
│   ├── vue-ui/               # @tuquet/vue-ui (Enterprise Shadcn-Vue 35+ component library)
│   └── vue-table/            # @tuquet/vue-table (Remote Data Table with TanStack & Shadcn-Vue)
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

| Package / Directory            | Path                                                     | Description                                                                                                                                                                | Status & Build                             |
| :----------------------------- | :------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------- |
| **`@tuquet/lunar`**            | [`packages/lunar`](packages/lunar)                       | Astronomical Vietnamese Lunar-Solar calendar converter, Sexagenary Cycle (Can Chi), 24 Solar Terms (Tiet Khi), and recurrence calculator (Memorials, Full Moon, New Moon). | Zero-dep • Dual ESM/CJS • 17/17 tests      |
| **`@tuquet/extension-runner`** | [`packages/extension-runner`](packages/extension-runner) | Isomorphic WebExtension polyfill, crash-proof mock runtime, and headless runner bundler plugin.                                                                            | Dual ESM/CJS • Types • Publint • Vitest    |
| **`@tuquet/md-export`**        | [`packages/md-export`](packages/md-export)               | Folder-aware Markdown to PDF, HTML, PNG, and JPEG multi-format exporter via Chromium (zero-config discovery), CLI & API.                                                   | Dual ESM/CJS • CLI • Types • Vitest        |
| **`@tuquet/vue-ui`**           | [`packages/vue-ui`](packages/vue-ui)                     | Official Shadcn-Vue component library with 36+ accessible components powered by Reka UI (Radix Vue), Tailwind CSS, and Sonner Toaster.                                     | Dual ESM/CJS • Types • Style.css • Publint |
| **`@tuquet/vue-table`**        | [`packages/vue-table`](packages/vue-table)               | Remote-driven Data Table with TanStack, virtual scrolling, multi-format export (CSV, TSV, XLSX), URL sync, and AbortController.                                            | Dual ESM/CJS • Types • Publint • Vitest    |
| **`apps/`**                    | [`apps/`](apps)                                          | Root directory for runnable end-user products, bots, and full-stack services.                                                                                              | Workspace standard                         |

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

Runs Vitest across all workspace packages in parallel.

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

Enterprise UI component library based on **Shadcn-Vue** and **Reka UI (Radix Vue)**, providing 36+ accessible primitives, dark mode tokens, and toast notifications.

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

### 2. `@tuquet/vue-table`

Enterprise remote-driven Data Table powered by **TanStack Table v8** and **Shadcn-Vue**. Built for high-density business dashboards with virtual scrolling (100,000+ rows), URL query synchronization, and multi-format data export (XLSX, CSV, TSV).

```vue
<script setup lang="ts">
import { DataTable, useRemoteTable, type ColumnDef } from '@tuquet/vue-table';

const columns: ColumnDef<Record<string, unknown>>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name', enableSorting: true },
  { accessorKey: 'status', header: 'Status' },
];

const { tableProps, pagination, search } = useRemoteTable({
  endpoint: '/api/v1/tenants',
  columns,
});
</script>

<template>
  <DataTable v-bind="tableProps" />
</template>
```

📖 _Detailed Documentation_: See [`packages/vue-table/README.md`](packages/vue-table/README.md).

### 3. `@tuquet/lunar`

High-precision astronomical Vietnamese Lunar-Solar calendar engine based on Jean Meeus' algorithms. Zero dependencies, dual ESM/CJS, supporting Sexagenary Cycle (Can Chi), 24 Solar Terms, and recurrence calculations for lunar holidays and memorial events.

```typescript
import { solarToLunar, getSolarTerm, getCanChiYear } from '@tuquet/lunar';

const lunar = solarToLunar({ day: 10, month: 2, year: 2024 });
console.log(lunar); // { day: 1, month: 1, year: 2024, isLeap: false }

const term = getSolarTerm(2024, 2, 4); // "Lap Xuan" (Beginning of Spring)
const canChi = getCanChiYear(2024); // "Giap Thin" (Year of the Dragon)
```

📖 _Detailed Documentation_: See [`packages/lunar/README.md`](packages/lunar/README.md).

### 4. `@tuquet/md-export`

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

## 🤝 Contributing

We welcome community contributions, bug fixes, and new enterprise UI primitives:

- 📖 **Contributor Guidelines**: See [**`CONTRIBUTING.md`**](CONTRIBUTING.md) for local setup, commit conventions, and testing workflows.
- 📦 **Scaffolding New Packages**: Run `pnpm create-pkg` or follow the [**Package Scaffolding Guide in `CONTRIBUTING.md`**](CONTRIBUTING.md#--scaffolding-a-new-package-tuquetnew-lib).

---

## 🚢 Publishing & Release Workflow

We use **Changesets** to automate SemVer releases:

1. When opening a pull request that modifies a package, generate a changeset:
   ```bash
   pnpm changeset
   ```
2. Select the affected packages, choose bump type (`patch`, `minor`, `major`), and provide a description.
3. Commit the generated markdown file under `.changeset/`.
4. When the PR merges into `main`, GitHub Actions (`release.yml`) automatically creates a release PR with updated versions and changelogs.
5. Merging the release PR will publish the updated packages to npm.

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
