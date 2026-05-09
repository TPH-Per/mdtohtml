import { describe, it, expect } from 'vitest';
import { buildClaudeSystemPrompt } from '../src/builders/claude';
import { buildGeminiSystemPrompt } from '../src/builders/gemini';
import { buildCopilotInstructions } from '../src/builders/copilot';
import type { CSSContract } from '@llm-html-kit/core';

const mockContract: CSSContract = {
  classes: ['card', 'prose', 'heading-xl', 'data-table', 'callout-warning'],
  customProperties: ['--color-primary', '--spacing-4'],
  source: '/* mock */',
  checksum: 'abc123',
};

describe('Claude prompt builder', () => {
  it('should include link tag instruction', () => {
    const prompt = buildClaudeSystemPrompt(mockContract, {});
    expect(prompt).toContain('<link rel="stylesheet"');
  });

  it('should match snapshot', () => {
    const prompt = buildClaudeSystemPrompt(mockContract, { maxVocabularyTokens: 300 });
    expect(prompt).toMatchSnapshot();
  });
});

describe('Gemini prompt builder', () => {
  it('should match snapshot', () => {
    expect(buildGeminiSystemPrompt(mockContract, {})).toMatchSnapshot();
  });
});

describe('Copilot instructions builder', () => {
  it('should produce valid markdown', () => {
    const md = buildCopilotInstructions(mockContract, {});
    expect(md).toMatch(/^#/m);    // has at least one heading
    expect(md).toContain('\`\`\`html');
  });
});
