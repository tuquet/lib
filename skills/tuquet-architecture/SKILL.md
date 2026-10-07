---
name: tuquet-architecture
description: Architecture, package layering, pnpm workspace isolation, Turborepo pipeline, and design invariants for the @tuquet Node.js library monorepo. Activate when modifying repo layout, workspace dependencies, build orchestrator configs, or cross-package interactions.
---

# @tuquet Monorepo Architecture Guide

System architecture, workspace management, and design invariants for developing Node.js libraries under the `@tuquet/*` scope.

---

## 1. 🎯 Monorepo Topography

```text
tuquet-lib/
├── packages/           # Publishable public libraries (@tuquet/*)
│   ├── core/           # @tuquet/core (Middleware pipeline, client engine)
│   └── utils/          # @tuquet/utils (Pure helper functions: async, string)
├── tooling/            # Internal developer tooling & shared configurations
│   ├── tsconfig/       # @tuquet/tsconfig (Base & Library compiler options)
│   └── eslint-config/  # @tuquet/eslint-config (ESLint 9 Flat Config)
├── examples/           # Consumer verification applications
│   └── node-demo/      # Integration test app consuming workspace libraries
├── skills/             # Agent instructions & specialized development knowledge
├── .changeset/         # Versioning and release governance
├── .github/workflows/  # Continuous Integration & Delivery automation
├── turbo.json          # Pipeline task orchestration
└── pnpm-workspace.yaml # Workspace root declaration
```

---

## 2. 🛡️ Architectural Invariants

1. **Strict Dependency Direction:**
   - `packages/core` MAY depend on `packages/utils` using `"workspace:*"`.
   - `packages/utils` MUST NOT depend on `packages/core` (avoid circular dependencies).
   - `tooling/*` packages MUST NOT depend on `packages/*`.
   - `examples/*` MAY depend on any `packages/*` to test realistic consumer integration.

2. **Zero Runtime Side-Effects (`sideEffects: false`):**
   - Every library in `packages/*` MUST declare `"sideEffects": false` unless it performs global polyfilling or environment augmentation.
   - Module top-level code MUST NOT execute network calls or mutate global objects.

3. **Dual Packaging Standard (ESM + CommonJS):**
   - Libraries MUST support both modern ESM (`import`) and legacy CommonJS (`require`).
   - Bundling is orchestrated strictly via `tsup`, outputting:
     - `dist/index.mjs` (ESM)
     - `dist/index.cjs` (CJS)
     - `dist/index.d.ts` (ESM types)
     - `dist/index.d.cts` (CJS types)

4. **Task Orchestration with Turborepo:**
   - Builds MUST NOT run unmanaged npm scripts across folders.
   - All tasks (`build`, `test`, `typecheck`, `lint`, `check:exports`) are scheduled via `turbo.json` with dependency graph awareness (`dependsOn: ["^build"]`).

5. **Zero-Undocumented Code & Root Catalog Sync Invariant:**
   - Every library under `packages/*` and runnable app under `apps/*` MUST maintain an up-to-date, comprehensive `README.md` containing installation, quickstart examples, and API specifications.
   - Any new package or application MUST be registered in the central catalog of Root `README.md`.
   - Automated tool `pnpm check:docs` runs in `test` and Git `pre-commit` to prevent committing undocumented code.

---

## 3. 🔄 Workspace Dependency Resolution

When consuming an internal package:

```json
{
  "dependencies": {
    "@tuquet/utils": "workspace:*"
  }
}
```

pnpm symlinks the package during local development. When Changesets publishes the package to npm, it automatically replaces `"workspace:*"` with the concrete semver string (e.g. `"^0.1.0"`).

---

## 4. ⚡ Task Pipelines (`turbo.json`)

- `build`: Generates output in `dist/`. Dependent on dependencies' `^build`.
- `typecheck`: Runs `tsc --noEmit`. Dependent on `^build` for d.ts resolution.
- `test`: Executes unit tests via Vitest.
- `lint`: Static analysis with ESLint.
- `check:exports`: Runs `publint` to verify package.json exports mapping.
