---
name: storybook-vue
description: >-
  Comprehensive guide and toolkit for developing, configuring, testing, and documenting
  Vue 3 components with Storybook 8+ (using Vite, Tailwind CSS, TypeScript, and CSF3).
  Use this skill whenever creating new Storybook stories for Vue 3 components, configuring
  Storybook dev servers and static builds, debugging theme sync (Dark/Light mode) with
  Tailwind/Shadcn CSS variables, benchmarking virtual scrolling with TanStack Virtual,
  or implementing complex composite component stories.
---

# Storybook Vue 3 Expert Skill

This skill provides end-to-end guidance, standard conventions, and runbooks for building, testing, and maintaining interactive Storybook 8+ environments for Vue 3 component libraries.

---

## 1. Quick Reference: Storybook 8 + Vue 3 Architecture

Storybook 8 with Vue 3 uses the `@storybook/vue3-vite` framework and Component Story Format 3 (CSF3).

### Recommended Monorepo Structure

```text
apps/storybook/
├── .storybook/
│   ├── main.ts              # Story globs, framework config, Vite plugins, path aliases
│   ├── preview.ts           # Global decorators, theme toggles, channel listeners
│   ├── preview-head.html    # Base CSS rules, HTML/body styling, docs theme overrides
│   └── manager.ts           # Manager UI theme (sidebar, header) sync
├── package.json             # Dev server & build scripts
└── tailwind.config.ts       # Scanned paths to all package components
```

---

## 2. Standard CSF3 Story Template for Vue 3

Always prefer Component Story Format (CSF3) with `setup()` when reactive state, helpers, or hooks are needed.

```typescript
import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import MyComponent from './MyComponent.vue';

const meta: Meta<typeof MyComponent> = {
  title: 'Category/MyComponent',
  component: MyComponent,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline'],
    },
    disabled: { control: 'boolean' },
  },
  args: {
    variant: 'default',
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 1. Basic Story with Bound Args
export const Default: Story = {
  args: {
    label: 'Click Me',
  },
  render: (args) => ({
    components: { MyComponent },
    setup() {
      return { args };
    },
    template: '<MyComponent v-bind="args" />',
  }),
};

// 2. Interactive Story with Local Reactive State
export const Interactive: Story = {
  render: () => ({
    components: { MyComponent },
    setup() {
      const count = ref(0);
      function increment() {
        count.value++;
      }
      return { count, increment };
    },
    template: `
      <div class="p-4 space-y-2">
        <p class="text-sm text-muted-foreground">Clicked: {{ count }} times</p>
        <MyComponent @click="increment">Increment Counter</MyComponent>
      </div>
    `,
  }),
};
```

---

## 3. Theming & Dark Mode Runbook (Tailwind & Shadcn)

When using Shadcn / Tailwind with CSS variables (`hsl(var(--background))`), adhere to these rules:

1. **Disable Backgrounds Addon**:
   Storybook's built-in backgrounds addon sets inline `style="background: #ffffff !important"`, breaking dark theme. Always disable it in `preview.ts`:

   ```typescript
   parameters: {
     backgrounds: { disable: true },
   }
   ```

2. **Synchronize Dark Class and Color Scheme**:
   In `preview.ts`, listen to channel events (`GLOBALS_UPDATED`, `SET_GLOBALS`) and toggle `.dark` and `colorScheme` on both `document.documentElement` and `document.body`:

   ```typescript
   function applyTheme(theme: string) {
     const isDark = theme === 'dark';
     const root = document.documentElement;
     const body = document.body;
     if (isDark) {
       root.classList.add('dark');
       body.classList.add('dark');
       root.style.colorScheme = 'dark';
     } else {
       root.classList.remove('dark');
       body.classList.remove('dark');
       root.style.colorScheme = 'light';
     }
   }
   ```

3. **Global Toolbar Toggle**:
   Add a native toolbar item in `preview.ts` under `globalTypes`:

   ```typescript
   globalTypes: {
     theme: {
       name: 'Theme',
       description: 'Light / Dark mode',
       defaultValue: 'light',
       toolbar: {
         icon: 'circlehollow',
         items: [
           { value: 'light', title: 'Light', icon: 'sun' },
           { value: 'dark', title: 'Dark', icon: 'moon' },
         ],
         dynamicTitle: true,
       },
     },
   }
   ```

4. **Synchronize Manager UI (Sidebar/Toolbar)**:
   In `.storybook/manager.ts`, listen to `GLOBALS_UPDATED` to switch `themes.dark` / `themes.light`.

---

## 4. Virtual Scrolling Demonstration Patterns

For enterprise data tables and infinite lists using TanStack Virtual (`@tanstack/vue-virtual`):

1. **Expose Virtualizer from Component**:
   In the table/list component (`DataTable.vue`), expose `tableContainerRef`, `rowVirtualizer`, and `scrollToIndex` via `defineExpose`.

2. **Display Live Telemetry HUD**:
   Demonstrate virtualization clearly by showing:
   - **Total Records in RAM**: (e.g., 10,000–50,000 rows).
   - **DOM Nodes rendered**: Show that `tbody > tr` stays constant (~15–25 rows) regardless of total records.
   - **DOM Saving Rate**: Calculated as `((1 - (renderedRows / totalRows)) * 100).toFixed(1) + '%'`.
   - **Active Viewport Index**: Currently visible row range (`#142 → #158`).

3. **Provide Instant Jump Controls**:
   Allow users to jump to Row #1 (0%), Row 25%, Row 50%, Row 75%, and Last Row via `scrollToIndex(target, { align: 'start' })`.

4. **Combine Horizontal Pinning with Vertical Virtualization**:
   Showcase that sticky left/right columns remain frozen horizontally while vertical rows virtualize smoothly.

## 5. Interaction Testing with `play` Functions (@storybook/test)

Interaction testing allows you to verify functional UI behaviors directly inside Storybook. The **Interactions tab** provides a step-by-step visual playback with timeline controls, step labels, and pass/fail assertions.

### Standard Setup & Pattern

1. Install `@storybook/test`:
   ```bash
   pnpm add -D @storybook/test
   ```
2. Import `within`, `userEvent`, and `expect`:
   ```typescript
   import { within, userEvent, expect } from '@storybook/test';
   ```
3. Add the `play` function to your CSF3 story:
   ```typescript
   export const InteractiveDemo: Story = {
     render: (args) => ({ ... }),
     play: async ({ canvasElement, step }) => {
       const canvas = within(canvasElement);

       await step('1. Kiểm tra trạng thái khởi tạo', async () => {
         const trigger = await canvas.findByRole('button');
         expect(trigger).toBeInTheDocument();
       });

       await step('2. Mô phỏng người dùng click / gõ phím', async () => {
         const trigger = canvas.getByRole('button');
         await userEvent.click(trigger);
       });

       await step('3. Xác thực kết quả phản hồi trong DOM', async () => {
         expect(await canvas.findByText('Thành công')).toBeInTheDocument();
       });
     },
   };
   ```

---

## 6. Verification & Testing Commands

Always verify storybook changes using these commands:

- **Start Dev Server**: `pnpm storybook` (default port 6006).
- **Build Static Storybook**: `pnpm build:storybook` (outputs `storybook-static`).
- **Preview Static Build**: `pnpm preview:storybook`.
- **Monorepo Invariant Checks**:
  - `pnpm typecheck` (type checking across packages)
  - `pnpm lint` (ESLint verification)
  - `pnpm test` (Unit tests and doc integrity checks)
