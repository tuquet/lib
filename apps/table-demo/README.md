# @tuquet/table-demo

Interactive showcase and playground application for **@tuquet/vue-table** and **@tuquet/vue-ui**.

## 🎯 Purpose

This demo application showcases real-world integration of enterprise Data Table capabilities:

- **Server-driven Fetching**: Remote pagination, multi-attribute sorting, debounced search, and faceted filtering.
- **Pre-built Column Formatters**: `createSelectionColumn`, `createCopyableColumn`, `createBadgeColumn`, `createCurrencyColumn`, `createDateColumn`, `createActionsColumn`.
- **Bulk Actions & Floating Bar**: Dynamic `<DataTableFloatingBar>` triggered by row selections with `Escape` shortcut listener.
- **Optimistic CRUD Mutations**: Local `prependRow`, `mutateRow`, `deleteRow` for instant feedback without full reloads.
- **Data Export**: UTF-8 BOM CSV download and TSV clipboard copy.

## 🚀 Running the Demo

Start the local Vite dev server:

```bash
pnpm --filter @tuquet/table-demo dev
```

Build for production:

```bash
pnpm --filter @tuquet/table-demo build
```

## 📄 License

MIT © Tuquet
