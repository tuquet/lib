import type { StorybookConfig } from '@storybook/vue3-vite';
import { fileURLToPath } from 'node:url';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../../../packages/vue-table/src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  typescript: {
    check: false,
  },
  async viteFinal(config) {
    const vueUiSrc = fileURLToPath(new URL('../../../packages/vue-ui/src', import.meta.url));
    const vueUiIndex = fileURLToPath(
      new URL('../../../packages/vue-ui/src/index.ts', import.meta.url)
    );
    const vueTableIndex = fileURLToPath(
      new URL('../../../packages/vue-table/src/index.ts', import.meta.url)
    );

    config.server = config.server || {};
    config.server.host = '0.0.0.0';
    config.server.allowedHosts = true;

    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': vueUiSrc,
      '@tuquet/vue-ui': vueUiIndex,
      '@tuquet/vue-table': vueTableIndex,
    };
    config.build = {
      ...config.build,
      sourcemap: false,
      minify: 'esbuild',
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        ...config.build?.rollupOptions,
        output: {
          ...config.build?.rollupOptions?.output,
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('vue') || id.includes('@vue')) return 'vendor-vue';
              if (id.includes('lucide-vue-next')) return 'vendor-icons';
              if (id.includes('@storybook') || id.includes('storybook')) return 'vendor-storybook';
              if (id.includes('radix-vue') || id.includes('reka-ui')) return 'vendor-radix';
              return 'vendor';
            }
          },
        },
      },
    };
    return config;
  },
};

export default config;
