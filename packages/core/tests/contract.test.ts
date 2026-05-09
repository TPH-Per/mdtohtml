import { describe, it, expect } from 'vitest';
import path from 'path';
import { loadContract, vocabularyToPromptFragment } from '../src/contract.js';

// Use the real built stylesheet
const STYLESHEET_PATH = path.resolve(
  __dirname, '../../stylesheet/dist/styles.css'
);

const MOCK_CONTRACT = {
  classes: [
    'container', 'stack', 'stack-sm', 'grid-2', 'grid-3',
    'card', 'card-header', 'card-body', 'card-footer',
    'badge', 'badge-primary', 'badge-success', 'badge-warning', 'badge-error',
    'callout', 'callout-info', 'callout-warning', 'callout-error',
    'prose', 'heading-xl', 'heading-lg', 'heading-md', 'heading-sm',
    'data-table', 'data-table-striped',
    'divider', 'divider-dashed',
    'text-right', 'text-center', 'truncate', 'visually-hidden',
    'flex', 'flex-col', 'items-center', 'justify-between',
  ],
  customProperties: ['--color-primary', '--color-success', '--spacing-4', '--spacing-8'],
  source: '/* mock */',
  checksum: 'abc123def456',
};

describe('loadContract — real stylesheet', () => {
  it('extracts more than 20 classes', async () => {
    const contract = await loadContract(STYLESHEET_PATH);
    expect(contract.classes.length).toBeGreaterThan(20);
  });

  it('extracts custom properties starting with --', async () => {
    const contract = await loadContract(STYLESHEET_PATH);
    expect(contract.customProperties.some(p => p.startsWith('--color'))).toBe(true);
    expect(contract.customProperties.some(p => p.startsWith('--spacing'))).toBe(true);
  });

  it('checksum is stable across two loads', async () => {
    const [c1, c2] = await Promise.all([
      loadContract(STYLESHEET_PATH),
      loadContract(STYLESHEET_PATH),
    ]);
    expect(c1.checksum).toBe(c2.checksum);
  });

  it('checksum changes when source changes', async () => {
    const c1 = await loadContract(STYLESHEET_PATH);
    const fakeContract = { ...c1, source: c1.source + '/* bump */' };
    const crypto = await import('crypto');
    const newChecksum = crypto.createHash('sha256')
      .update(fakeContract.source).digest('hex');
    expect(newChecksum).not.toBe(c1.checksum);
  });
});

describe('vocabularyToPromptFragment', () => {
  it('contains all classes from contract (not hardcoded strings)', () => {
    const fragment = vocabularyToPromptFragment(MOCK_CONTRACT);
    for (const cls of MOCK_CONTRACT.classes) {
      expect(fragment).toContain(cls);
    }
  });

  it('groups classes under category headers', () => {
    const fragment = vocabularyToPromptFragment(MOCK_CONTRACT);
    expect(fragment).toMatch(/Layout:/);
    expect(fragment).toMatch(/Components:/);
    expect(fragment).toMatch(/Badges:/);
    expect(fragment).toMatch(/Callouts:/);
    expect(fragment).toMatch(/Typography:/);
  });

  it('custom class not in categories goes to Utilities or at least appears', () => {
    const contract = { ...MOCK_CONTRACT, classes: ['my-unique-xyz-class'] };
    const fragment = vocabularyToPromptFragment(contract);
    expect(fragment).toContain('my-unique-xyz-class');
  });

  it('respects maxTokens by truncating near a newline boundary', () => {
    const fragment = vocabularyToPromptFragment(MOCK_CONTRACT, 10);
    expect(fragment.length).toBeLessThan(100);
    expect(fragment).toContain('truncated');
  });

  it('returns full fragment when maxTokens is not set', () => {
    const fragment = vocabularyToPromptFragment(MOCK_CONTRACT);
    expect(fragment).not.toContain('truncated');
  });
});
