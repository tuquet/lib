# @tuquet/vue-table

Enterprise, remote-driven Data Table system for **Vue 3**, powered by **TanStack Table** and **Shadcn-Vue** ([`@tuquet/vue-ui`](../vue-ui)).

## ✨ Features

- **Headless + UI Complete**: Seamless bridge between headless TanStack Table logic and polished Shadcn-Vue UI components.
- **Server-side Orchestration**: Remote filtering, remote sorting, remote pagination, and debounced search with automatic request cancellation via `AbortController`.
- **Bi-directional URL Sync**: Two-way synchronization between table state (pagination, sorting, filters, search) and browser URL query strings for deep linking and shareable URLs.
- **Pluggable Query Adapters**: Comes out-of-the-box with `StandardRestAdapter` (standard REST `?page=1&limit=20&sort=-createdAt&status=active,pending&q=keyword`) and `LhsBracketsAdapter` (NestJS/Strapi `filter[status][in]=...`), or customize your own in 1 line.
- **Declarative Faceted Filters**: Multi-select category filters with search inside options, badges, and counts built on Radix Popover and Command.
- **Zero-Boilerplate DX**: Connect any backend endpoint to a fully functional table with search, filter, sort, pagination, skeletons, and empty state in under 30 lines of code.

## 📦 Installation

```bash
pnpm add @tuquet/vue-table @tuquet/vue-ui @tanstack/vue-table
```

Ensure global styles are imported in your app entry (`main.ts`):

```ts
import '@tuquet/vue-ui/style.css';
```

## 🚀 Quickstart Example

```vue
<script setup lang="ts">
import { h } from 'vue';
import { DataTable, useRemoteTable, type ColumnDef } from '@tuquet/vue-table';
import { Badge } from '@tuquet/vue-ui';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'suspended';
  createdAt: string;
}

const columns: ColumnDef<User>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Full Name', enableSorting: true },
  { accessorKey: 'email', header: 'Email' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) =>
      h(
        Badge,
        { variant: row.original.status === 'active' ? 'default' : 'secondary' },
        () => row.original.status
      ),
  },
];

const remote = useRemoteTable<User>({
  columns,
  fetcher: async ({ toQueryString }) => {
    const res = await fetch(`/api/users?${toQueryString()}`);
    return res.json(); // returns { data: User[], total: number }
  },
  defaultPageSize: 10,
  syncWithUrl: true,
  filters: [
    {
      id: 'status',
      title: 'Status',
      type: 'faceted',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Suspended', value: 'suspended' },
      ],
    },
  ],
});
</script>

<template>
  <div class="p-6">
    <DataTable :remote="remote" />
  </div>
</template>
```

## 📚 Components Included

| Component                        | Description                                                                                                                                      |
| :------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------- |
| **`<DataTable>`**                | Container component orchestrating toolbar, header, body with loading skeletons, empty state, error retry, and pagination.                        |
| **`<DataTableToolbar>`**         | Search input, dynamic faceted filter triggers, reset button, and custom action slots (`#actions`).                                               |
| **`<DataTableFloatingBar>`**     | Floating bulk action bar animated at bottom with selection count badge, `#actions` slot, and `Clear` (Esc) trigger.                              |
| **`<DataTableRowActions>`**      | Dropdown action menu (3 dots) with custom actions, icons, separators, and destructive variants.                                                  |
| **`<DataTablePagination>`**      | Page navigation (first, prev, next, last), rows per page selector (10/20/50/100), selection summary.                                             |
| **`<DataTableColumnHeader>`**    | Sortable column header button with Asc / Desc / Clear icons and hide column menu.                                                                |
| **`<DataTableFacetedFilter>`**   | Multi-select category popover with command search, item checkboxes, and count badges.                                                            |
| **`<DataTableSelectFilter>`**    | Single-select filter dropdown menu with Radio group, clear button, and custom option icons.                                                      |
| **`<DataTableDateRangeFilter>`** | Date range picker popover with quick presets (Today, Yesterday, Last 7d, Last 30d, etc.) and dual-month `<RangeCalendar>`.                       |
| **`<DataTableFilterBuilder>`**   | Advanced database-grade filter builder (Airtable/Notion/Supabase style) with operator switching, AND/OR conjunctions, inline chips, and presets. |
| **`<DataTableViewOptions>`**     | Dropdown menu to toggle column visibility.                                                                                                       |
| **`<CopyableCell>`**             | Inline cell rendering with click-to-copy button and checkmark confirmation.                                                                      |

## 🔘 Row Selection & Bulk Actions

Easily add row selection with `createSelectionColumn()` and bulk action toolbar:

```ts
import { createSelectionColumn, type ColumnDef } from '@tuquet/vue-table';

const columns: ColumnDef<User>[] = [
  createSelectionColumn<User>({
    isRowSelectable: (row) => row.original.status !== 'suspended', // optional guard
  }),
  { accessorKey: 'name', header: 'Name' },
  // ...
];
```

