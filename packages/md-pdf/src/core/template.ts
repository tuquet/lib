import fs from 'node:fs';
import path from 'node:path';

export interface RenderTemplateOptions {
  title: string;
  content: string;
  styles?: string[];
  rootDir: string;
  targetDir: string;
  relPrefix: string;
  autoRedirectHtml?: boolean;
}

const DEFAULT_MARKDOWN_CSS = `
/* Modern clean typography & printable stylesheet */
:root {
  --text-main: #18181b;
  --bg-main: #ffffff;
  --border-color: #e4e4e7;
  --code-bg: #f4f4f5;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-main);
  background-color: var(--bg-main);
  padding: 0 24px;
  margin: 0;
  word-wrap: break-word;
}

h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
  line-height: 1.25;
  margin-top: 24px;
  margin-bottom: 12px;
  color: var(--text-main);
}

h1 { font-size: 1.85em; border-bottom: 1px solid var(--border-color); padding-bottom: 0.3em; }
h2 { font-size: 1.45em; border-bottom: 1px solid var(--border-color); padding-bottom: 0.25em; }
h3 { font-size: 1.2em; }
h4 { font-size: 1.05em; }

p, blockquote, ul, ol, dl, table, pre {
  margin-top: 0;
  margin-bottom: 14px;
}

ul, ol {
  padding-left: 2em;
}

li {
  margin-top: 0.25em;
  margin-bottom: 0.25em;
}

hr {
  height: 1px;
  padding: 0;
  margin: 24px 0;
  background-color: var(--border-color);
  border: 0;
}

table {
  border-collapse: collapse;
  width: 100%;
  margin: 16px 0;
  display: table;
}

table th, table td {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
}

table th {
  font-weight: 600;
  background-color: var(--code-bg);
}

code {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
  font-size: 88%;
  background-color: var(--code-bg);
  border-radius: 4px;
  padding: 0.2em 0.4em;
}

pre {
  background-color: var(--code-bg);
  border-radius: 6px;
  padding: 14px;
  overflow: auto;
}

pre code {
  background-color: transparent;
  padding: 0;
  font-size: 90%;
}

.table-container {
  overflow-x: auto;
  margin: 16px 0;
}

/* Print Specific Rules */
@media print {
  body {
    padding: 0 !important;
    background: transparent !important;
  }
  .page-break {
    page-break-after: always;
  }
}
`;

export function renderFullHtml(options: RenderTemplateOptions): string {
  const { title, content, styles, rootDir, targetDir, autoRedirectHtml } = options;

  let injectedStyles = `<style>${DEFAULT_MARKDOWN_CSS}</style>\n`;

  if (styles && styles.length > 0) {
    for (const styleItem of styles) {
      if (styleItem.startsWith('http://') || styleItem.startsWith('https://')) {
        injectedStyles += `<link rel="stylesheet" href="${styleItem}">\n`;
      } else {
        // Resolve relative style path
        const absoluteStyle = path.isAbsolute(styleItem)
          ? styleItem
          : path.resolve(rootDir, styleItem);

        if (fs.existsSync(absoluteStyle)) {
          const relativeStyleFromTarget = path
            .relative(targetDir, absoluteStyle)
            .replace(/\\/g, '/');
          injectedStyles += `<link rel="stylesheet" href="${relativeStyleFromTarget}">\n`;
        }
      }
    }
  }

  const redirectScript = autoRedirectHtml
    ? `
<script>
if (window.location.protocol.startsWith('http') && window.location.pathname.endsWith('README.html')) {
  window.location.replace(window.location.pathname.replace(/README\\.html$/, 'index.html') + window.location.search);
}
</script>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
${redirectScript}
${injectedStyles}
</head>
<body>
${content}
</body>
</html>
`;
}
