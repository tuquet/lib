# Contributing to @tuquet Libraries

Thank you for your interest in contributing to `@tuquet` libraries!

---

## 🛠 Development Workflow

1. **Clone & Install:**

   ```bash
   git clone https://github.com/tuquet/tuquet-lib.git
   cd tuquet-lib
   pnpm install
   ```

2. **Run Builds & Tests:**

   ```bash
   pnpm build
   pnpm test
   ```

3. **Verify Code Quality & Export Invariants:**
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm format:check
   pnpm check:exports
   pnpm check:docs
   ```

---

## ➕ Scaffolding a New Package (`@tuquet/<new-lib>`)

You can create a new library package automatically using the interactive CLI wizard:

```bash
pnpm create-pkg
```

Or manually configure a new package under `packages/<new-lib>`:

1. **Create directory structure:**

   ```bash
   mkdir -p packages/<new-lib>/src packages/<new-lib>/tests
   ```

2. **Package Configuration (`packages/<new-lib>/package.json`):**

   ```json
   {
     "name": "@tuquet/<new-lib>",
     "version": "0.1.0",
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

3. **TypeScript Configuration (`packages/<new-lib>/tsconfig.json`):**

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

4. **Build Bundler (`packages/<new-lib>/tsup.config.ts`):**

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
     outExtension({ format }) {
       return {
         js: format === 'cjs' ? '.cjs' : '.mjs',
       };
     },
   });
   ```

5. **Install & Verify:**
   ```bash
   pnpm install
   pnpm build
   pnpm test
   ```

---

## 📝 Commit Conventions & Changesets

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation updates
- `refactor:` Code refactoring without behavior change
- `test:` Adding or fixing tests
- `chore:` Tooling and maintenance updates

### Adding a Changeset

Whenever you make a change that affects a publishable package:

```bash
pnpm changeset
```

Follow the interactive prompt to select packages, semver level (`patch`, `minor`, `major`), and provide a clear description.
Commit the generated `.changeset/*.md` file alongside your changes.

---

## 🚀 Creating Pull Requests

1. Create a feature branch from `main`: `git checkout -b feature/my-feature`.
2. Ensure all tests and lint checks pass (`pnpm test`, `pnpm lint`, `pnpm typecheck`).
3. Open a Pull Request targeting `main`.
