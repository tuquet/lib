import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function createMarkdownParser(): MarkdownIt {
  const md: MarkdownIt = new MarkdownIt({
    html: true,
    breaks: true,
    linkify: true,
    typographer: true,
    highlight: (str: string, lang: string): string => {
      if (lang && lang.match(/\bmermaid\b/i)) {
        return `<div class="mermaid">${str}</div>`;
      }
      if (lang && hljs.getLanguage(lang)) {
        try {
          return `<pre class="hljs"><code class="language-${lang}">${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`;
        } catch {
          // fallback
        }
      }
      return `<pre class="hljs"><code>${escapeHtml(str)}</code></pre>`;
    },
  });

  type RenderRule = NonNullable<MarkdownIt['renderer']['rules']['table_open']>;

  // Responsive Table wrapping rule
  const defaultTableOpen: RenderRule =
    md.renderer.rules.table_open ||
    ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));
  const defaultTableClose: RenderRule =
    md.renderer.rules.table_close ||
    ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));

  md.renderer.rules.table_open = (tokens, idx, options, env, self) => {
    return `<div class="table-container">\n` + defaultTableOpen(tokens, idx, options, env, self);
  };

  md.renderer.rules.table_close = (tokens, idx, options, env, self) => {
    return defaultTableClose(tokens, idx, options, env, self) + `\n</div>`;
  };

  return md;
}

export function extractDocumentTitle(markdown: string, fallback: string): string {
  // Try finding the first H1 in markdown (# Title)
  const h1Match = markdown.match(/^#\s+(.+)$/m);
  if (h1Match && h1Match[1]) {
    return h1Match[1].trim().replace(/[*_`]/g, '');
  }
  return fallback;
}
