import { defineConfig } from 'tsup';

export default defineConfig([
  // 1. Library bundle (CJS + ESM + DTS)
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    sourcemap: true,
    splitting: false,
    treeshake: true,
    minify: false,
    outExtension({ format }) {
      return {
        js: format === 'cjs' ? '.cjs' : '.mjs',
      };
    },
  },
  // 2. Browser Standalone Bundle (IIFE / global window.TuquetCrawler)
  {
    entry: { 'tuquet-crawler.global': 'src/index.ts' },
    format: ['iife'],
    globalName: 'TuquetCrawler',
    dts: false,
    clean: false,
    sourcemap: false,
    minify: true,
    footer: {
      js: 'if(typeof globalThis!=="undefined"){globalThis.TuquetCrawler=TuquetCrawler;}if(typeof window!=="undefined"){window.TuquetCrawler=TuquetCrawler;try{TuquetCrawler.applyStealthInPage();}catch(e){}}',
    },
  },
]);
