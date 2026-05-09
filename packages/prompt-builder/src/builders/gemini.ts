import { CSSContract, vocabularyToPromptFragment } from '@llm-html-kit/core';
import { PromptOptions } from '../index';

export function buildGeminiSystemPrompt(contract: CSSContract, options: PromptOptions): string {
  // For Gemini, we might adjust the tone slightly to fit its system instruction style,
  // but the core rules remain the same.
  return `
## HTML Output Contract

When generating HTML documents, follow these strict rules:

1. **Always include this exact link tag** in the <head>:
   \`<link rel="stylesheet" href="./styles.css">\`

2. **Never write inline styles**. Do not use \`style=""\` attributes or \`<style>\` blocks.

3. **Use only the pre-defined CSS classes** listed below. These classes map to a shared stylesheet.

4. **Structure**: wrap all content in semantic HTML5 tags.

### Available CSS Classes

${vocabularyToPromptFragment(contract, options.maxVocabularyTokens)}

### Example Output Structure

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Document Title</title>
  <link rel="stylesheet" href="./styles.css">
</head>
<body>
  <main class="container stack">
    <h1 class="heading-xl">Report Title</h1>
    <div class="card">
      <div class="card-header"><h2 class="heading-md">Section</h2></div>
      <div class="card-body prose">
        <p>Content here.</p>
      </div>
    </div>
  </main>
</body>
</html>
\`\`\`

Violation of any rule above (inline styles, missing link tag, invented classes) will cause validation failure.
`.trim();
}
