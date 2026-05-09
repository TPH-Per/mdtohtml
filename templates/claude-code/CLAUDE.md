## HTML Output Contract

When this project requires HTML generation, follow the contract in `llm-html.config.ts`.

1. Always include `<link rel="stylesheet" href="./styles.css">` in `<head>`.
2. Never write inline `style=""` attributes or `<style>` blocks.
3. Use only the CSS classes documented below.

### Available CSS Classes

Layout: container, stack, stack-sm, stack-lg, cluster, sidebar, grid-2, grid-3, grid-4
Typography: prose, heading-xl, heading-lg, heading-md, heading-sm, text-muted, text-mono, code-inline, code-block, blockquote, label
Components: card, card-header, card-body, card-footer, data-table, data-table-striped
Badges: badge, badge-primary, badge-success, badge-warning, badge-error, badge-neutral
Callouts: callout, callout-info, callout-warning, callout-error, callout-success, callout-tip
Dividers: divider, divider-dashed
Utilities: mt-auto, text-right, text-center, truncate, visually-hidden

### Workflow

After generating HTML, run: `llm-html audit <file.html>`
If validation fails, fix errors before proceeding.
