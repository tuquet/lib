# Hướng dẫn Xử lý Layout, Column Pinning, Density & Styling

Tài liệu này tổng hợp các giải pháp chuyên sâu đã được kiểm chứng để xử lý bố cục bảng doanh nghiệp, chống vỡ layout khi đổi density, ghim cột (freeze/pin) và đồng bộ hiệu ứng hover.

---

## 1. Cơ chế Chống Vỡ Layout & Đè Cột khi Đổi Density

### Nguyên nhân gây lỗi:

Khi thẻ `<table>` dùng `table-layout: auto`, padding ngang (như `px-4`) khi đổi density từ `compact` sang `normal`/`comfortable` sẽ làm ô ghim (như Checkbox 40px) phình to thành ~65px. Tuy nhiên, TanStack Table lại ghim cột kế tiếp (STT) ở tọa độ cố định `left: 40px`, dẫn đến cột STT nằm đè 25px lên cột Checkbox!

### Giải pháp xử lý triệt để:

1. **Bắt buộc dùng `table-layout: fixed`**:
   ```html
   <table
     class="w-full caption-bottom text-sm table-fixed border-collapse"
     :style="{ minWidth: `${totalTableWidth}px` }"
   ></table>
   ```
2. **Hàm `getColumnStyle` áp dụng đồng thời `width`, `minWidth`, `maxWidth`**:
   ```typescript
   function getColumnStyle(column: Column<any, any>, isHeader = false) {
     const isPinned = column.getIsPinned();
     const size = column.getSize();
     const style: Record<string, string | number> = {
       width: `${size}px`,
       minWidth: `${size}px`,
       maxWidth: `${size}px`,
     };
     if (isPinned) {
       style.position = 'sticky';
       style.zIndex = isHeader ? 30 : 20;
       if (isPinned === 'left') style.left = `${column.getStart('left')}px`;
       if (isPinned === 'right') style.right = `${column.getAfter('right')}px`;
     }
     return style;
   }
   ```
3. **Cố định padding riêng cho ô ghim icon/checkbox**:
   ```typescript
   function getCellDensityClass(columnId: string) {
     if (columnId === 'select' || columnId === 'actions') {
       return `${getVerticalPaddingClass()} px-0 text-center`;
     }
     return `${getVerticalPaddingClass()} px-3`;
   }
   ```
4. **Tự động remeasure hàng ảo khi đổi density**:
   ```typescript
   watch(
     () => props.density,
     () => {
       nextTick(() => {
         rowVirtualizer.value?.measure();
       });
     }
   );
   ```

---

## 2. Đồng bộ Màu Nền Hover & Selection trên Ô Ghim Cố định

### Vấn đề:

Các ô ghim mang nền đục `bg-background` (để chữ cuộn ngang không bị lộ xuyên qua). Khi rê chuột vào hàng, hiệu ứng `hover:bg-muted/50` của thẻ `<tr>` bị màu nền đục của `<td>` che mất, khiến hàng bị loang lổ (chỉ sáng ở giữa, 2 bên ghim vẫn trắng bóc).

### Giải pháp:

1. Thêm class `group` vào `<tr>` trong `TableRow.vue`:
   ```html
   <tr
     :class="cn('group border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted', props.class)"
   ></tr>
   ```
2. Thêm class `group-hover:bg-muted/50` và `group-data-[state=selected]:bg-muted` vào các ô ghim:
   ```html
   :class="[ cell.column.getIsPinned() ? 'sticky bg-background group-hover:bg-muted/50
   group-data-[state=selected]:bg-muted transition-colors' : 'transition-colors' ]"
   ```
   Khi rê chuột vào bất kỳ đâu trên hàng, cả hàng và các ô ghim lập tức đổi sang cùng một dải màu nền thống nhất!

---

## 3. Phân Tầng Z-Index Chuẩn

Tránh hiện tượng ô cuộn đè lên header hoặc floating bar:

- `z-10`: Hàng thường
- `z-20`: Ô ghim sticky ở phần thân bảng (`tbody td.sticky`)
- `z-30`: Ô ghim sticky ở phần tiêu đề (`thead th.sticky`)
- `z-40`: Thanh Toolbar cố định
- `z-50`: Thanh Bulk Actions Floating Bar (`fixed/absolute bottom-6`)
- `z-100`: Dropdown Menu, Modal, Tooltip, Popover