In your template, pass bulk action buttons into the `#bulk-actions` slot:

```vue
<DataTable :remote="remote">
  <template #bulk-actions="{ selectedRows, selectedCount }">
    <Button variant="destructive" size="sm" @click="handleBulkDelete(selectedRows)">
      Delete ({{ selectedCount }})
    </Button>
  </template>
</DataTable>
```

## 🎨 Pre-built Column Formatters

Build clean, consistent table columns in seconds with typed helpers:

```ts
import {
  createSelectionColumn,
  createDateColumn,
  createBadgeColumn,
  createCurrencyColumn,
  createCopyableColumn,
  createActionsColumn,
  type ColumnDef,
} from '@tuquet/vue-table';

const columns: ColumnDef<Order>[] = [
  createSelectionColumn(),
  createCopyableColumn({ accessorKey: 'orderNumber', header: 'Order #' }),
  createCurrencyColumn({ accessorKey: 'total', header: 'Total', currency: 'USD' }),
  createBadgeColumn({
    accessorKey: 'status',
    header: 'Status',
    variants: {
      completed: 'default',
      pending: 'secondary',
      cancelled: 'destructive',
    },
  }),
  createDateColumn({
    accessorKey: 'createdAt',
    header: 'Ordered At',
    relative: true, // "5m ago", "yesterday", etc.
  }),
  createActionsColumn({
    actions: [
      { id: 'view', label: 'View Details', onSelect: (row) => viewOrder(row.original) },
      {
        id: 'delete',
        label: 'Delete',
        variant: 'destructive',
        separator: true,
        onSelect: (row) => remote.deleteRow(row.original.id),
      },
    ],
  }),
];
```

## 🔄 Optimistic CRUD Local Mutations

Pair `@tuquet/vue-table` with `@tuquet/vue-form` or any modal/sheet for instant UI updates without slow network refetches:

```ts
// Update a record in-place after modal edit
remote.mutateRow(orderId, { status: 'completed' });

// Delete row(s) and automatically decrement total
remote.deleteRow(orderId);
remote.deleteRow([orderId1, orderId2]); // bulk delete

// Prepend newly created item from drawer to top
remote.prependRow(newOrder);

// Force refresh from server when needed
await remote.refetch();
```

## 📤 Multi-format Data Export (CSV, TSV & Excel .xlsx)

Export table data with automatic Excel UTF-8 BOM encoding or native styled Excel spreadsheets (`.xlsx`) via `write-excel-file`:

```ts
import { exportToCsv, exportToExcel, copyToClipboardAsTsv } from '@tuquet/vue-table';

// 1. Download formatted Excel spreadsheet (.xlsx) with header styling and typed columns
await exportToExcel({
  data: remote.data.value,
  columns,
  filename: 'orders-export.xlsx',
  headerStyle: {
    fontWeight: 'bold',
    backgroundColor: '#e2e8f0',
  },
});

// 2. Download CSV with UTF-8 BOM
exportToCsv({
  data: remote.data.value,
  columns,
  filename: 'orders-export.csv',
});

// 3. Or copy selected rows for pasting into Google Sheets / Excel
await copyToClipboardAsTsv({
  data: remote.selectedRows.value,
  columns,
});
```

## ⚡ Virtual Scrolling for Large Datasets

When rendering datasets with thousands of rows without pagination (or with large page sizes), enable high-performance virtualization powered by `@tanstack/vue-virtual`:

```vue
<DataTable
  :remote="remote"
  :virtual="true"
  virtual-height="550px"
  :estimated-row-height="44"
  :overscan="5"
/>
```

Features:

- Dynamically measures rendered rows with dynamic heights.
- Retains sticky headers and column pinning seamlessly during scroll.
- Zero DOM lag even with 10,000+ client-side records.

## 🔌 Query Adapters

### 1. `StandardRestAdapter` (Default)

Generates query string:

```
?page=1&limit=10&sort=-createdAt,name&status=active,pending&q=keyword
```

### 2. `LhsBracketsAdapter`

Generates query string:

```
?page=1&limit=10&sort[createdAt]=desc&filter[status][in]=active,pending&filter[q]=keyword
```

### 3. `SpringPageableAdapter`

For Spring Boot / Spring Data REST endpoints:

```
?page=0&size=20&sort=createdAt,desc&sort=name,asc&q=keyword
```

```ts
import { SpringPageableAdapter, useRemoteTable } from '@tuquet/vue-table';

const remote = useRemoteTable({
  adapter: new SpringPageableAdapter(),
  // ...
});
```

### 4. Custom Adapter with `createCustomAdapter()`

Create custom query adapters in seconds:

