import fs from 'fs/promises';
import path from 'path';
import { countTokens, validateHTML, loadContract, compareTokens } from '@llm-html-kit/core';
import { resolveStylesheetPath } from '../utils/resolve-stylesheet.js';

export async function auditCommand(
  file: string,
  options: { format: string; validate?: boolean; compare?: string }
) {
  try {
    const html = await fs.readFile(file, 'utf-8');
    const tokens = await countTokens(html);

    let validationResult = null;

    if (options.validate) {
      // Resolve stylesheet via shared util (works local, global, and monorepo)
      let cssPath: string;
      try {
        cssPath = await resolveStylesheetPath();
      } catch (e: any) {
        console.error('Failed to locate CSS contract:', e.message);
        process.exit(1);
      }

      let contract;
      try {
        contract = await loadContract(cssPath!);
      } catch (e) {
        console.error('Failed to load CSS contract for validation:', e);
        process.exit(1);
      }

      validationResult = await validateHTML(html, contract!, {
        noInlineStyles: true,
        requireLinkTag: true,
        allowedClasses: 'auto',
      });
    }

    if (options.format === 'json') {
      const output: any = { tokens };
      if (validationResult) {
        output.validation = validationResult;
      }
      if (options.compare) {
        const beforeHtml = await fs.readFile(options.compare, 'utf-8');
        output.diff = await compareTokens(beforeHtml, html);
      }
      console.log(JSON.stringify(output, null, 2));
    } else {
      console.log(`
\u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510
\u2502  Token Audit: ${file}
\u251c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524
\u2502  Total tokens        \u2502  ${tokens.raw.toLocaleString().padEnd(32)}\u2502
\u2502  Structure tokens    \u2502  ${tokens.structure.toLocaleString().padEnd(32)}\u2502
\u2502  Style tokens        \u2502  ${tokens.style.toLocaleString().padEnd(24)} \u2190 eliminable\u2502
\u2502  Savings if external \u2502  ${tokens.savings.toLocaleString().padEnd(32)}\u2502
\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518
      `);

      if (options.compare) {
        const beforeHtml = await fs.readFile(options.compare, 'utf-8');
        const diff = await compareTokens(beforeHtml, html);
        console.log(`\nComparison vs ${options.compare}:`);
        console.log(`  Savings: ${diff.savingsTokens.toLocaleString()} tokens (${diff.savingsPercent}%)`);
      }

      if (validationResult) {
        console.log(`\nValidation: ${validationResult.passed ? 'PASSED \u2705' : 'FAILED \u274c'}`);
        validationResult.errors.forEach(e =>
          console.log(`  - [ERROR] Line ${e.line}, Col ${e.column}: ${e.message} (${e.type})`)
        );
        validationResult.warnings.forEach(w =>
          console.log(`  - [WARN]  ${w.message}`)
        );
      }
    }

    if (options.validate && validationResult && !validationResult.passed) {
      process.exit(1);
    }
  } catch (error: any) {
    console.error(`Failed to audit ${file}: ${error.message}`);
    process.exit(1);
  }
}
