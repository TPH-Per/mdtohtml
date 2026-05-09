import fs from 'fs/promises';
import path from 'path';
import { countTokens, validateHTML, loadContract, compareTokens } from '@llm-html-kit/core';

export async function auditCommand(file: string, options: { format: string; validate?: boolean; compare?: string }) {
  try {
    const html = await fs.readFile(file, 'utf-8');
    const tokens = await countTokens(html);
    
    let validationResult = null;

    if (options.validate) {
      // Find stylesheet
      const cssPath = path.resolve(__dirname, '../../../stylesheet/dist/styles.css');
      let contract;
      try {
        contract = await loadContract(cssPath);
      } catch (e) {
        console.error('Failed to load CSS contract for validation:', e);
        process.exit(1);
      }

      validationResult = await validateHTML(html, contract, {
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
┌─────────────────────────────────────────────────────────┐
│  Token Audit: ${file}
├──────────────────────┬──────────────────────────────────┤
│  Total tokens        │  ${tokens.raw}
│  Structure tokens    │  ${tokens.structure}
│  Style tokens        │  ${tokens.style}  ← eliminable
│  Savings if external │  ${tokens.savings}
└─────────────────────────────────────────────────────────┘
      `);

      if (options.compare) {
        const beforeHtml = await fs.readFile(options.compare, 'utf-8');
        const diff = await compareTokens(beforeHtml, html);
        console.log(`
Comparison vs ${options.compare}:
Savings: ${diff.savingsTokens} tokens (${diff.savingsPercent}%)
`);
      }

      if (validationResult) {
        console.log(`\nValidation: ${validationResult.passed ? 'PASSED ✅' : 'FAILED ❌'}`);
        validationResult.errors.forEach(e => console.log(`- [ERROR] Line ${e.line}, Col ${e.column}: ${e.message} (${e.type})`));
        validationResult.warnings.forEach(w => console.log(`- [WARN] ${w.message}`));
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
