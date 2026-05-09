import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import { validateHTML, type ValidationRules } from '../src/validator.js';
import { loadContract, type CSSContract } from '../src/contract.js';

let contract: CSSContract;

beforeAll(async () => {
  contract = await loadContract(
    path.resolve(__dirname, '../../stylesheet/dist/styles.css')
  );
});

const RULES: ValidationRules = {
  noInlineStyles: true,
  requireLinkTag: true,
  allowedClasses: 'auto',
  noTailwindClasses: true,
};

const VALID_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Test</title>
  <link rel="stylesheet" href="./styles.css">
</head>
<body>
  <main class="container stack">
    <div class="card">
      <div class="card-header"><h1 class="heading-xl">Title</h1></div>
      <div class="card-body prose"><p>Content here.</p></div>
    </div>
  </main>
</body>
</html>`;

describe('validateHTML — happy path', () => {
  it('passes clean HTML with no errors or warnings about contract classes', async () => {
    const result = await validateHTML(VALID_HTML, contract, RULES);
    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('validateHTML — missing link tag', () => {
  it('errors when <link rel="stylesheet"> is absent', async () => {
    const html = VALID_HTML.replace('<link rel="stylesheet" href="./styles.css">', '');
    const result = await validateHTML(html, contract, RULES);
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => e.type === 'missing-link-tag')).toBe(true);
  });

  it('passes when requireLinkTag is false', async () => {
    const html = VALID_HTML.replace('<link rel="stylesheet" href="./styles.css">', '');
    const result = await validateHTML(html, contract, { ...RULES, requireLinkTag: false });
    expect(result.errors.filter(e => e.type === 'missing-link-tag')).toHaveLength(0);
  });
});

describe('validateHTML — inline styles', () => {
  it('catches style="" attribute', async () => {
    const html = VALID_HTML.replace('class="card"', 'class="card" style="color: red"');
    const result = await validateHTML(html, contract, RULES);
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => e.type === 'inline-style')).toBe(true);
  });

  it('catches <style> block', async () => {
    const html = VALID_HTML.replace(
      '<link rel="stylesheet" href="./styles.css">',
      '<style>.card { background: white; }</style>'
    );
    const result = await validateHTML(html, contract, RULES);
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => e.type === 'inline-style')).toBe(true);
  });

  it('does NOT catch styles when noInlineStyles is false', async () => {
    const html = VALID_HTML.replace('class="card"', 'class="card" style="color:red"');
    const result = await validateHTML(html, contract, { ...RULES, noInlineStyles: false });
    expect(result.errors.filter(e => e.type === 'inline-style')).toHaveLength(0);
  });
});

describe('validateHTML — line/column accuracy', () => {
  it('reports correct line for inline style on line 8', async () => {
    // Build HTML where the offending element is on a known line
    const lines = [
      '<!DOCTYPE html>',
      '<html><head>',
      '<link rel="stylesheet" href="./styles.css">',
      '</head><body>',
      '<p class="prose">line 5</p>',
      '<p class="prose">line 6</p>',
      '<p class="prose">line 7</p>',
      '<div style="color: red">offender on line 8</div>',
      '</body></html>',
    ];
    const html = lines.join('\n');
    const result = await validateHTML(html, contract, RULES);
    const err = result.errors.find(e => e.type === 'inline-style');
    expect(err).toBeDefined();
    expect(err!.line).toBe(8);
  });

  it('reports correct line for <style> block on line 3', async () => {
    const lines = [
      '<!DOCTYPE html>',
      '<html><head>',
      '<style>.x { color: red; }</style>',
      '<link rel="stylesheet" href="./styles.css">',
      '</head><body><p>hi</p></body></html>',
    ];
    const html = lines.join('\n');
    const result = await validateHTML(html, contract, RULES);
    const err = result.errors.find(e => e.type === 'inline-style');
    expect(err!.line).toBe(3);
  });
});

describe('validateHTML — unknown classes', () => {
  it('warns (not errors) on unknown class', async () => {
    const html = VALID_HTML.replace('class="card"', 'class="card unknown-xyz-class"');
    const result = await validateHTML(html, contract, RULES);
    expect(result.passed).toBe(true);
    expect(result.warnings.some(w => w.message.includes('unknown-xyz-class'))).toBe(true);
  });

  it('warns on possible tailwind class', async () => {
    const html = VALID_HTML.replace('class="card"', 'class="card text-sm bg-blue-500"');
    const result = await validateHTML(html, contract, RULES);
    expect(result.warnings.some(w => w.message.includes('Tailwind class \'text-sm\''))).toBe(true);
    expect(result.warnings.some(w => w.message.includes('Tailwind class \'bg-blue-500\''))).toBe(true);
  });
});
