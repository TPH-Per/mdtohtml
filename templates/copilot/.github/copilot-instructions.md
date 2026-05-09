# HTML Output Contract

For all HTML generation tasks in this repository:

## Rules
- Always add `<link rel="stylesheet" href="./styles.css">` to `<head>`
- Never use inline `style=""` attributes
- Never add `<style>` tags
- Use only the CSS class vocabulary below

## CSS Classes

Layout: container, stack, stack-sm, stack-lg, cluster, sidebar, grid-2, grid-3, grid-4
Typography: prose, heading-xl, heading-lg, heading-md, heading-sm, text-muted, text-mono, code-inline, code-block, blockquote, label
Components: card, card-header, card-body, card-footer, data-table, data-table-striped
Badges: badge, badge-primary, badge-success, badge-warning, badge-error, badge-neutral
Callouts: callout, callout-info, callout-warning, callout-error, callout-success, callout-tip
Dividers: divider, divider-dashed
Utilities: mt-auto, text-right, text-center, truncate, visually-hidden
