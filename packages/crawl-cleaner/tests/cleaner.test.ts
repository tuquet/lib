// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { domToMarkdown, estimateTokenSavings, sanitizeDom } from '../src/index.js';

describe('@tuquet/crawl-cleaner', () => {
  it('strips scripts, styles, iframes, and noisy containers', () => {
    document.body.innerHTML = `
      <div id="content">
        <script>console.log('danger');</script>
        <style>body { color: red; }</style>
        <iframe src="about:blank"></iframe>
        <div class="ads">Ad banner content</div>
        <h1>Product Overview</h1>
        <p>This is a safe descriptive paragraph.</p>
      </div>
    `;

    const clean = sanitizeDom(document.getElementById('content')!);
    expect(clean.querySelector('script')).toBeNull();
    expect(clean.querySelector('style')).toBeNull();
    expect(clean.querySelector('iframe')).toBeNull();
    expect(clean.querySelector('.ads')).toBeNull();
    expect(clean.querySelector('h1')?.textContent).toBe('Product Overview');
    expect(clean.querySelector('p')?.textContent).toBe('This is a safe descriptive paragraph.');
  });

  it('converts headings, paragraphs, lists, and tables to Markdown', () => {
    document.body.innerHTML = `
      <article>
        <h2>Telemetry Architecture</h2>
        <p>Real-time vehicle data streaming via <strong>WebSockets</strong> and <em>Redis</em>.</p>
        <ul>
          <li>Sub-100ms latency</li>
          <li>Zero-zombie supervision</li>
        </ul>
        <table>
          <thead>
            <tr><th>Metric</th><th>Target</th></tr>
          </thead>
          <tbody>
            <tr><td>Throughput</td><td>100k msgs/sec</td></tr>
          </tbody>
        </table>
      </article>
    `;

    const md = domToMarkdown(document.querySelector('article')!);
    expect(md).toContain('## Telemetry Architecture');
    expect(md).toContain('**WebSockets**');
    expect(md).toContain('*Redis*');
    expect(md).toContain('* Sub-100ms latency');
    expect(md).toContain('| Metric | Target |');
    expect(md).toContain('| Throughput | 100k msgs/sec |');
  });

  it('resolves relative URLs to absolute links when baseUrl is provided', () => {
    document.body.innerHTML = `
      <div>
        <a href="/docs/guide">Documentation</a>
        <img src="/assets/diagram.png" alt="Architecture" />
      </div>
    `;

    const md = domToMarkdown(document.body, { baseUrl: 'https://tuquet.io' });
    expect(md).toContain('[Documentation](https://tuquet.io/docs/guide)');
    expect(md).toContain('![Architecture](https://tuquet.io/assets/diagram.png)');
  });

  it('calculates token savings between raw HTML and Clean Markdown', () => {
    const rawHtml = `
      <div class="card p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800" data-v-12345="true" style="margin: 0; padding: 20px;">
        <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Specs</span>
        <h2 class="text-xl font-bold text-gray-900 mt-2">Chromium Supervision</h2>
        <p class="text-sm text-gray-600 mt-1 leading-relaxed">Pure Open-Source Chromium runtime with automated zombie cleanup.</p>
      </div>
    `;
    const cleanMarkdown = `## Chromium Supervision\n\nPure Open-Source Chromium runtime with automated zombie cleanup.`;

    const savings = estimateTokenSavings(rawHtml, cleanMarkdown);
    expect(savings.rawTokens).toBeGreaterThan(savings.cleanTokens);
    expect(savings.reductionPercent).toBeGreaterThan(50);
  });
});
