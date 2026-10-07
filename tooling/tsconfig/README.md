# @tuquet/tsconfig

> Shared TypeScript compiler configurations for the @tuquet monorepo.

---

## 📦 Presets

### `base.json`

Default configuration targeting Node.js runtime environments (`ES2022`, `moduleResolution: NodeNext`, `strict: true`).

```json
{
  "extends": "@tuquet/tsconfig/base.json"
}
```

### `library.json`

Extends `base.json` with settings customized for library authoring (`declaration: true`, `declarationMap: true`, `sourceMap: true`).

```json
{
  "extends": "@tuquet/tsconfig/library.json"
}
```
