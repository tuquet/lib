# Common Pitfalls & Prevention Guide

This document catalogs the most frequent runtime issues when developing Vue 3 stories in Storybook, along with their solutions.

---

## 1. ❌ Syntax Error: `Unexpected identifier 'as'`

### Error Symptom:

Storybook displays a runtime red error box:

```text
Unexpected identifier 'as'
The component failed to render properly, likely due to a configuration issue in Storybook.
```

### Root Cause:

The Vue 3 runtime template compiler in Storybook executes as pure JavaScript and does **NOT** support TypeScript syntax.
Using the `as` type assertion keyword inside an inline HTML template string crashes the compiler:

```html
<!-- ❌ WRONG: Causes Storybook to crash -->
<button @click="setDensity(d as TableDensity)">{{ d }}</button>
<div v-for="(item, idx) in (data as MyType[])">...</div>
```

### Remediation:

**NEVER** use the `as` keyword inside template strings. All type casting and validation must take place inside `setup()` functions:

```typescript
// ✅ CORRECT: Handle type assertion in setup()
setup() {
  function setDensity(d: string) {
    density.value = d as TableDensity;
  }
  return { setDensity };
}
```

In the template, call the typed handler function:

```html
<button @click="setDensity(d)">{{ d }}</button>
```

---

## 2. ❌ Syntax Error: `missing ) after argument list`

### Root Cause:

Passing unclosed inline closures, unescaped regex patterns, or deeply nested objects directly inside template strings.

### Remediation:

Move complex expressions into `computed` properties or helper methods inside `setup()`. Keep HTML templates concise, containing only component tags and direct bindings.

---

## 3. ❌ Header Checkbox Desynchronization

### Root Cause:

Wrapping the `Checkbox` component in an extra outer `<div>` within the column render function:

```typescript
// ❌ WRONG: Obstructs event propagation and complicates interaction testing
cell: ({ row }) => h('div', { class: 'text-center' }, [h(Checkbox, ...)])
```

### Remediation:

Return the `Checkbox` VNode directly from the render function, using Tailwind utility classes for alignment:

```typescript
// ✅ CORRECT: Checkbox is the root VNode; props and events bind cleanly
cell: ({ row }) =>
  h(Checkbox, {
    checked: row.getIsSelected(),
    'onUpdate:checked': (val: boolean) => row.toggleSelected(!!val),
    class: 'translate-y-[2px] mx-auto block',
  });
```

---

## 4. ❌ Column Overlap upon Density Change

### Root Cause:

Using `table-layout: auto` causes the browser to dynamically recalculate column widths when padding changes, conflicting with TanStack Table's fixed pixel pinning coordinates.

### Remediation:

- See: [Layout & Styling Reference](./layout-and-styling.md).
- Always apply `table-fixed` and assign `width`, `minWidth`, and `maxWidth` concurrently via `getColumnStyle()`.
