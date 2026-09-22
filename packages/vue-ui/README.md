# @tuquet/vue-ui

Enterprise UI component library based on **Shadcn-Vue** and **Reka UI (Radix Vue)**, fully typed and ready for modern Vue 3 applications.

🎨 **Live Interactive Storybook**: [https://storybook.flowup.io.vn](https://storybook.flowup.io.vn)

## ✨ Features

- **35+ Full Components**: Complete set of accessible, high-performance UI components generated via official `shadcn-vue` CLI.
- **WAI-ARIA Compliant**: Powered by Reka UI / Radix Vue primitives with built-in keyboard navigation, focus management, and screen reader accessibility.
- **Customizable with Tailwind CSS**: Styled with Tailwind utility classes and CSS variables supporting dark mode and light mode out-of-the-box.
- **Dual Build ESM & CJS**: Fully compliant with `publint` standards with complete TypeScript declaration files (`.d.ts` and `.d.cts`).

## 📦 Installation

```bash
pnpm add @tuquet/vue-ui
```

Import global styles in your application entry point (`main.ts`):

```ts
import '@tuquet/vue-ui/style.css';
```

## 🚀 Usage Example

```vue
<script setup lang="ts">
import {
  Button,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Input,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@tuquet/vue-ui';
</script>

<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center gap-4">
      <Input placeholder="Search records..." class="max-w-xs" />
      <Button variant="default">Add New</Button>
    </div>

    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>1</TableCell>
          <TableCell>John Doe</TableCell>
          <TableCell>
            <Badge variant="secondary">Active</Badge>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
```

## 📚 Components Included (35 Modules)

- **Actions**: `Button`, `Toggle`, `ToggleGroup`
- **Data Display**: `Table`, `Badge`, `Card`, `Avatar`, `Separator`, `Progress`, `Accordion`, `Tabs`, `Collapsible`, `ScrollArea`, `Calendar`
- **Forms**: `Input`, `Textarea`, `Checkbox`, `Switch`, `Label`, `RadioGroup`, `Select`, `Slider`
- **Overlays & Feedback**: `Dialog`, `AlertDialog`, `Sheet`, `Popover`, `Tooltip`, `DropdownMenu`, `Command`, `Alert`, `Skeleton`, `ContextMenu`, `HoverCard`, `Toaster` (`toast` notification via Sonner)
- **Navigation**: `Pagination`, `Breadcrumb`

### Toast Notification Usage

```vue
<script setup lang="ts">
import { Button, Toaster, toast } from '@tuquet/vue-ui';

function showToast() {
  toast.success('Record saved successfully!');
}
</script>

<template>
  <div>
    <Toaster rich-colors position="top-right" />
    <Button @click="showToast">Save</Button>
  </div>
</template>
```

## 📄 License

MIT © Tuquet
