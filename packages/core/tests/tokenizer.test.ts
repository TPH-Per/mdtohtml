import { describe, it, expect } from 'vitest';
import { countTokens, compareTokens } from '../src/tokenizer';

const HTML_WITH_STYLE = `<!DOCTYPE html><html><head>
<style>
  .card { background: white; border-radius: 8px; padding: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
  .heading { font-size: 1.5rem; font-weight: 700; color: #1a202c; margin-bottom: 1rem; }
</style>
</head><body><div class="card"><h1 class="heading">Hello</h1></div></body></html>`;

const HTML_WITHOUT_STYLE = `<!DOCTYPE html><html><head>
<link rel="stylesheet" href="./styles.css">
</head><body><div class="card"><h1 class="heading">Hello</h1></div></body></html>`;

describe('countTokens', () => {
  it('should count total tokens', async () => {
    const result = await countTokens(HTML_WITH_STYLE);
    expect(result.raw).toBeGreaterThan(50);
  });

  it('should identify style tokens separately', async () => {
    const result = await countTokens(HTML_WITH_STYLE);
    expect(result.style).toBeGreaterThan(0);
    expect(result.structure).toBeLessThan(result.raw);
    expect(result.structure + result.style).toBeCloseTo(result.raw, -1);
  });

  it('should show zero style tokens for external-CSS HTML', async () => {
    const result = await countTokens(HTML_WITHOUT_STYLE);
    expect(result.style).toBe(0);
    expect(result.savings).toBe(0);
  });
});

describe('compareTokens', () => {
  it('should report savings percentage', async () => {
    const diff = await compareTokens(HTML_WITH_STYLE, HTML_WITHOUT_STYLE);
    expect(diff.savingsPercent).toBeGreaterThan(10);
  });

  it('should not report negative savings when after > before', async () => {
    const diff = await compareTokens(HTML_WITHOUT_STYLE, HTML_WITH_STYLE);
    expect(diff.savingsPercent).toBeLessThanOrEqual(0);
  });
});
