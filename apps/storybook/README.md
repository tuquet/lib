# @tuquet/storybook

Interactive Storybook application for visualizing, testing, and documenting advanced components in the **@tuquet/vue-table** and **@tuquet/vue-ui** libraries.

🌐 **Production Deployment**: [https://storybook.flowup.io.vn](https://storybook.flowup.io.vn)

## 🎯 Purpose

This Storybook application focuses specifically on **Advanced and Composite Components** across the Tuquet UI ecosystem:

- **DataTable (Enterprise Grid)**:
  - Remote pagination, multi-column sorting, and debounced search.
  - **Virtual Scrolling**: Smooth virtualization for datasets exceeding 5,000–10,000 records.
  - **Column Pinning & Density**: Freezing left/right columns and toggling between Compact, Normal, and Comfortable table densities.
  - **Floating Bulk Actions**: Multi-row selection bar with batch operations.
  - **Multi-format Exports**: Direct downloads for formatted Excel (.xlsx), CSV, and TSV clipboard copying.
- **RemoteCombobox**:
  - Asynchronous infinite scroll and debounced search.
  - Inline entity creation (`onCreate`) and safe deletion (`onDelete`) with inline confirmation.
  - Custom option rendering slots.
- **Specialized Filters**:
  - `DataTableDateRangeFilter`: Popover date range picker with 2-month calendar and quick presets.
  - `DataTableFacetedFilter`: Multi-option faceted filter with record counter badges.
  - `DataTableNumberRangeFilter` & `DataTableTextFilter`.
- **Interactive Cells**:
  - `CopyableCell`: One-click copy with visual tooltip feedback.
  - `DataTableRowActions`: Dynamic row contextual action dropdowns.
- **Composite Vue UI Components**:
  - `RangeCalendar`: 2-month side-by-side date range picker with internationalized dates.
  - `Command`: Spotlight-style command palette (cmdk).

## 🚀 Usage

### Development Server

Run the interactive Storybook on local port `6006`:

```bash
pnpm storybook
# or
pnpm --filter @tuquet/storybook dev
```

### Static Production Build

Build static assets to `apps/storybook/storybook-static`:

```bash
pnpm build:storybook
# or
pnpm --filter @tuquet/storybook build
```

### Preview Built Storybook

Preview the production build locally:

```bash
pnpm preview:storybook
# or
pnpm --filter @tuquet/storybook preview
```

## 📄 License

MIT © Tuquet
