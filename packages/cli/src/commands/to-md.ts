import fs from 'fs/promises';
import path from 'path';
import TurndownService from 'turndown';
import { countTokens } from '@llm-html-kit/core';

export async function toMdCommand(
  file: string,
  options: { output?: string; quiet?: boolean }
) {
  const html = await fs.readFile(file, 'utf-8');

  // Strip presentational noise before conversion
  const cleaned = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<link[^>]*/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
  });

  const markdown = td.turndown(cleaned);

  const outputPath = options.output
    ?? file.replace(/\.html?$/, '.md');

  await fs.writeFile(outputPath, markdown, 'utf-8');

  if (!options.quiet) {
    const [htmlTokens, mdTokens] = await Promise.all([
      countTokens(html),
      countTokens(markdown),
    ]);
    const reduction = htmlTokens.raw > 0
      ? Math.round((1 - mdTokens.raw / htmlTokens.raw) * 100)
      : 0;

    console.log('');
    console.log(`  ✓ Converted to ${path.relative(process.cwd(), outputPath)}`);
    console.log(`    HTML:     ${htmlTokens.raw.toLocaleString()} tokens`);
    console.log(`    Markdown: ${mdTokens.raw.toLocaleString()} tokens`);
    console.log(`    Reduction: ${reduction}%`);
    console.log('');
  }
}
