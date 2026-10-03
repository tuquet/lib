// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { clickContentExpanders, dismissConsentModals } from '../src/index.js';

describe('@tuquet/crawl-interact', () => {
  it('detects and clicks GDPR consent buttons by class and id', () => {
    document.body.innerHTML = `
      <div id="cookie-banner">
        <button id="accept-cookies">Accept All Cookies</button>
      </div>
    `;

    const btn = document.getElementById('accept-cookies')!;
    const clickSpy = vi.fn();
    btn.addEventListener('click', clickSpy);

    const clicks = dismissConsentModals({ root: document });
    expect(clicks).toBe(1);
    expect(clickSpy).toHaveBeenCalled();
  });

  it('detects Vietnamese consent buttons by text content', () => {
    document.body.innerHTML = `
      <div class="consent-overlay">
        <button type="button" class="btn-primary">Đồng ý và Tiếp tục</button>
      </div>
    `;

    const btn = document.querySelector('.btn-primary')!;
    const clickSpy = vi.fn();
    btn.addEventListener('click', clickSpy);

    const clicks = dismissConsentModals({ root: document });
    expect(clicks).toBe(1);
    expect(clickSpy).toHaveBeenCalled();
  });

  it('clicks expander buttons matching "Xem thêm" and "Read more"', () => {
    document.body.innerHTML = `
      <article>
        <p>Short paragraph preview...</p>
        <button class="expand-btn">Xem thêm</button>
        <button class="read-more">Read more</button>
      </article>
    `;

    const expandBtn = document.querySelector('.expand-btn')!;
    const readMoreBtn = document.querySelector('.read-more')!;
    const expandSpy = vi.fn();
    const readSpy = vi.fn();

    expandBtn.addEventListener('click', expandSpy);
    readMoreBtn.addEventListener('click', readSpy);

    const clicks = clickContentExpanders({ root: document });
    expect(clicks).toBe(2);
    expect(expandSpy).toHaveBeenCalled();
    expect(readSpy).toHaveBeenCalled();
  });

  it('ignores non-clickable disabled buttons', () => {
    document.body.innerHTML = `
      <button disabled id="cookie-banner-accept">Accept All</button>
    `;

    const clicks = dismissConsentModals({ root: document });
    expect(clicks).toBe(0);
  });
});
