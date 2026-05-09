import { defineConfig } from 'llm-html-kit';

export default defineConfig({
  stylesheet: './node_modules/llm-html-kit/dist/styles.css',
  outputDir: './output',
  provider: 'copilot',
  tokenBudget: 8000,
  validation: {
    noInlineStyles: true,
    requireLinkTag: true,
    allowedClasses: 'auto',
  },
});
