## HTML Output Contract

When generating HTML documents, follow these strict rules:

1. Always include this exact link tag in the <head>:
   `<link rel="stylesheet" href="./styles.css">`
2. Never write inline styles. Do not use `style=""` attributes or `<style>` blocks.
3. Use only the pre-defined CSS classes.

### Available CSS Classes

Layout: container, stack, stack-sm, stack-lg, cluster, sidebar, grid-2, grid-3, grid-4
Typography: prose, heading-xl, heading-lg, heading-md, heading-sm, text-muted, text-mono, code-inline, code-block, blockquote, label
Components: card, card-header, card-body, card-footer, data-table, data-table-striped
Badges: badge, badge-primary, badge-success, badge-warning, badge-error, badge-neutral
Callouts: callout, callout-info, callout-warning, callout-error, callout-success, callout-tip
Dividers: divider, divider-dashed
Utilities: mt-auto, text-right, text-center, truncate, visually-hidden
