import path from 'node:path';
import { cac } from 'cac';
import { compileWorkspace } from './index.js';
import type { ExportFormat } from './types/index.js';

const cli = cac('tuquet-md-export');

cli
  .command('[dir]', 'Compile Markdown files to PDF, HTML, PNG, and JPEG across directory tree')
  .option('-d, --dir <dir>', 'Root directory to compile (default: current working directory)')
  .option('-f, --format <formats>', 'Export formats (comma separated: pdf,html,png,jpeg or all)', {
    default: 'pdf,html',
  })
  .option('-q, --quality <number>', 'JPEG image quality (0-100)', {
    default: 90,
  })
  .option('-p, --pattern <pattern>', 'Glob pattern for markdown files', {
    default: '**/README.md',
  })
  .option('-s, --styles <styles>', 'Comma-separated CSS paths or URLs to inject')
  .option('-c, --chrome <path>', 'Custom Chromium/Chrome/Edge binary path')
  .option('-o, --output-dir <dir>', 'Custom output root directory')
  .option('--no-redirect', 'Disable auto-redirect script in exported README.html')
  .option('--silent', 'Suppress console logs')
  .action(
    async (
      dirInput: string | undefined,
      flags: {
        dir?: string;
        format: string;
        quality?: number;
        pattern: string;
        styles?: string;
        chrome?: string;
        outputDir?: string;
        redirect?: boolean;
        silent?: boolean;
      }
    ) => {
      const rootDir = path.resolve(dirInput || flags.dir || process.cwd());
      let formats: ExportFormat[];
      if (flags.format.trim().toLowerCase() === 'all') {
        formats = ['pdf', 'html', 'png', 'jpeg'];
      } else {
        formats = flags.format.split(',').map((f) => f.trim().toLowerCase()) as ExportFormat[];
      }
      const styles = flags.styles ? flags.styles.split(',').map((s) => s.trim()) : undefined;

      if (!flags.silent) {
        console.log(`\n======================================================`);
        console.log(`  Tuquet Markdown Multi-Format Exporter (@tuquet/md-export)`);
        console.log(`======================================================`);
        console.log(`  Root:     ${rootDir}`);
        console.log(`  Pattern:  ${flags.pattern}`);
        console.log(`  Formats:  ${formats.join(', ')}`);
        if (styles) console.log(`  Styles:   ${styles.join(', ')}`);
        console.log(`------------------------------------------------------\n`);
      }

      try {
        const { results, totalDurationMs } = await compileWorkspace({
          rootDir,
          pattern: flags.pattern,
          format: formats,
          styles,
          imageQuality: flags.quality ? Number(flags.quality) : 90,
          executablePath: flags.chrome,
          outputDir: flags.outputDir,
          autoRedirectHtml: flags.redirect !== false,
          silent: flags.silent,
        });

        if (!flags.silent) {
          console.log(
            `\n[SUCCESS] Compiled ${results.length} markdown file(s) in ${totalDurationMs}ms.\n`
          );
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`\n[ERROR] Compilation failed:\n${message}\n`);
        process.exit(1);
      }
    }
  );

cli.help();
cli.version('0.1.0');

cli.parse();
