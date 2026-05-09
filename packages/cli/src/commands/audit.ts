import fs from 'fs/promises';
import { countTokens } from '@llm-html-kit/core';

export async function auditCommand(file: string, options: { format: string }) {
  try {
    const html = await fs.readFile(file, 'utf-8');
    const tokens = await countTokens(html);

    if (options.format === 'json') {
      console.log(JSON.stringify(tokens, null, 2));
    } else {
      console.log(`
┌─────────────────────────────────────────────────────────┐
│  Token Audit: ${file}
├──────────────────────┬──────────────────────────────────┤
│  Total tokens        │  ${tokens.raw}
│  Structure tokens    │  ${tokens.structure}
│  Style tokens        │  ${tokens.style}  ← eliminable
│  Savings if external │  ${tokens.savings}
└─────────────────────────────────────────────────────────┘
      `);
    }
  } catch (error: any) {
    console.error(`Failed to audit ${file}: ${error.message}`);
    process.exit(1);
  }
}
