import {
  intro,
  outro,
  text,
  select,
  multiselect,
  confirm,
  spinner,
  isCancel,
  cancel,
} from '@clack/prompts';
import pc from 'picocolors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../');

export async function runCreatePackage(): Promise<void> {
  console.log();
  intro(pc.bgCyan(pc.black(' @tuquet Library Package Wizard ')));

  const rawName = await text({
    message: 'What is the package name?',
    placeholder: 'e.g. logger, crypto, cache',
    validate(val) {
      if (!val || val.trim().length === 0) return 'Package name is required';
      const clean = val.replace(/^@tuquet\//, '').trim();
      if (!/^[a-z0-9-]+$/.test(clean)) {
        return 'Package name must contain only lowercase letters, numbers, and hyphens';
      }
      const pkgPath = path.join(rootDir, 'packages', clean);
      if (fs.existsSync(pkgPath)) {
        return `Package "${clean}" already exists in packages/${clean}`;
      }
      return undefined;
    },
  });

  if (isCancel(rawName)) {
    cancel('Operation cancelled.');
    process.exit(0);
  }

  const pkgName = (rawName as string).replace(/^@tuquet\//, '').trim();
  const fullPkgName = `@tuquet/${pkgName}`;

  const description = await text({
    message: 'Package description:',
    placeholder: `A high-performance library for ${pkgName}`,
    initialValue: `A high-performance library for ${pkgName}`,
  });

  if (isCancel(description)) {
    cancel('Operation cancelled.');
    process.exit(0);
  }

  const pkgType = await select({
    message: 'Select package template type:',
    options: [
      {
        value: 'utility',
        label: 'Utility Library',
        hint: 'Pure functions, zero external dependencies, ultra-lightweight',
      },
      {
        value: 'service',
        label: 'Client / Service Library',
        hint: 'Middleware pipeline architecture, integrates with @tuquet/core',
      },
    ],
  });

  if (isCancel(pkgType)) {
    cancel('Operation cancelled.');
    process.exit(0);
  }

  const defaultDeps: string[] = [];
  if (pkgType === 'service') {
    defaultDeps.push('@tuquet/core', '@tuquet/utils');
  }

  const workspaceDeps = await multiselect({
    message: 'Select internal workspace dependencies to include:',
    options: [
      { value: '@tuquet/utils', label: '@tuquet/utils (Common async & string helpers)' },
      { value: '@tuquet/core', label: '@tuquet/core (Core client & middleware engine)' },
    ],
    initialValues: defaultDeps,
    required: false,
  });

  if (isCancel(workspaceDeps)) {
    cancel('Operation cancelled.');
    process.exit(0);
  }

  const shouldProceed = await confirm({
    message: `Ready to scaffold ${pc.cyan(fullPkgName)} in packages/${pkgName}?`,
    initialValue: true,
  });

  if (isCancel(shouldProceed) || !shouldProceed) {
    cancel('Package creation cancelled.');
    process.exit(0);
  }

  const s = spinner();
  s.start(`Scaffolding package ${fullPkgName}...`);

  const targetDir = path.join(rootDir, 'packages', pkgName);
  const srcDir = path.join(targetDir, 'src');
  const testsDir = path.join(targetDir, 'tests');

  fs.mkdirSync(srcDir, { recursive: true });
  fs.mkdirSync(testsDir, { recursive: true });

  // 1. Build dependencies record
  const dependenciesRecord: Record<string, string> = {};
  for (const dep of workspaceDeps as string[]) {
    dependenciesRecord[dep] = 'workspace:*';
  }

  // 2. package.json
  const packageJson = {
    name: fullPkgName,
    version: '0.1.0',
    description: description as string,
    type: 'module',
    main: './dist/index.cjs',
    module: './dist/index.mjs',
    types: './dist/index.d.ts',
    exports: {
      '.': {
        import: {
          types: './dist/index.d.ts',
          default: './dist/index.mjs',
        },
        require: {
          types: './dist/index.d.cts',
          default: './dist/index.cjs',
        },
      },
    },
    files: ['dist'],
    engines: {
      node: '>=18.0.0',
    },
    sideEffects: false,
    license: 'MIT',
    author: 'Tuquet <dev@tuquet.io>',
    homepage: `https://github.com/tuquet/lib/tree/main/packages/${pkgName}#readme`,
    repository: {
      type: 'git',
      url: 'git+https://github.com/tuquet/lib.git',
      directory: `packages/${pkgName}`,
    },
    bugs: {
      url: 'https://github.com/tuquet/lib/issues',
    },
    keywords: ['tuquet', pkgName, 'nodejs', 'library'],
    publishConfig: {
      access: 'public',
    },
    scripts: {
      build: 'tsup',
      dev: 'tsup --watch',
      test: 'vitest run',
      typecheck: 'tsc --noEmit',
      lint: 'eslint src/ --max-warnings 0',
      'check:exports': 'publint',
      clean: 'rm -rf dist .turbo',
    },
    ...(Object.keys(dependenciesRecord).length > 0 ? { dependencies: dependenciesRecord } : {}),
    devDependencies: {
      '@tuquet/eslint-config': 'workspace:*',
      '@tuquet/tsconfig': 'workspace:*',
      publint: '^0.3.7',
      tsup: '^8.4.0',
      typescript: '^5.8.2',
      vitest: '^3.0.8',
    },
  };

  fs.writeFileSync(
    path.join(targetDir, 'package.json'),
    JSON.stringify(packageJson, null, 2) + '\n'
  );

  // 3. tsconfig.json
  const tsconfigJson = {
    extends: '@tuquet/tsconfig/library.json',
    compilerOptions: {
      noEmit: true,
    },
    include: ['src/**/*', 'tests/**/*'],
    exclude: ['node_modules', 'dist'],
  };
  fs.writeFileSync(
    path.join(targetDir, 'tsconfig.json'),
    JSON.stringify(tsconfigJson, null, 2) + '\n'
  );

  // 4. tsup.config.ts
  const tsupConfig = `import { defineConfig } from 'tsup';

export default defineConfig({
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
});
`;
  fs.writeFileSync(path.join(targetDir, 'tsup.config.ts'), tsupConfig);

  // 5. Source file
  const pascalName = pkgName
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');

  let indexSource = '';
  if (pkgType === 'service') {
    indexSource = `export interface ${pascalName}Config {
  name: string;
  enabled?: boolean;
}

export class ${pascalName}Service {
  readonly config: Required<${pascalName}Config>;

  constructor(config: ${pascalName}Config) {
    this.config = {
      name: config.name,
      enabled: config.enabled ?? true,
    };
  }

  getStatus(): string {
    return \`Service \${this.config.name} is \${this.config.enabled ? 'active' : 'inactive'}\`;
  }
}
`;
  } else {
    indexSource = `/**
 * Core utility function for ${pkgName}.
 */
export function create${pascalName}Entry(input: string): { id: string; timestamp: number } {
  return {
    id: \`${pkgName}:\${input}\`,
    timestamp: Date.now(),
  };
}
`;
  }
  fs.writeFileSync(path.join(srcDir, 'index.ts'), indexSource);

  // 6. Test file
  let testSource = '';
  if (pkgType === 'service') {
    testSource = `import { describe, it, expect } from 'vitest';
import { ${pascalName}Service } from '../src/index.js';

describe('${pascalName}Service', () => {
  it('initializes and reports status', () => {
    const service = new ${pascalName}Service({ name: 'Alpha' });
    expect(service.getStatus()).toBe('Service Alpha is active');
  });
});
`;
  } else {
    testSource = `import { describe, it, expect } from 'vitest';
import { create${pascalName}Entry } from '../src/index.js';

describe('${fullPkgName}', () => {
  it('creates an entry correctly', () => {
    const entry = create${pascalName}Entry('sample');
    expect(entry.id).toBe('${pkgName}:sample');
    expect(typeof entry.timestamp).toBe('number');
  });
});
`;
  }
  fs.writeFileSync(path.join(testsDir, 'index.test.ts'), testSource);

  // 7. README.md
  const readmeContent = `# ${fullPkgName}

> ${description}

[![npm version](https://img.shields.io/npm/v/${fullPkgName}.svg)](https://www.npmjs.com/package/${fullPkgName})
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📦 Installation

\`\`\`bash
pnpm add ${fullPkgName}
\`\`\`

---

## 🚀 Quick Start

\`\`\`typescript
import { ${pkgType === 'service' ? `${pascalName}Service` : `create${pascalName}Entry`} } from '${fullPkgName}';

// Example usage
\`\`\`

---

## 📄 License

MIT © [Tuquet](https://github.com/tuquet)
`;
  fs.writeFileSync(path.join(targetDir, 'README.md'), readmeContent);

  // 8. Update root tsconfig.json references
  const rootTsconfigPath = path.join(rootDir, 'tsconfig.json');
  if (fs.existsSync(rootTsconfigPath)) {
    const rootTsconfig = JSON.parse(fs.readFileSync(rootTsconfigPath, 'utf8'));
    const newRef = { path: `./packages/${pkgName}` };
    if (!rootTsconfig.references.some((ref: { path: string }) => ref.path === newRef.path)) {
      rootTsconfig.references.push(newRef);
      fs.writeFileSync(rootTsconfigPath, JSON.stringify(rootTsconfig, null, 2) + '\n');
    }
  }

  s.message('Linking dependencies via pnpm install...');
  execSync('pnpm install', { cwd: rootDir, stdio: 'ignore' });

  s.message('Validating package compilation with tsup...');
  execSync(`pnpm --filter ${fullPkgName} build`, { cwd: rootDir, stdio: 'ignore' });

  s.stop(pc.green(`✓ Successfully scaffolded and built ${pc.bold(fullPkgName)}!`));

  outro(
    pc.bold(
      `Package created in: ${pc.cyan(`packages/${pkgName}`)}\n\n` +
        `  ${pc.gray('$')} ${pc.cyan(`pnpm --filter ${fullPkgName} test`)}   # Run unit tests\n` +
        `  ${pc.gray('$')} ${pc.cyan(`pnpm --filter ${fullPkgName} dev`)}    # Watch mode\n` +
        `  ${pc.gray('$')} ${pc.cyan(`pnpm changeset`)}                      # Record semver bump\n`
    )
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCreatePackage().catch((err) => {
    console.error(pc.red('Error creating package:'), err);
    process.exit(1);
  });
}
