import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    vue(),
    dts({
      tsconfigPath: './tsconfig.json',
      rollupTypes: false,
      insertTypesEntry: true,
      copyDtsFiles: false,
      compilerOptions: {
        declarationMap: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: false,
    cssMinify: 'esbuild',
    minify: 'esbuild',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'TuquetVueTable',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.mjs' : 'index.cjs'),
    },
    rollupOptions: {
      external: [
        'vue',
        '@tanstack/vue-table',
        '@tanstack/vue-virtual',
        '@tuquet/vue-ui',
        '@vueuse/core',
        '@internationalized/date',
        'lucide-vue-next',
        'write-excel-file',
      ],
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) return 'style.css';
          return assetInfo.name || 'asset';
        },
      },
    },
  },
});
