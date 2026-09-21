import { addons } from 'storybook/internal/manager-api';
import { themes } from 'storybook/internal/theming';
import { GLOBALS_UPDATED } from 'storybook/internal/core-events';

const urlParams = new URLSearchParams(window.location.search);
const savedTheme = typeof window !== 'undefined' ? localStorage.getItem('tuquet-theme') : null;
const isInitialDark = urlParams.get('globals')?.includes('theme:dark') || savedTheme === 'dark';

addons.setConfig({
  theme: isInitialDark ? themes.dark : themes.light,
});

const channel = addons.getChannel();

channel.on(GLOBALS_UPDATED, ({ globals }) => {
  if (globals && globals.theme) {
    const isDark = globals.theme === 'dark';
    try {
      localStorage.setItem('tuquet-theme', globals.theme);
    } catch {
      // Ignore localStorage access errors (e.g. private browsing / sandboxed iframe)
    }
    addons.setConfig({
      theme: isDark ? themes.dark : themes.light,
    });
  }
});
