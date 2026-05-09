import { CSSContract, vocabularyToPromptFragment } from '@llm-html-kit/core';
import { PromptOptions } from '../index';

export function buildCopilotInstructions(contract: CSSContract, options: PromptOptions): string {
  return `
# HTML Output Contract

For all HTML generation tasks in this repository:

## Rules
- Always add \`<link rel="stylesheet" href="./styles.css">\` to \`<head>\`
- Never use inline \`style=""\` attributes
- Never add \`<style>\` tags
- Use only the CSS class vocabulary below

## CSS Classes

${vocabularyToPromptFragment(contract, options.maxVocabularyTokens)}

## Example

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Document</title>
  <link rel="stylesheet" href="./styles.css">
</head>
<body>
  <main class="container stack">
    <div class="card">
      <div class="card-body prose">
        <p>Content here.</p>
      </div>
    </div>
  </main>
</body>
</html>
\`\`\`

## Validation
Run \`llm-html audit <file>\` to verify generated HTML conforms to the contract.
`.trim();
}
