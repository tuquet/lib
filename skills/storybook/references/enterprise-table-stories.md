# Hướng dẫn Xây dựng Story cho Enterprise Table & Các Tính năng Nâng cao

Tài liệu này cung cấp hướng dẫn chuyên sâu để xây dựng các stories chất lượng cao cho hệ sinh thái **DataTable Enterprise** trong `@tuquet/vue-table`, tận dụng đầy đủ các tính năng mới nhất: Facade API, Saved Views, Mobile Card View, Plugins và Dynamic Form.

---

## 1. Sử dụng Enterprise Table API Facade trong Stories

`useRemoteTable` và `DataTable` cung cấp đối tượng Facade API hợp nhất (`remote.api` hoặc slot/ref `api`), gom nhóm các thao tác bảng theo từng domain rõ ràng.

### Cấu trúc API Facade:

- `api.column`: `pin(colId, 'left'|'right')`, `unpin(colId)`, `toggle(colId)`, `hide(colId)`, `show(colId)`, `resize(colId, size)`, `order(orderArray)`.
- `api.filter`: `set(field, value)`, `get(field)`, `remove(field)`, `reset()`, `setConjunction('and'|'or')`, `addDynamicRule(rule)`.
- `api.selection`: `selectAll()`, `selectNone()`, `toggleAll()`, `toggle(rowId)`, `isSelected(rowId)`, `getSelected()`, `count()`.
- `api.pagination`: `nextPage()`, `previousPage()`, `firstPage()`, `lastPage()`, `setPage(page)`, `setPageSize(size)`.
- `api.export`: `toCsv(options)`, `toExcel(options)`, `copyTsv(options)`.
- `api.expansion`: `expandAll()`, `collapseAll()`, `toggle(rowId)`, `isExpanded(rowId)`.
- `api.views`: `saveView(name, state)`, `applyView(view)`, `deleteView(id)`, `list()`, `active()`.
- `api.scroll`: `scrollToIndex(index, options)`, `scrollToOffset(offset)`.

### Mẫu Story minh họa Custom Action Bar điều khiển bảng qua API:

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

      // Điều khiển bảng qua API facade chuyên biệt
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
            Ghim cột Khách hàng
          </Button>
          <Button size="sm" variant="outline" @click="selectAllCompleted">
            Chọn đơn 'Completed'
          </Button>
          <Button size="sm" variant="default" @click="exportFilteredExcel">
            Xuất Excel
          </Button>
        </div>
        <DataTable :remote="remote" />
      </div>
    `,
  }),
};
```

---

## 2. Minh họa Chế độ xem đã lưu (Saved Views System)

Saved Views cho phép lưu trữ và khôi phục trạng thái bộ lọc, sắp xếp, ẩn/hiện cột và ghim cột.

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

## 3. Kiểm thử Giao diện Di động & Responsive Card View

Để kiểm thử giao diện di động trong Storybook:

1. **Cấu hình Viewport trong Story parameters**:

```typescript
export const MobileCardView: Story = {
  name: 'Mobile Card View (<768px)',
  parameters: {
    viewport: {
      defaultViewport: 'iphone14', // Tự động mở khung iPhone 14 (393px)
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
          <!-- Tùy biến slot card nếu cần thiết -->
          <template #card="{ row, isSelected, toggleSelected }">
            <div class="p-3 border rounded-xl bg-card space-y-2">
              <div class="flex justify-between items-center">
                <span class="font-bold text-sm">{{ row.original.customer }}</span>
                <input type="checkbox" :checked="isSelected" @change="toggleSelected" />
              </div>
              <p class="text-xs text-muted-foreground">Mã: {{ row.original.code }}</p>
            </div>
          </template>
        </DataTable>
      </div>
    `,
  }),
};
```

---

## 4. Gắn Plugins Hệ thống (`storagePlugin`, `auditLogPlugin`)

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

## 5. Tích hợp OpenAPI Dynamic Form & Row Editing

Khi kết hợp `@tuquet/vue-ui` (`DynamicForm`, `DynamicRowEditSheet`) với `@tuquet/vue-table`:

- Sử dụng `row-click` để mở `DynamicRowEditSheet`.
- Schema JSON / OpenAPI schema tự động sinh trường nhập liệu tương ứng.
- Khi người dùng bấm "Lưu", gọi `remote.mutateRow(rowId, updatedValues)` để cập nhật dữ liệu bảng tức thời (optimistic update).
