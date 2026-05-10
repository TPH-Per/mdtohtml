import { buildBaseRules, EXAMPLE_HTML } from './base.js';
export function buildGeminiSystemPrompt(contract, options) {
    return `
## HTML Output Contract

When generating HTML documents, follow these strict rules:

${buildBaseRules(contract, options)}

${options.includeExample !== false ? EXAMPLE_HTML : ''}

Violation of any rule above (inline styles, missing link tag, invented classes) will cause validation failure.
`.trim();
}
