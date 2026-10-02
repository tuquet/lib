# Professional Controls & ArgTypes Guide

Storybook Controls allow developers, QA engineers, designers, and product managers to interactively modify component props directly from the UI without touching code.

---

## 1. Standard ArgType Declaration Structure

```typescript
argTypes: {
  propertyName: {
    control: { type: 'control-type' },
    options: ['optionA', 'optionB'], // For select, radio
    description: 'Clear English explanation of prop behavior',
    table: {
      type: { summary: 'data type' },
      defaultValue: { summary: 'default value' },
      category: 'Category Group Name',
    },
  },
}
```

---

## 2. Common Control Types

### 1. Boolean Toggle

```typescript
virtual: {
  control: { type: 'boolean' },
  description: 'Toggle between Virtual Scrolling mode and traditional pagination',
  table: {
    type: { summary: 'boolean' },
    defaultValue: { summary: 'true' },
    category: 'Virtual Scrolling',
  },
},
```

### 2. Inline Radio (Compact Choices)

```typescript
density: {
  control: { type: 'inline-radio' },
  options: ['compact', 'normal', 'comfortable'],
  description: 'Row spacing density across table rows',
  table: {
    type: { summary: "'compact' | 'normal' | 'comfortable'" },
    defaultValue: { summary: "'compact'" },
    category: 'Appearance',
  },
},
```

### 3. Select Dropdown (Multiple Options)

```typescript
datasetSize: {
  control: { type: 'select' },
  options: [1000, 5000, 10000, 25000],
  description: 'Number of mock records generated in memory',
  table: {
    type: { summary: 'number' },
    defaultValue: { summary: '10000' },
    category: 'Data & Performance',
  },
},
```

### 4. Range Slider

```typescript
overscan: {
  control: { type: 'range', min: 0, max: 30, step: 1 },
  description: 'Buffer count of DOM rows rendered outside the active viewport',
  table: {
    type: { summary: 'number' },
    defaultValue: { summary: '5' },
    category: 'Virtual Scrolling',
  },
},
```

### 5. Text Input

```typescript
emptyMessage: {
  control: { type: 'text' },
  description: 'Feedback message rendered when no records match filter query',
  table: {
    type: { summary: 'string' },
    defaultValue: { summary: "'No matching data found.'" },
    category: 'Appearance',
  },
},
```

### 6. Disabling Controls (`control: false`)

For complex object props (such as the `remote` composable instance or custom VNode renderers):

```typescript
remote: { control: false },
```

---

## 3. Organizing Controls with `category`

Group related controls to keep the Storybook Controls panel intuitive:

- `Appearance`: Colors, density, theme, skeletonRows.
- `Virtual Scrolling`: virtual, virtualHeight, overscan.
- `Layout & Features`: showToolbar, showPagination, showFloatingBar.
- `Data & Performance`: datasetSize, debounceMs, cacheTime.
