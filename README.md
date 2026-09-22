# @tuquet Monorepo

> Production-ready Node.js library monorepo architecture using **pnpm**, **Turborepo**, **tsup**, **Vitest**, **publint**, and **Changesets**.
>
> 🎨 **Live Storybook Showcase**: [https://storybook.flowup.io.vn](https://storybook.flowup.io.vn)

---

## 📂 Repository Structure

```text
tuquet-lib/
├── apps/                     # Runnable applications & consumer products
├── packages/                 # Publishable libraries (@tuquet/*)
│   ├── lunar/                # @tuquet/lunar (Vietnamese astronomical Lunar-Solar calendar)
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

| Package / Directory     | Path                                       | Description                                                                                                                            | Status & Build                             |
| :---------------------- | :----------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------- |
| **`@tuquet/lunar`**     | [`packages/lunar`](packages/lunar)         | Astronomical Vietnamese Lunar-Solar calendar converter, Can Chi, 24 Tiết Khí, and recurrence calculator (Giỗ, Rằm, Mùng 1).            | Zero-dep • Dual ESM/CJS • 17/17 tests      |
| **`@tuquet/vue-ui`**    | [`packages/vue-ui`](packages/vue-ui)       | Official Shadcn-Vue component library with 36+ accessible components powered by Reka UI (Radix Vue), Tailwind CSS, and Sonner Toaster. | Dual ESM/CJS • Types • Style.css • Publint |
| **`@tuquet/vue-table`** | [`packages/vue-table`](packages/vue-table) | Remote-driven Data Table with TanStack, virtual scrolling, multi-format export (CSV, TSV, XLSX), URL sync, and AbortController.        | Dual ESM/CJS • Types • Publint • Vitest    |
| **`apps/`**             | [`apps/`](apps)                            | Root directory for runnable end-user products, bots, and full-stack services.                                                          | Workspace standard                         |

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

### 1. `@tuquet/core`

Core engine and client architecture providing middleware pipeline dispatching, timeouts, and automated retry mechanisms.

```typescript
import { TuquetClient } from '@tuquet/core';

const client = new TuquetClient({ appName: 'My Service' });

client.use(async (ctx, next) => {
  console.log(`Executing ${ctx.action}...`);
  await next();
});

const result = await client.dispatch('user:signup', { email: 'dev@tuquet.io' });
```

### 2. `@tuquet/utils`

Essential, dependency-free utilities for Node.js:

- **String utilities**: `capitalize`, `truncate`, `slugify`, `camelCase`
- **Async utilities**: `sleep`, `retry`, `withTimeout`

```typescript
import { slugify, retry } from '@tuquet/utils';

const slug = slugify('Hello World'); // "hello-world"
const data = await retry(fetchData, { maxRetries: 3 });
```

---

## ➕ How to Add a New Library (`@tuquet/<new-lib>`)

To add a new library package into this monorepo:

1. **Create directory structure:**

   ```bash
   mkdir -p packages/<new-lib>/src packages/<new-lib>/tests
   ```

2. **Create `packages/<new-lib>/package.json`:**

   ```json
   {
     "name": "@tuquet/<new-lib>",
     "version": "0.1.0",
     "description": "Description of @tuquet/<new-lib>",
     "type": "module",
     "main": "./dist/index.cjs",
     "module": "./dist/index.mjs",
     "types": "./dist/index.d.ts",
     "exports": {
       ".": {
         "import": {
           "types": "./dist/index.d.ts",
           "default": "./dist/index.mjs"
         },
         "require": {
           "types": "./dist/index.d.cts",
           "default": "./dist/index.cjs"
         }
       }
     },
     "files": ["dist"],
     "engines": {
       "node": ">=18.0.0"
     },
     "sideEffects": false,
     "publishConfig": {
       "access": "public"
     },
     "scripts": {
       "build": "tsup",
       "dev": "tsup --watch",
       "test": "vitest run",
       "typecheck": "tsc --noEmit",
       "lint": "eslint src/ --max-warnings 0",
       "check:exports": "publint",
       "clean": "rm -rf dist .turbo"
     },
     "devDependencies": {
       "@tuquet/eslint-config": "workspace:*",
       "@tuquet/tsconfig": "workspace:*",
       "publint": "^0.3.7",
       "tsup": "^8.4.0",
       "typescript": "^5.8.2",
       "vitest": "^3.0.8"
     }
   }
   ```

3. **Create `packages/<new-lib>/tsconfig.json`:**

   ```json
   {
     "extends": "@tuquet/tsconfig/library.json",
     "compilerOptions": {
       "rootDir": "./src",
       "outDir": "./dist"
     },
     "include": ["src/**/*"],
     "exclude": ["node_modules", "dist", "tests"]
   }
   ```

4. **Create `packages/<new-lib>/tsup.config.ts`:**

   ```typescript
   import { defineConfig } from 'tsup';

   export default defineConfig({
     entry: ['src/index.ts'],
     format: ['cjs', 'esm'],
     dts: true,
     clean: true,
     sourcemap: true,
     splitting: false,
     treeshake: true,
     minify: false,
     outExtension({ format }) {
       return {
         js: format === 'cjs' ? '.cjs' : '.mjs',
       };
     },
   });
   ```

5. **Install dependencies & build:**
   ```bash
   pnpm install
   pnpm build
   ```

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
