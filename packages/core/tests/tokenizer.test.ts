import { describe, it, expect } from 'vitest';
import { countTokens, compareTokens } from '../src/tokenizer.js';

const HTML_WITH_STYLE_BLOCK = `<!DOCTYPE html>
<html><head>
<style>
  .card { background: white; border-radius: 8px; padding: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
  .heading { font-size: 1.5rem; font-weight: 700; color: #1a202c; margin-bottom: 1rem; }
  .prose p { line-height: 1.6; color: #4a5568; }
</style>
</head><body>
<div class="card">
  <h1 class="heading">Title</h1>
  <div class="prose"><p>Content</p></div>
</div>
</body></html>`;

const HTML_EXTERNAL_CSS = `<!DOCTYPE html>
<html><head>
<link rel="stylesheet" href="./styles.css">
</head><body>
<div class="card">
  <h1 class="heading">Title</h1>
  <div class="prose"><p>Content</p></div>
</div>
</body></html>`;

const HTML_INLINE_STYLE = `<div style="color: red; font-size: 14px; padding: 8px;">Hello</div>`;

describe('countTokens — style isolation', () => {
  it('counts style tokens from <style> block', async () => {
    const r = await countTokens(HTML_WITH_STYLE_BLOCK);
    expect(r.style).toBeGreaterThan(20);
    expect(r.structure).toBeLessThan(r.raw);
  });

  it('style = 0 for HTML with only external CSS', async () => {
    const r = await countTokens(HTML_EXTERNAL_CSS);
    expect(r.style).toBe(0);
    expect(r.savings).toBe(0);
    expect(r.structure).toBe(r.raw);
  });

  it('structure + style approximately equals raw (within 1 token)', async () => {
    const r = await countTokens(HTML_WITH_STYLE_BLOCK);
    expect(Math.abs(r.structure + r.style - r.raw)).toBeLessThanOrEqual(1);
  });

  it('counts inline style="" attributes as style tokens', async () => {
    const r = await countTokens(HTML_INLINE_STYLE);
    expect(r.style).toBeGreaterThan(0);
  });

  it('gemini encoding uses char-based estimate', async () => {
    const r = await countTokens('<p>hello</p>', 'gemini');
    expect(r.raw).toBe(Math.ceil('<p>hello</p>'.length / 4));
  });
});

describe('countTokens — singleton stability', () => {
  it('calling 100 times in sequence does not throw or degrade', async () => {
    for (let i = 0; i < 100; i++) {
      const r = await countTokens(`<div class="card-${i}"><p>item ${i}</p></div>`);
      expect(r.raw).toBeGreaterThan(0);
    }
  });
});

describe('compareTokens', () => {
  it('reports positive savings when after < before', async () => {
    const d = await compareTokens(HTML_WITH_STYLE_BLOCK, HTML_EXTERNAL_CSS);
    expect(d.savingsTokens).toBeGreaterThan(0);
    expect(d.savingsPercent).toBeGreaterThan(20);
  });

  it('reports zero or negative savings when after > before', async () => {
    const d = await compareTokens(HTML_EXTERNAL_CSS, HTML_WITH_STYLE_BLOCK);
    expect(d.savingsPercent).toBeLessThanOrEqual(0);
  });

  it('before and after are set correctly', async () => {
    const d = await compareTokens(HTML_WITH_STYLE_BLOCK, HTML_EXTERNAL_CSS);
    expect(d.before.raw).toBeGreaterThan(d.after.raw);
  });
});
