# Enterprise Table Stories & Advanced Features Guide

This document provides in-depth guidance for building high-fidelity stories for the **DataTable Enterprise** ecosystem in `@tuquet/vue-table`, utilizing its latest features: API Facade, Saved Views, Mobile Card View, Lifecycle Plugins, and Dynamic Form integration.

---

## 1. Using the Enterprise Table API Facade in Stories

`useRemoteTable` and `DataTable` expose a unified API Facade (`remote.api` or slot/ref `api`), grouping table operations by domain.

### API Facade Structure:

- `api.column`: `pin(colId, 'left'|'right')`, `unpin(colId)`, `toggle(colId)`, `hide(colId)`, `show(colId)`, `resize(colId, size)`, `order(orderArray)`.
- `api.filter`: `set(field, value)`, `get(field)`, `remove(field)`, `reset()`, `setConjunction('and'|'or')`, `addDynamicRule(rule)`.
- `api.selection`: `selectAll()`, `selectNone()`, `toggleAll()`, `toggle(rowId)`, `isSelected(rowId)`, `getSelected()`, `count()`.
- `api.pagination`: `nextPage()`, `previousPage()`, `firstPage()`, `lastPage()`, `setPage(page)`, `setPageSize(size)`.
- `api.export`: `toCsv(options)`, `toExcel(options)`, `copyTsv(options)`.
- `api.expansion`: `expandAll()`, `collapseAll()`, `toggle(rowId)`, `isExpanded(rowId)`.
- `api.views`: `saveView(name, state)`, `applyView(view)`, `deleteView(id)`, `list()`, `active()`.
- `api.scroll`: `scrollToIndex(index, options)`, `scrollToOffset(offset)`.

### Reference Story: Custom Action Bar Controlling Table via Facade

```typescript
export const ApiFacadeDemo: Story = {
  name: 'Enterprise API Facade Controls',
  render: () => ({
    components: { DataTable, Button },
    setup() {
      const remote = useRemoteTable({
        fetcher: mockFetcher,
        columns,
      });

      // Control table through domain facade
      function freezeFirstColumn() {
        remote.api.column.pin('customer', 'left');
      }

      function selectAllCompleted() {
        remote.api.selection.selectNone();
        remote.data.value.forEach((row) => {
          if (row.status === 'completed') {
            remote.api.selection.toggle(row.id);
          }
        });
      }

      function exportFilteredExcel() {
        remote.api.export.toExcel({ filename: 'enterprise-report' });
      }

      return { remote, freezeFirstColumn, selectAllCompleted, exportFilteredExcel };
    },
    template: `
      <div class="space-y-3">
        <div class="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border">
          <Button size="sm" variant="outline" @click="freezeFirstColumn">
            Pin Customer Column
          </Button>
          <Button size="sm" variant="outline" @click="selectAllCompleted">
            Select 'Completed' Orders
          </Button>
          <Button size="sm" variant="default" @click="exportFilteredExcel">
            Export Excel
          </Button>
        </div>
        <DataTable :remote="remote" />
      </div>
    `,
  }),
};
```

---

## 2. Saved Views System

Saved Views persist and restore filters, sorting, column visibility, and pinned columns.

```typescript
export const SavedViewsDemo: Story = {
  name: 'Saved Views & Presets',
  render: () => ({
    components: { DataTable },
    setup() {
      const remote = useRemoteTable({
        fetcher: mockFetcher,
        columns,
        enableSavedViews: true,
      });

      return { remote };
    },
    template: `
      <DataTable
        :remote="remote"
        enable-saved-views
        enable-column-header-menu
        enable-column-resizing
      />
    `,
  }),
};
```

---

## 3. Mobile Viewport & Responsive Card View Testing

To test mobile responsive layouts in Storybook:

1. **Configure Viewport parameters**:

```typescript
export const MobileCardView: Story = {
  name: 'Mobile Card View (<768px)',
  parameters: {
    viewport: {
      defaultViewport: 'iphone14', // Automatically renders in iPhone 14 viewport (393px)
    },
  },
  args: {
    mobileLayout: 'cards',
    adaptivePinning: true,
    showMobileScrollHint: true,
  },
  render: (args) => ({
    components: { DataTable },
    setup() {
      const remote = useRemoteTable({ fetcher: mockFetcher, columns });
      return { args, remote };
    },
    template: `
      <div class="max-w-md mx-auto p-2 bg-background min-h-screen">
        <DataTable :remote="remote" v-bind="args">
          <!-- Optional custom card slot -->
          <template #card="{ row, isSelected, toggleSelected }">
            <div class="p-3 border rounded-xl bg-card space-y-2">
              <div class="flex justify-between items-center">
                <span class="font-bold text-sm">{{ row.original.customer }}</span>
                <input type="checkbox" :checked="isSelected" @change="toggleSelected" />
              </div>
              <p class="text-xs text-muted-foreground">Code: {{ row.original.code }}</p>
            </div>
          </template>
        </DataTable>
      </div>
    `,
  }),
};
```

---

## 4. Attaching System Plugins (`storagePlugin`, `auditLogPlugin`)

```typescript
import { storagePlugin, auditLogPlugin } from '@tuquet/vue-table';

export const PluginsDemo: Story = {
  name: 'Lifecycle Plugins (Storage & Audit)',
  render: () => ({
    components: { DataTable },
    setup() {
      const remote = useRemoteTable({
        fetcher: mockFetcher,
        columns,
        plugins: [
          storagePlugin({ key: 'storybook-demo-table-state' }),
          auditLogPlugin({
            onLog: (entry) => console.log('🔔 [Audit Log]:', entry),
          }),
        ],
      });

      return { remote };
    },
    template: `<DataTable :remote="remote" />`,
  }),
};
```

---

## 5. Integrating OpenAPI Dynamic Form & Row Editing

When combining `@tuquet/vue-ui` (`DynamicForm`, `DynamicRowEditSheet`) with `@tuquet/vue-table`:

- Bind `@row-click` to trigger `DynamicRowEditSheet`.
- JSON schema / OpenAPI specifications automatically generate corresponding input fields.
- On save, invoke `remote.mutateRow(rowId, updatedValues)` to apply immediate optimistic updates to table state.
