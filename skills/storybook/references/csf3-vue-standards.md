# CSF3 (Component Story Format v3) Standards for Vue 3 & TypeScript

This document establishes the standard structure and engineering conventions for writing Vue 3 Storybook stories in the `@tuquet` monorepo.

---

## 1. Baseline Story File Structure

```typescript
import type { Meta, StoryObj } from '@storybook/vue3';
import { ref, watch } from 'vue';
import MyComponent from './MyComponent.vue';

const meta: Meta<typeof MyComponent> = {
  title: 'Category/MyComponent',
  component: MyComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Concise summary of component purpose and operational API.',
      },
    },
  },
  argTypes: {
    // Declare controls here
  },
  args: {
    // Default initial values
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Default',
  args: {},
  render: (args) => ({
    components: { MyComponent },
    setup() {
      // Reactivity logic, computed, watchers
      return { args };
    },
    template: `<MyComponent v-bind="args" />`,
  }),
};
```

---

## 2. Reactivity & Args Synchronization Rules

When users manipulate values in Storybook's **Controls** panel, the `args` object passed to `render` updates reactively:

### Pattern 1: Direct `v-bind="args"`

When component props map 1:1 with `args`:

```typescript
template: `<MyComponent v-bind="args" />`;
```

### Pattern 2: `watch` for Controlled Internal State

When the story encapsulates state dependent on `args` (e.g. `density`, `datasetSize`):

```typescript
setup() {
  const density = ref(args.density || 'compact');

  // React to args mutations from Controls panel
  watch(
    () => args.density,
    (newVal) => {
      if (newVal) density.value = newVal;
    }
  );

  return { args, density };
}
```

---

## 3. Composite Stories & Component Integration

For composite components integrating multiple sub-components (such as `DataTable` combining `Button`, `DropdownMenu`, and `EditableCell`):

1. **Explicitly register child components in `components`**:
   ```typescript
   components: {
     DataTable,
     EditableCell,
     Button,
     DropdownMenu,
     DropdownMenuTrigger,
     DropdownMenuContent,
     DropdownMenuItem,
     Sparkles,
     Pencil,
   }
   ```
2. **Strict Type Safety in `setup()`**:
   - Initialize mock datasets using external generator helpers (e.g. `generateEnterpriseOrders(count)`).
   - Avoid embedding complex TypeScript expressions or type assertions inside HTML template strings.
