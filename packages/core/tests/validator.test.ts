import { describe, it, expect, beforeAll } from 'vitest';
import { validateHTML, ValidationRules } from '../src/validator';
import { loadContract, CSSContract } from '../src/contract';
import * as path from 'path';

const STYLESHEET = path.resolve(__dirname, '../../stylesheet/dist/styles.css');
const rules: ValidationRules = { noInlineStyles: true, requireLinkTag: true, allowedClasses: 'auto' };

describe('validateHTML', () => {
  let contract: CSSContract;
  beforeAll(async () => { contract = await loadContract(STYLESHEET); });

  const VALID_HTML = `<!DOCTYPE html><html><head>
<link rel="stylesheet" href="./styles.css"></head>
<body><div class="card prose"><p>Hello</p></div></body></html>`;

  const INVALID_INLINE_STYLE = `<!DOCTYPE html><html><head>
<link rel="stylesheet" href="./styles.css"></head>
<body><div style="color: red"><p>Hello</p></div></body></html>`;

  const MISSING_LINK = `<!DOCTYPE html><html><head></head>
<body><div class="card"><p>Hello</p></div></body></html>`;

  const STYLE_BLOCK = `<!DOCTYPE html><html><head>
<link rel="stylesheet" href="./styles.css">
<style>.custom { color: red; }</style></head>
<body><div class="card"><p>Hello</p></div></body></html>`;

  it('should pass valid HTML', async () => {
    const result = await validateHTML(VALID_HTML, contract, rules);
    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should catch inline style attribute', async () => {
    const result = await validateHTML(INVALID_INLINE_STYLE, contract, rules);
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => e.type === 'inline-style')).toBe(true);
  });

  it('should catch missing link tag', async () => {
    const result = await validateHTML(MISSING_LINK, contract, rules);
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => e.type === 'missing-link-tag')).toBe(true);
  });

  it('should catch <style> blocks', async () => {
    const result = await validateHTML(STYLE_BLOCK, contract, rules);
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => e.type === 'inline-style')).toBe(true);
  });

  it('should warn on unknown classes but not fail', async () => {
    const htmlWithUnknown = VALID_HTML.replace('card prose', 'card my-custom-class');
    const result = await validateHTML(htmlWithUnknown, contract, rules);
    expect(result.passed).toBe(true);
    expect(result.warnings.some(w => w.message.includes('my-custom-class'))).toBe(true);
  });
});
