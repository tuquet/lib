import type { Preview } from '@storybook/vue3';
import { themes } from 'storybook/internal/theming';
import { addons } from 'storybook/internal/preview-api';
import { GLOBALS_UPDATED, SET_GLOBALS } from 'storybook/internal/core-events';
import '../../../packages/vue-ui/src/styles/globals.css';

const urlParams =
  typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
const savedTheme = typeof window !== 'undefined' ? localStorage.getItem('tuquet-theme') : null;
const isInitialDark = urlParams?.get('globals')?.includes('theme:dark') || savedTheme === 'dark';

function applyTheme(theme: string) {
  const isDark = theme === 'dark';
  const root = document.documentElement;
  const body = document.body;
  if (isDark) {
    root.classList.add('dark');
    body.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    body.classList.remove('dark');
    root.style.colorScheme = 'light';
  }
}

if (typeof window !== 'undefined') {
  applyTheme(isInitialDark ? 'dark' : 'light');

  try {
    const channel = addons.getChannel();
    channel.on(GLOBALS_UPDATED, ({ globals }) => {
      if (globals?.theme) {
        applyTheme(globals.theme);
      }
    });
    channel.on(SET_GLOBALS, ({ globals }) => {
      if (globals?.theme) {
        applyTheme(globals.theme);
      }
    });
  } catch (e) {
    console.warn('Channel error in preview.ts:', e);
  }
}

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: [
          'Introduction',
          'Table',
          [
            'DataTable',
            'Realtime SSE Stock Board',
            'Advanced Filter Builder',
            'Column Filters',
            'Row Actions',
            'Copyable Cell',
            'Remote Combobox',
          ],
        ],
      },
    },
    backgrounds: {
      disable: true,
    },
    docs: {
      theme: isInitialDark ? themes.dark : themes.light,
    },
    layout: 'padded',
    viewport: {
      viewports: {
        iphone14: {
          name: 'iPhone 14 Pro (393px)',
          styles: { width: '393px', height: '852px' },
          type: 'mobile',
        },
        iphonese: {
          name: 'iPhone SE (375px)',
          styles: { width: '375px', height: '667px' },
          type: 'mobile',
        },
        pixel7: {
          name: 'Pixel 7 (412px)',
          styles: { width: '412px', height: '915px' },
          type: 'mobile',
        },
        ipad: {
          name: 'iPad Mini (768px)',
          styles: { width: '768px', height: '1024px' },
          type: 'tablet',
        },
        desktop: {
          name: 'Desktop (1280px)',
          styles: { width: '1280px', height: '900px' },
          type: 'desktop',
        },
      },
    },
  },
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Chế độ giao diện (Light / Dark)',
      defaultValue: isInitialDark ? 'dark' : 'light',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        showName: true,
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (story, context) => {
      const theme = context.globals.theme || (isInitialDark ? 'dark' : 'light');
      applyTheme(theme);
      return story();
    },
  ],
};

export default preview;
