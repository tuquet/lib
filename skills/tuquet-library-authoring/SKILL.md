---
name: tuquet-library-authoring
description: Standards and blueprints for authoring, building, and testing @tuquet packages. Covers dual ESM/CJS compilation with tsup, strict TypeScript types, publint & attw export invariants, and Vitest test suites. Activate when creating or modifying @tuquet libraries.
---

# @tuquet Library Authoring Guide

Standards, recipes, and checklists for implementing new or modifying existing packages in `@tuquet/*`.

---

## 1. 📋 Blueprint for a New Library Package

When adding `@tuquet/<lib-name>`, follow this exact file structure:

```text
packages/<lib-name>/
├── src/
│   └── index.ts          # Main entrypoint with explicit exports
├── tests/
│   └── index.test.ts     # Vitest test suite
├── package.json          # Package manifest with dual conditional exports
├── tsconfig.json         # TypeScript configuration extending @tuquet/tsconfig/library.json
├── tsup.config.ts        # Bundler configuration
└── README.md             # Package documentation
```

---

## 2. 📦 Manifest Standard (`package.json`)

Ensure conditional exports are strictly defined with separate `types` keys for `import` and `require`:

```json
{
  "name": "@tuquet/<lib-name>",
  "version": "0.1.0",
  "description": "Short description of @tuquet/<lib-name>",
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

---

## 3. ⚙️ Bundler Configuration (`tsup.config.ts`)

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

---

## 4. 🧪 Testing Standards (Vitest)

- Unit tests reside in `packages/<lib-name>/tests/*.test.ts`.
- Tests import from the local source files (`../src/index.js` or `../src/module.js`).
- Fast assertions with Vitest's `describe`, `it`, `expect`.
- For async tests involving timers, use `vi.useFakeTimers()` or realistic async helpers.

---

## 5. 📚 Zero-Undocumented Code Invariant (MANDATORY)

Documentation is treated as a hard gatekeeper. **AI Agents MUST NEVER commit code without comprehensive documentation.**

### 5.1. The Invariant

1. **Zero Undocumented Features:** Adding or modifying any exported function, class, type, or component MUST be accompanied by an update to the package `README.md`.
2. **Monorepo Catalog Sync:** When a new package in `packages/*` or app in `apps/*` is created, it MUST be cataloged in the Root `README.md` in the exact same commit.
3. **Automated Enforcement:** The command `pnpm check:docs` runs automatically during `pnpm test` and inside Git `pre-commit`. Commits missing documentation will fail immediately.

### 5.2. Mandatory Structure of Package `README.md`

Every package `README.md` MUST contain at least these 5 sections:

1. **Title & Value Proposition:** `# @tuquet/<name>` with a concise 1-2 sentence description of its purpose.
2. **Installation:** Clear package manager command (`pnpm add @tuquet/<name>`).
3. **Quickstart / Minimal Working Example:** Complete, runnable TypeScript/Vue snippet inside triple-backtick code blocks.
4. **API / Component Catalog:** Table or list documenting exported APIs, props, return types, options.
5. **License & Standard Compliance:** Dual ESM/CJS exports, TypeScript types, and MIT license.

---

## 6. ✅ Quality Verification Checklist

Before committing changes to any package, verify:

- [ ] `pnpm build` compiles without errors.
- [ ] `pnpm test` passes all test cases.
- [ ] `pnpm typecheck` produces 0 type errors.
- [ ] `pnpm lint` produces 0 warnings (`--max-warnings 0`).
- [ ] `pnpm check:exports` confirms publint reports `All good!`.
- [ ] `pnpm check:docs` confirms documentation invariant passes (`All packages and apps have valid documentation in README.md!`).
- [ ] Root `README.md` is synchronized with the new package/app entry.

---

## 7. 🎨 UI Component Authoring & Shadcn-Vue Sync (`@tuquet/vue-ui`)

All enterprise UI primitives are hosted in `packages/vue-ui` and standardizes on **Reka UI** (`reka-ui`), the official headless foundation powering modern `shadcn-vue`.

### 7.1. Invariants for `@tuquet/vue-ui`

1. **Headless Engine Standard:** Standardize strictly on `reka-ui`. Never re-introduce `radix-vue`.
2. **Strict Externalization (`vite.config.ts`):** All runtime dependencies (`vue`, `reka-ui`, `@internationalized/date`, `@vueuse/core`, `class-variance-authority`, `clsx`, `lucide-vue-next`, `tailwind-merge`, `vue-sonner`) MUST be listed in `rollupOptions.external`. This prevents duplicate context injections across consumers and reduces bundle size from ~680 kB to ~170 kB.
3. **Protected Style Presets (`components.json`):** Component styling and design tokens are bound to `src/styles/globals.css`. Do not allow CLI tools to overwrite base CSS tokens without review.

### 7.2. Standard Component Sync Commands (from Repository Root)

```powershell
# 1. Ensure Windows System CA is loaded if operating behind a corporate proxy/gateway
$env:NODE_OPTIONS = "--use-system-ca"

# 2. Recommended: Fast Sync using local workspace binary (no download, bypasses dlx build restrictions)
pnpm --filter @tuquet/vue-ui exec shadcn-vue add <component-name> -y -o -c packages/vue-ui

# 3. Alternative: Sync using pnpm dlx with explicit build script authorization
pnpm dlx --allow-build=vue-demi shadcn-vue@latest add <component-name> -y -o -c packages/vue-ui
```

#### CLI Flags Breakdown:

- `--allow-build=vue-demi`: Required by `pnpm dlx` (pnpm v9/v10/v12) to permit `vue-demi` postinstall scripts, avoiding `ERR_PNPM_IGNORED_BUILDS`.
- `-c packages/vue-ui`: Sets working directory to `packages/vue-ui` where `components.json` resides.
- `-y` (`--yes`): Bypasses initial interactive confirmation prompts.
- `-o` (`--overwrite`): Automatically updates existing files without pausing on interactive overwrite prompts.
- **Note on `-a` (`--all`):** Upstream `shadcn-vue.com` registry index occasionally lists newly registered components that return HTTP 404 on the CDN. If `-a` fails on missing upstream assets, target the specific component names directly.
