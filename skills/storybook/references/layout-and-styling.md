# Layout, Column Pinning, Density & Styling Guide

This document synthesizes verified solutions for enterprise table layout management, preventing layout shifts across density changes, sticky column freezing/pinning, and synchronized hover states.

---

## 1. Preventing Layout Breakage & Column Overlap on Density Shifts

### Root Cause:

When `<table>` relies on `table-layout: auto`, horizontal cell padding changes (such as `px-4`) occurring when density shifts from `compact` to `comfortable` expand pinned cells (such as the 40px Checkbox) to ~65px. However, TanStack Table pins the adjacent column (Index/STT) at fixed coordinates (`left: 40px`), causing the adjacent column to overlap the Checkbox column by 25px.

### Comprehensive Solution:

1. **Enforce `table-layout: fixed`**:
   ```html
   <table
     class="w-full caption-bottom text-sm table-fixed border-collapse"
     :style="{ minWidth: `${totalTableWidth}px` }"
   ></table>
   ```
2. **Apply `width`, `minWidth`, and `maxWidth` simultaneously in `getColumnStyle`**:
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
3. **Isolate dedicated padding for icon/checkbox columns**:
   ```typescript
   function getCellDensityClass(columnId: string) {
     if (columnId === 'select' || columnId === 'actions') {
       return `${getVerticalPaddingClass()} px-0 text-center`;
     }
     return `${getVerticalPaddingClass()} px-3`;
   }
   ```
4. **Automatically remeasure virtual rows on density changes**:
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

## 2. Synchronizing Hover & Selection Backgrounds on Pinned Cells

### Problem:

Pinned cells must carry an opaque `bg-background` to prevent horizontally scrolled text from bleeding through. When hovering over a row, the `hover:bg-muted/50` style on the parent `<tr>` is masked by the opaque `<td>` background, producing an inconsistent row appearance (row center is highlighted while pinned left/right columns remain stark white).

### Solution:

1. Add the `group` class to `<tr>` in `TableRow.vue`:
   ```html
   <tr
     :class="cn('group border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted', props.class)"
   ></tr>
   ```
2. Add `group-hover:bg-muted/50` and `group-data-[state=selected]:bg-muted` to pinned cells:
   ```html
   :class="[ cell.column.getIsPinned() ? 'sticky bg-background group-hover:bg-muted/50
   group-data-[state=selected]:bg-muted transition-colors' : 'transition-colors' ]"
   ```
   Hovering anywhere over the row immediately updates the background color across both scrollable and pinned cells uniformly.

---

## 3. Standardized Z-Index Tiering

Prevents scrolling body cells from clipping above sticky headers or floating toolbars:

- `z-10`: Standard table rows
- `z-20`: Sticky pinned cells in table body (`tbody td.sticky`)
- `z-30`: Sticky pinned cells in header (`thead th.sticky`)
- `z-40`: Pinned table toolbar
- `z-50`: Bulk actions floating toolbar (`fixed/absolute bottom-6`)
- `z-100`: Dropdown menus, Modals, Tooltips, and Popovers
