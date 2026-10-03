import type { NodeScore } from './types.js';

const UNLIKELY_CANDIDATE_REGEX =
  /banner|breadcrumbs|combx|comment|community|cover-margin|disqus|extra|foot|header|legends|menu|related|remark|rss|shoutbox|sidebar|skyscraper|social|sponsor|ad-break|agegate|pagination|pager|popup|yourselection/i;

const POSITIVE_REGEX =
  /article|body|content|entry|hentry|h-entry|main|page|pagination|post|text|blog|story/i;

/**
 * Calculates link density (character count in <a> tags divided by total text length)
 */
export function getLinkDensity(element: Element): number {
  const text = (element.textContent || '').replace(/\s+/g, ' ').trim();
  if (!text) return 0;

  const links = Array.from(element.querySelectorAll('a'));
  let linkLength = 0;
  for (const a of links) {
    linkLength += (a.textContent || '').replace(/\s+/g, ' ').trim().length;
  }

  return Math.min(1, linkLength / text.length);
}

/**
 * Evaluates how likely a given node is to be the primary container of article text.
 */
export function scoreNode(element: Element): NodeScore {
  const text = (element.textContent || '').trim();
  const textLength = text.length;

  if (textLength < 25) {
    return { element, contentScore: 0, linkDensity: 1, textLength };
  }

  const linkDensity = getLinkDensity(element);
  if (linkDensity > 0.5) {
    // Excessive link concentration typically signifies a menu, navbar, or footer
    return { element, contentScore: 0, linkDensity, textLength };
  }

  let contentScore = 0;

  // Tag type base score
  switch (element.tagName.toUpperCase()) {
    case 'DIV':
      contentScore += 5;
      break;
    case 'ARTICLE':
      contentScore += 30;
      break;
    case 'SECTION':
      contentScore += 15;
      break;
    case 'MAIN':
      contentScore += 25;
      break;
    case 'BLOCKQUOTE':
      contentScore += 10;
      break;
    case 'FORM':
    case 'NAV':
    case 'FOOTER':
    case 'HEADER':
    case 'ASIDE':
      contentScore -= 40;
      break;
  }

  // Weight class & ID hints
  const idAndClass = `${element.id || ''} ${element.className || ''}`;
  if (UNLIKELY_CANDIDATE_REGEX.test(idAndClass)) {
    contentScore -= 25;
  }
  if (POSITIVE_REGEX.test(idAndClass)) {
    contentScore += 25;
  }

  // Bonus for paragraphs count
  const paragraphs = element.querySelectorAll('p');
  contentScore += paragraphs.length * 5;

  // Bonus for punctuation marks (indicating natural language article sentences)
  const commas = (text.match(/,/g) || []).length;
  const periods = (text.match(/\./g) || []).length;
  contentScore += (commas + periods) * 2;

  // Factor in text density vs link density penalty
  contentScore = contentScore * (1 - linkDensity);

  return {
    element,
    contentScore: Math.max(0, Math.round(contentScore)),
    linkDensity,
    textLength,
  };
}
