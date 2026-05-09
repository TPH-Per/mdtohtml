## HTML Output Contract
When this project requires HTML generation, follow the contract in `llm-html.config.ts`.
1. Always include `<link rel="stylesheet" href="./styles.css">` in `<head>`.
2. Never write inline `style=""` attributes or `<style>` blocks.
3. Use only the CSS classes documented below.