```ts
import { createCustomAdapter, useRemoteTable } from '@tuquet/vue-table';

const myAdapter = createCustomAdapter({
  name: 'my-custom',
  serialize: (state) => ({
    offset: state.pagination.pageIndex * state.pagination.pageSize,
    count: state.pagination.pageSize,
  }),
  deserialize: (query) => ({
    pagination: {
      pageIndex: Math.floor(Number(query.offset || 0) / Number(query.count || 10)),
      pageSize: Number(query.count || 10),
    },
  }),
});
```

## 📅 Advanced Date Range Filtering

Filter records within date intervals using `<DataTableDateRangeFilter>`:

```vue
<template>
  <DataTable :remote="remote">
    <template #filters>
      <DataTableDateRangeFilter
        title="Created Date"
        :model-value="remote.filters.value.createdAt"
        @update:model-value="(val) => remote.setFilter('createdAt', val)"
      />
    </template>
  </DataTable>
</template>
```

Features:

- Built-in shortcuts: _Hôm nay, Hôm qua, 7 ngày qua, 30 ngày qua, Tháng này, Tháng trước_.
- Dual-month interactive calendar.
- Automatically serializes to `_start` and `_end` (`StandardRestAdapter`) or `[gte]` and `[lte]` (`LhsBracketsAdapter`).

## 📌 Sticky Column Pinning & Ergonomics

Freeze columns on the left (e.g. selection checkboxes, customer name) or right (e.g. row actions):

```ts
const remote = useRemoteTable({
  columns,
  columnPinning: {
    left: ['select'],
    right: ['actions'],
  },
  // ...
});
```

Sticky pinned columns automatically receive boundary elevation shadows and blurred background isolation during horizontal scrolling.

## 🧠 Flexible Enterprise Database Filter System (Airtable / Notion style)

Build arbitrary compound queries with dynamic column selection, data-type aware operators, and logical conjunctions (`AND` / `OR`):

```vue
<script setup lang="ts">
import { ref } from 'vue';
import {
  DataTable,
  DataTableFilterBuilder,
  useRemoteTable,
  useDynamicFilters,
  type ColumnFilterDefinition,
  type DynamicFilterRule,
} from '@tuquet/vue-table';

const columnDefs: ColumnFilterDefinition[] = [
  { id: 'customer', label: 'Khách hàng', dataType: 'text' },
  { id: 'total', label: 'Tổng tiền ($)', dataType: 'number' },
  {
    id: 'status',
    label: 'Trạng thái',
    dataType: 'select',
    options: [
      { label: 'Hoàn thành', value: 'completed' },
      { label: 'Chờ xử lý', value: 'pending' },
      { label: 'Đã hủy', value: 'cancelled' },
    ],
  },
  { id: 'createdAt', label: 'Ngày tạo', dataType: 'date' },
];

const dynamicRules = ref<DynamicFilterRule[]>([]);
const conjunction = ref<'and' | 'or'>('and');

// Connect to remote or in-memory evaluation
</script>

<template>
  <DataTable
    :remote="remote"
    :show-filter-builder="true"
    :column-filter-defs="columnDefs"
    :dynamic-rules="dynamicRules"
    :conjunction="conjunction"
    @update:dynamic-rules="
      (r) => {
        dynamicRules = r;
        remote.refetch();
      }
    "
    @update:conjunction="
      (c) => {
        conjunction = c;
        remote.refetch();
      }
    "
  />
</template>
```

### Supported Operators by Data Type

| Data Type     | Supported Operators                                                                                                        |
| :------------ | :------------------------------------------------------------------------------------------------------------------------- |
| **`text`**    | `contains` (Chứa), `notContains` (Không chứa), `eq` (=), `ne` (!=), `startsWith`, `endsWith`, `isEmpty`, `isNotEmpty`      |
| **`number`**  | `eq` (=), `ne` (!=), `gt` (>), `gte` (>=), `lt` (<), `lte` (<=), `between` (Trong khoảng min-max), `isEmpty`, `isNotEmpty` |
| **`select`**  | `is` (Là), `isNot` (Không phải), `in` (Thuộc danh sách), `notIn` (Không thuộc), `isEmpty`, `isNotEmpty`                    |
| **`date`**    | `is` (Là ngày), `isNot` (Khác ngày), `before` (Trước), `after` (Sau), `between` (Khoảng ngày), `isEmpty`, `isNotEmpty`     |
| **`boolean`** | `isTrue` (Đúng / Bật), `isFalse` (Sai / Tắt)                                                                               |

### In-Memory Evaluation Engine

Evaluate dynamic filter rules client-side with zero dependencies:

```ts
import { filterDataset, evaluateFilterRule } from '@tuquet/vue-table';

const filteredOrders = filterDataset(allOrders, dynamicRules.value, 'and');
```

## 📄 License

MIT © Tuquet
