import { CSSContract } from '@llm-html-kit/core';
import { PromptOptions } from '../index.js';
import { buildBaseRules, EXAMPLE_HTML } from './base.js';

export function buildCopilotInstructions(contract: CSSContract, options: PromptOptions): string {
  return `
# HTML Output Contract

For all HTML generation tasks in this repository:

${buildBaseRules(contract, options)}

${options.includeExample !== false ? EXAMPLE_HTML : ''}

## Validation
Run \`llm-html audit <file>\` to verify generated HTML conforms to the contract.
`.trim();
}
