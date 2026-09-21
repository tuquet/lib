# Theming and Shadcn Dark/Light Integration in Storybook 8

When integrating Tailwind CSS and Shadcn UI with Storybook 8, the most frequent failure mode is a mismatch between the Manager UI, the Canvas iframe, and Tailwind's `.dark` selector.

## Root Causes of Theme Breakages

1. **Inline Background Injections**:
   The default `@storybook/addon-essentials` includes a backgrounds addon that applies `background: #ffffff !important` to the body. Even when `.dark` is added, text turns white while the background remains white.
   - **Fix**: Set `backgrounds: { disable: true }` in `.storybook/preview.ts`.

2. **React Hooks in `@storybook/addon-themes`**:
   `withThemeByClassName` relies on React runtime lifecycle methods that do not trigger reliably in Vue 3 Storybook environments.
   - **Fix**: Use Storybook's native channel events (`GLOBALS_UPDATED`, `SET_GLOBALS`) in `preview.ts` to toggle `.dark` directly on `document.documentElement` and `document.body`.

3. **Color-scheme Property**:
   Setting `color-scheme: dark` on `html.dark` ensures native scrollbars, inputs, select options, and dropdown popovers render dark instead of blinding white.

4. **Column Pinning & Backdrop Blurs**:
   In Data Tables, pinned columns frequently use `bg-background/95`. If the container canvas is transparent or white, the pinned column displays the dark background while the rest of the table shows white.
   - **Fix**: Apply explicit `min-height: 100vh; background-color: hsl(var(--background)); color: hsl(var(--foreground));` to `html, body, #storybook-root` in `preview-head.html`.
