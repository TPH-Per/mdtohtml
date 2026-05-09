import { loadContract, vocabularyToPromptFragment } from '../../core/src/contract.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const cssPath = path.resolve(__dirname, '../dist/styles.css');
  const contract = await loadContract(cssPath);
  const fragment = vocabularyToPromptFragment(contract);

  const md = [
    '# CSS Vocabulary Reference',
    '',
    '> Auto-generated from `dist/styles.css`. **Do not edit manually.**',
    '> Regenerate with: `pnpm build` inside `packages/stylesheet`',
    '',
    `Checksum: \`${contract.checksum.slice(0, 16)}\``,
    `Classes: ${contract.classes.length}`,
    '',
    '## Class Groups',
    '',
    '```',
    fragment,
    '```',
    '',
    '## Design Tokens (Custom Properties)',
    '',
    contract.customProperties.map(p => `- \`${p}\``).join('\n'),
    '',
    '## All Classes (alphabetical)',
    '',
    contract.classes.sort().map(c => `- \`${c}\``).join('\n'),
  ].join('\n');

  await fs.writeFile(path.resolve(__dirname, '../VOCABULARY.md'), md, 'utf-8');
  console.log(`✓ VOCABULARY.md updated (${contract.classes.length} classes)`);
}

main().catch(err => { console.error(err); process.exit(1); });
