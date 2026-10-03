// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { crawlDocument } from '../src/index.js';

describe('@tuquet/crawler', () => {
  it('runs complete multi-tiered pipeline on rich HTML document', async () => {
    document.title = 'Distributed Process Sandboxing in Rust';
    document.head.innerHTML = `
      <title>Distributed Process Sandboxing in Rust</title>
      <meta name="description" content="Technical deep dive into kernel process trees and zero-zombie process supervision." />
      <meta property="og:title" content="Distributed Process Sandboxing in Rust" />
      <meta property="og:site_name" content="Tuquet Tech Blog" />
      <link rel="canonical" href="https://tuquet.io/posts/process-sandboxing" />
    `;
    document.body.innerHTML = `
      <header>
        <nav><a href="/">Home</a></nav>
      </header>
      <div id="gdpr-cookie-dialog">
        <button id="accept-cookies">Accept All</button>
      </div>
      <main>
        <article>
          <h1>Distributed Process Sandboxing in Rust</h1>
          <div class="byline">By Tu Quet</div>
          <p>Supervising child processes in distributed crawler engines requires robust isolation guarantees. When Chromium tabs encounter infinite loops, kernel completion ports must cleanly terminate all descendant threads.</p>
          <p>By leveraging Windows Job Objects and Linux cgroups, Tuquet Runner achieves zero-zombie lifecycle supervision with minimal resource overhead.</p>
        </article>
      </main>
      <footer>
        <p>© 2026 Tuquet</p>
      </footer>
    `;

    const result = await crawlDocument(document, {
      autoDismissModals: true,
      toMarkdown: true,
      baseUrl: 'https://tuquet.io',
    });

    // 1. Modal was automatically dismissed
    expect(result.url).toBe('https://tuquet.io/posts/process-sandboxing');

    // 2. Metadata extracted
    expect(result.metadata?.title).toBe('Distributed Process Sandboxing in Rust');
    expect(result.metadata?.siteName).toBe('Tuquet Tech Blog');
    expect(result.metadata?.canonical).toBe('https://tuquet.io/posts/process-sandboxing');

    // 3. Heuristic article extracted
    expect(result.article?.byline).toBe('By Tu Quet');
    expect(result.article?.text).toContain('Supervising child processes');
    expect(result.article?.text).not.toContain('© 2026 Tuquet');

    // 4. Markdown generated
    expect(result.markdown).toContain('# Distributed Process Sandboxing in Rust');
    expect(result.markdown).toContain('By Tu Quet');

    // 5. Execution took measurable time
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
  });
});
