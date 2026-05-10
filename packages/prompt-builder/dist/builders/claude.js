import { buildBaseRules, EXAMPLE_HTML } from './base.js';
export function buildClaudeSystemPrompt(contract, options) {
    return `
## HTML Output Contract

You are operating in a project that uses llm-html-kit for structured HTML generation.

${buildBaseRules(contract, options)}

${options.includeExample !== false ? EXAMPLE_HTML : ''}

### Validation
After generating HTML, the user will run: \`llm-html audit <file> --validate\`
If it reports errors, fix ALL of them before considering the task complete.
`.trim();
}
