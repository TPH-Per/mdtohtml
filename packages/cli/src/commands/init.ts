import fs from 'fs/promises';
import path from 'path';

export async function initCommand(options: { provider: string; outputDir: string }) {
  console.log(`Initializing llm-html-kit for provider: ${options.provider}`);

  // Create llm-html.config.ts
  const configContent = `import { defineConfig } from 'llm-html-kit';

export default defineConfig({
  stylesheet: './node_modules/llm-html-kit/dist/styles.css',
  outputDir: '${options.outputDir}',
  provider: '${options.provider}',
  tokenBudget: 8000,
  validation: {
    noInlineStyles: true,
    requireLinkTag: true,
    allowedClasses: 'auto',
  },
});
`;

  await fs.writeFile('llm-html.config.ts', configContent);
  console.log('Created llm-html.config.ts');

  // Create platform-specific agent instruction file
  if (options.provider === 'claude') {
    const claudeMd = `## HTML Output Contract
When this project requires HTML generation, follow the contract in \`llm-html.config.ts\`.
1. Always include \`<link rel="stylesheet" href="./styles.css">\` in \`<head>\`.
2. Never write inline \`style=""\` attributes or \`<style>\` blocks.
3. Use only the CSS classes documented below.
`;
    await fs.writeFile('CLAUDE.md', claudeMd, { flag: 'a' });
    console.log('Appended to CLAUDE.md');
  } else if (options.provider === 'gemini') {
    const geminiMd = `## HTML Output Contract
When this project requires HTML generation, follow the contract in \`llm-html.config.ts\`.
1. Always include \`<link rel="stylesheet" href="./styles.css">\` in \`<head>\`.
2. Never write inline \`style=""\` attributes or \`<style>\` blocks.
`;
    await fs.writeFile('GEMINI.md', geminiMd, { flag: 'a' });
    console.log('Appended to GEMINI.md');
  } else if (options.provider === 'copilot') {
    await fs.mkdir('.github', { recursive: true });
    const copilotMd = `# HTML Output Contract
For all HTML generation tasks in this repository:
- Always add \`<link rel="stylesheet" href="./styles.css">\` to \`<head>\`
- Never use inline \`style=""\` attributes
- Never add \`<style>\` tags
`;
    await fs.writeFile('.github/copilot-instructions.md', copilotMd);
    console.log('Created .github/copilot-instructions.md');
  }
}
