# @tuquet/storybook

Interactive Storybook application for visualizing, testing, and documenting components in the **@tuquet/vue-ui** library.

🌐 **Production Deployment**: [https://storybook.tuquet.com/](https://storybook.tuquet.com/)

## 🎯 Purpose

This Storybook application showcases foundational and composite components in `@tuquet/vue-ui`:

- **DynamicForm**:
  - Schema-driven form rendering with validation and responsive layouts.
- **RangeCalendar**:
  - 2-month side-by-side date range picker powered by `@internationalized/date` and `reka-ui`.
- **Command**:
  - Spotlight-style command palette (`Cmd+K`) with grouped filtering and keyboard navigation.

## 🚀 Usage

### Development Server

Run the interactive Storybook on local port `6007`:

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
