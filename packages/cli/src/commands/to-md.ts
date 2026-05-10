import fs from 'fs/promises';
import path from 'path';
import TurndownService from 'turndown';
import { countTokens } from '@llm-html-kit/core';
import { loadConfig } from '../utils/config-loader.js';
import chalk from 'chalk';
import ora from 'ora';

export async function toMdCommand(
  file: string,
  options: { output?: string; quiet?: boolean; config?: string }
) {
  const spinner = ora(`Converting ${file} to Markdown...`).start();
  
  try {
    const config = await loadConfig(options.config);
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
    
    spinner.succeed(chalk.green(`Converted to ${path.relative(process.cwd(), outputPath)}`));

    if (!options.quiet) {
      const [htmlTokens, mdTokens] = await Promise.all([
        countTokens(html),
        countTokens(markdown),
      ]);
      const reduction = htmlTokens.raw > 0
        ? Math.round((1 - mdTokens.raw / htmlTokens.raw) * 100)
        : 0;

      console.log('');
      console.log(`    HTML:      ${chalk.cyan(htmlTokens.raw.toLocaleString())} tokens`);
      console.log(`    Markdown:  ${chalk.green(mdTokens.raw.toLocaleString())} tokens`);
      console.log(`    Reduction: ${chalk.bold(reduction)}%`);
      console.log('');
    }
  } catch (error: any) {
    spinner.fail(chalk.red(`Conversion failed: ${error.message}`));
    process.exit(1);
  }
}
