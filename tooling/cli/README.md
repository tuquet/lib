# @tuquet/cli (Internal Monorepo Developer Tooling)

> Interactive developer suite and package scaffolding wizard for the `@tuquet` monorepo.

Powered by [@clack/prompts](https://github.com/natemoo-re/clack) and [picocolors](https://github.com/alexeyraspopov/picocolors).

---

> [!NOTE]
> **Internal Developer Tooling vs Rust Master CLI (`tuquet`)**:
> This package (`@tuquet/cli` located in `lib/tooling/cli/`) is a **Node.js / TypeScript internal developer wizard and package scaffolding tool**.
> It is **NOT** the compiled native Rust Master CLI (`tuquet/cli` binary `tuquet` distributed via Scoop bucket `tuquet/scoop-bucket`).
>
> | Facet            | `@tuquet/cli` (This Package)            | `tuquet` (Rust Master CLI)                          |
> | :--------------- | :-------------------------------------- | :-------------------------------------------------- |
> | **Location**     | `lib/tooling/cli/`                      | `cli/` (Crate root)                                 |
> | **Runtime**      | Node.js / TypeScript (`tsx`)            | Compiled Native Rust (`clap`, `tokio`, `ratatui`)   |
> | **Scope**        | Monorepo package creation & task wizard | Production supervisor, scoped shell, network bridge |
> | **Distribution** | Private monorepo package                | Official Scoop Bucket (`tuquet/scoop-bucket`)       |

---

## 🚀 Usage

From the root of the `@tuquet/lib` monorepo:

### 1. Launch Master Developer Menu

Launch the full interactive TUI menu to select common tasks (build, typecheck, lint, test, scaffolding, changeset):

```bash
pnpm wizard
```

### 2. Direct Package Scaffolding

Jump directly into the interactive wizard to generate a new package under `packages/@tuquet/<name>`:

```bash
pnpm create-pkg
```

### 3. Local Execution (Inside `tooling/cli`)

```bash
cd tooling/cli
pnpm start   # Runs src/index.ts (Developer Menu)
pnpm create  # Runs src/create-package.ts (Scaffolding Wizard)
```

---

## 🌟 Capabilities

- 🧙 **Interactive Scaffolding**: Create a new `@tuquet/<name>` package with automated:
  - `package.json` with compliant dual ESM/CJS conditional exports (`"import"`, `"require"`).
  - `tsconfig.json` extending `@tuquet/tsconfig/library.json`.
  - `tsup.config.ts` dual bundler configuration with declaration generation (`.d.ts`).
  - Pre-wired `src/index.ts` and `tests/index.test.ts` (Vitest ready).
  - Initial `README.md` following standard `@tuquet` library formatting.
  - Automatic injection of project references into the monorepo root `tsconfig.json`.
  - Automated `pnpm install` and initial build verification check.
- ⚡ **Task Runner & Orchestrator**: Execute builds, Vitest unit tests, TypeScript typechecking, ESLint/Prettier linting, `publint` validation, and `@changesets/cli` workflows directly from an intuitive terminal prompt.
- 🛡️ **Error Prevention**: Validates package names against existing workspace paths, validates npm naming standards, and guarantees clean monorepo dependency graph resolution.
