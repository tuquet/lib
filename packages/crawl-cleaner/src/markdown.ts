import { sanitizeDom } from './sanitize.js';
import type { MarkdownOptions } from './types.js';

/**
 * Converts a DOM element tree to clean, token-efficient GitHub Flavored Markdown
 */
export function domToMarkdown(root: Element, options: MarkdownOptions = {}): string {
  const sanitized = sanitizeDom(root);
  const buffer: string[] = [];

  processNode(sanitized, buffer, options);

  const rawMarkdown = buffer.join('');
  return cleanWhitespace(rawMarkdown, options.maxConsecutiveNewlines ?? 2);
}

function processNode(node: Node, buffer: string[], options: MarkdownOptions): void {
  if (node.nodeType === 3) {
    // TEXT_NODE
    const text = node.textContent || '';
    buffer.push(text);
    return;
  }

  if (node.nodeType !== 1) {
    // Ignore comments, documents, etc.
    return;
  }

  const el = node as Element;
  const tag = el.tagName.toUpperCase();

  switch (tag) {
    case 'H1':
      buffer.push('\n\n# ');
      processChildren(el, buffer, options);
      buffer.push('\n\n');
      break;
    case 'H2':
      buffer.push('\n\n## ');
      processChildren(el, buffer, options);
      buffer.push('\n\n');
      break;
    case 'H3':
      buffer.push('\n\n### ');
      processChildren(el, buffer, options);
      buffer.push('\n\n');
      break;
    case 'H4':
      buffer.push('\n\n#### ');
      processChildren(el, buffer, options);
      buffer.push('\n\n');
      break;
    case 'H5':
      buffer.push('\n\n##### ');
      processChildren(el, buffer, options);
      buffer.push('\n\n');
      break;
    case 'H6':
      buffer.push('\n\n###### ');
      processChildren(el, buffer, options);
      buffer.push('\n\n');
      break;
    case 'P':
      buffer.push('\n\n');
      processChildren(el, buffer, options);
      buffer.push('\n\n');
      break;
    case 'BR':
      buffer.push('\n');
      break;
    case 'HR':
      buffer.push('\n\n---\n\n');
      break;
    case 'STRONG':
    case 'B':
      buffer.push('**');
      processChildren(el, buffer, options);
      buffer.push('**');
      break;
    case 'EM':
    case 'I':
      buffer.push('*');
      processChildren(el, buffer, options);
      buffer.push('*');
      break;
    case 'CODE':
      if (el.parentElement?.tagName.toUpperCase() === 'PRE') {
        processChildren(el, buffer, options);
      } else {
        buffer.push('`');
        processChildren(el, buffer, options);
        buffer.push('`');
      }
      break;
    case 'PRE':
      buffer.push('\n\n```\n');
      processChildren(el, buffer, options);
      buffer.push('\n```\n\n');
      break;
    case 'BLOCKQUOTE':
      buffer.push('\n\n> ');
      processChildren(el, buffer, options);
      buffer.push('\n\n');
      break;
    case 'UL':
      buffer.push('\n');
      for (const li of Array.from(el.children)) {
        if (li.tagName.toUpperCase() === 'LI') {
          buffer.push('\n* ');
          processChildren(li, buffer, options);
        }
      }
      buffer.push('\n');
      break;
    case 'OL': {
      buffer.push('\n');
      let index = 1;
      for (const li of Array.from(el.children)) {
        if (li.tagName.toUpperCase() === 'LI') {
          buffer.push(`\n${index}. `);
          processChildren(li, buffer, options);
          index++;
        }
      }
      buffer.push('\n');
      break;
    }
    case 'TABLE':
      processTable(el, buffer, options);
      break;
    case 'A': {
      if (options.includeLinks === false) {
        processChildren(el, buffer, options);
      } else {
        const rawHref = el.getAttribute('href') || '';
        const href = resolveUrl(rawHref, options.baseUrl);
        const innerBuffer: string[] = [];
        processChildren(el, innerBuffer, options);
        const text = innerBuffer.join('').trim();
        if (text && href && !href.startsWith('javascript:')) {
          buffer.push(`[${text}](${href})`);
        } else if (text) {
          buffer.push(text);
        }
      }
      break;
    }
    case 'IMG': {
      if (options.includeImages !== false) {
        const rawSrc = el.getAttribute('src') || '';
        const src = resolveUrl(rawSrc, options.baseUrl);
        const alt = el.getAttribute('alt') || '';
        if (src) {
          buffer.push(`![${alt}](${src})`);
        }
      }
      break;
    }
    default:
      processChildren(el, buffer, options);
      break;
  }
}

function processChildren(el: Element, buffer: string[], options: MarkdownOptions): void {
  for (const child of Array.from(el.childNodes)) {
    processNode(child, buffer, options);
  }
}

function processTable(table: Element, buffer: string[], options: MarkdownOptions): void {
  const rows = Array.from(table.querySelectorAll('tr'));
  if (rows.length === 0) return;

  buffer.push('\n\n');
  let isFirstRow = true;

  for (const tr of rows) {
    const cells = Array.from(tr.querySelectorAll('th, td'));
    if (cells.length === 0) continue;

    const cellTexts: string[] = [];
    for (const cell of cells) {
      const cellBuffer: string[] = [];
      processChildren(cell, cellBuffer, options);
      cellTexts.push(cellBuffer.join('').replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim());
    }

    buffer.push(`| ${cellTexts.join(' | ')} |\n`);

    if (isFirstRow) {
      const separators = cellTexts.map(() => '---');
      buffer.push(`| ${separators.join(' | ')} |\n`);
      isFirstRow = false;
    }
  }
  buffer.push('\n');
}

function resolveUrl(url: string, baseUrl?: string): string {
  if (!baseUrl || !url) return url;
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return url;
  }
}

function cleanWhitespace(text: string, maxConsecutiveNewlines: number): string {
  const regex = new RegExp(`\\n{${maxConsecutiveNewlines + 1},}`, 'g');
  const replacement = '\n'.repeat(maxConsecutiveNewlines);
  return text.replace(regex, replacement).trim();
}
