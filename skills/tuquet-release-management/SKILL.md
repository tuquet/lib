---
name: tuquet-release-management
description: Release management, semantic versioning, and CI/CD automated deployment workflows using Changesets and GitHub Actions for @tuquet libraries. Activate when creating changesets, preparing releases, bumping versions, or diagnosing publish pipelines.
---

# @tuquet Release Management Guide

End-to-end guidance on managing package versions, generating changelogs, and automating releases using **Changesets** and **GitHub Actions**.

---

## 1. 🔄 The Changeset Workflow

Whenever a code change impacts one or more packages under `packages/*`:

1. **Create a Changeset:**
   Run at repository root:
   ```bash
   pnpm changeset
   ```
2. **Follow Prompts:**
   - Use spacebar to select modified packages.
   - Choose the semver impact:
     - `major`: Breaking API change.
     - `minor`: New backwards-compatible feature.
     - `patch`: Bug fix or internal performance improvement.
   - Enter a human-readable summary of the changes.

3. **Commit the Changeset:**
   Changesets writes a markdown file into `.changeset/<random-name>.md`. Include this file in your pull request.

---

## 2. 🤖 Continuous Integration & Continuous Delivery

### Pull Request Phase (`.github/workflows/ci.yml`)

On every PR to `main`:

1. Installs dependencies via `pnpm install --frozen-lockfile`.
2. Validates formatting (`pnpm format:check`).
3. Runs linter across all packages (`pnpm lint`).
4. Performs strict TypeScript checking (`pnpm typecheck`).
5. Executes full Vitest test suite (`pnpm test`).
6. Builds packages (`pnpm build`).
7. Inspects packaging correctness with `publint` (`pnpm check:exports`).

### Release Phase (`.github/workflows/release.yml`)

When changes are merged into `main`:

1. The Changesets GitHub Action inspects unreleased changesets.
2. If new changesets exist, it automatically opens a pull request titled `chore: version and release packages` that bumps `package.json` versions and updates `CHANGELOG.md`.
3. When the Release PR is merged into `main`, the action builds packages and publishes them to the npm registry with provenance.

---

## 3. ⚙️ Manual Emergency Release Commands

In case an automated CI runner is unavailable:

```bash
# 1. Bump versions and update changelogs
pnpm version-packages

# 2. Build production bundles
pnpm build

# 3. Publish to npm registry (requires NPM_TOKEN)
pnpm release
```
