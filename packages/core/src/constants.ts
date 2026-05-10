export const STYLE_BLOCK_RE = /<style[^>]*>[\s\S]*?<\/style>/gi;
export const STYLE_ATTR_RE = / style\s*=\s*(?:"[^"]*"|'[^']*')/gi;
export const LINK_TAG_RE = /<link\s+rel="stylesheet"\s+href="([^"]+)"/i;

// Tailwind pattern: short utility classes like "text-sm", "px-4", "bg-blue-500"
export const TAILWIND_RE = /^(text|bg|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|w|h|flex|grid|gap|rounded|shadow|border|ring|opacity|font|leading|tracking|z|top|right|bottom|left|inset|overflow|cursor|pointer|select|resize|appearance|outline|sr)-/;

export const CATEGORY_PATTERNS = {
  Layout: /^(container|stack|cluster|sidebar|grid)/,
  Typography: /^(prose|heading|text|code|blockquote|label)/,
  Components: /^(card|data-table)/,
  Badges: /^badge/,
  Callouts: /^callout/,
  Dividers: /^divider/,
};
