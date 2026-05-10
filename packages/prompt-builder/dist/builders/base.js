import { vocabularyToPromptFragment } from '@llm-html-kit/core';
export function buildBaseRules(contract, options) {
    const vocab = vocabularyToPromptFragment(contract, options.maxVocabularyTokens);
    return `
### Rules (non-negotiable)
1. ALWAYS include \`<link rel="stylesheet" href="./styles.css">\` in \`<head>\`.
2. NEVER write \`style=""\` attributes on any element.
3. NEVER add \`<style>\` blocks.
4. NEVER use Tailwind utility classes (text-sm, px-4, bg-blue-500, etc.).
5. Use ONLY the CSS classes listed in the vocabulary below.
6. Use semantic HTML5: <main>, <section>, <article>, <header>, <footer>, <nav>, <aside>.

### CSS Vocabulary
${vocab}
`.trim();
}
export const EXAMPLE_HTML = `
### Correct Structure
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
    <h1 class="heading-xl">Title</h1>
    <div class="card">
      <div class="card-header heading-md">Section</div>
      <div class="card-body prose">
        <p>Paragraph text here.</p>
      </div>
    </div>
  </main>
</body>
</html>
\`\`\`
`.trim();
