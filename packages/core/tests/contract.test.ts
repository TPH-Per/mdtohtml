import { describe, it, expect, beforeAll } from 'vitest';
import { loadContract, vocabularyToPromptFragment, CSSContract } from '../src/contract';
import * as path from 'path';

const STYLESHEET = path.resolve(__dirname, '../../stylesheet/dist/styles.css');

describe('loadContract', () => {
  let contract: CSSContract;

  beforeAll(async () => {
    contract = await loadContract(STYLESHEET);
  });

  it('should extract all defined classes', () => {
    expect(contract.classes).toContain('card');
    expect(contract.classes).toContain('prose');
    expect(contract.classes).toContain('data-table');
    expect(contract.classes).toContain('callout-warning');
  });

  it('should extract CSS custom properties', () => {
    expect(contract.customProperties).toContain('--color-primary');
    expect(contract.customProperties).toContain('--spacing-4');
  });

  it('should produce a stable checksum', async () => {
    const contract2 = await loadContract(STYLESHEET);
    expect(contract.checksum).toBe(contract2.checksum);
  });
});

describe('vocabularyToPromptFragment', () => {
  it('should include class names in static return', async () => {
    const contract = await loadContract(STYLESHEET);
    const fragment = vocabularyToPromptFragment(contract);
    expect(fragment).toContain('card');
    expect(fragment).toContain('prose');
  });
});
