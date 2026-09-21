# Component Story Format 3 (CSF3) for Vue 3

CSF3 is the modern, declarative story format for Storybook. In Vue 3, CSF3 enables type-safe stories with full Composition API support.

## 1. Meta Definition

```typescript
import type { Meta, StoryObj } from '@storybook/vue3';
import MyComponent from './MyComponent.vue';

const meta: Meta<typeof MyComponent> = {
  title: 'Components/MyComponent',
  component: MyComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded', // or 'fullscreen', 'centered'
    docs: {
      description: {
        component: 'Detailed description of the component purpose and behavior.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant of the component',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the component is interactable',
    },
  },
  args: {
    size: 'md',
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;
```

## 2. Using Composition API in Stories

When a story needs reactive state, callbacks, or custom template markup, use the `setup()` function:

```typescript
export const WithReactiveState: Story = {
  render: () => ({
    components: { MyComponent },
    setup() {
      const activeItem = ref('item-1');
      function handleSelect(id: string) {
        activeItem.value = id;
      }
      return { activeItem, handleSelect };
    },
    template: `
      <div class="space-y-4">
        <p class="text-xs text-muted-foreground">Selected: {{ activeItem }}</p>
        <MyComponent :selected="activeItem" @update:selected="handleSelect" />
      </div>
    `,
  }),
};
```

## 3. Render Functions (`h`) for TanStack Columns

When rendering custom cell templates in TanStack Table:

```typescript
import { h } from 'vue';

const columns = [
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      return h(
        Badge,
        { variant: row.original.status === 'active' ? 'default' : 'secondary' },
        () => row.original.status
      );
    },
  },
];
```
