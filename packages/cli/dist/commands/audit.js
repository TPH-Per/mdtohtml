import fs from 'fs/promises';
import path from 'path';
import { countTokens, validateHTML, loadContract, compareTokens } from '@llm-html-kit/core';
import { resolveStylesheetPath } from '../utils/resolve-stylesheet.js';
import { loadConfig } from '../utils/config-loader.js';
import Table from 'cli-table3';
import chalk from 'chalk';
import ora from 'ora';
export async function auditCommand(file, options) {
    const spinner = ora(`Auditing ${file}...`).start();
    try {
        const config = await loadConfig(options.config);
        const html = await fs.readFile(file, 'utf-8');
        const tokens = await countTokens(html);
        let validationResult = null;
        const shouldValidate = options.validate ?? config.validation !== undefined;
        if (shouldValidate) {
            spinner.text = 'Validating against CSS contract...';
            let cssPath;
            try {
                cssPath = config.stylesheet
                    ? path.resolve(process.cwd(), config.stylesheet)
                    : await resolveStylesheetPath();
            }
            catch (e) {
                spinner.fail(`Failed to locate CSS contract: ${e.message}`);
                process.exit(1);
            }
            const contract = await loadContract(cssPath);
            validationResult = await validateHTML(html, contract, {
                noInlineStyles: config.validation?.noInlineStyles ?? true,
                requireLinkTag: config.validation?.requireLinkTag ?? true,
                allowedClasses: config.validation?.allowedClasses ?? 'auto',
                noTailwindClasses: config.validation?.noTailwindClasses ?? false,
            });
        }
        spinner.stop();
        if (options.format === 'json') {
            const output = { tokens };
            if (validationResult)
                output.validation = validationResult;
            if (options.compare) {
                const beforeHtml = await fs.readFile(options.compare, 'utf-8');
                output.diff = await compareTokens(beforeHtml, html);
            }
            console.log(JSON.stringify(output, null, 2));
        }
        else {
            const table = new Table({
                head: [chalk.cyan('Metric'), chalk.cyan('Value')],
                colWidths: [25, 35]
            });
            table.push(['Total tokens', tokens.raw.toLocaleString()], ['Structure tokens', tokens.structure.toLocaleString()], ['Style tokens', chalk.yellow(`${tokens.style.toLocaleString()} (eliminable)`)], ['Savings if external', chalk.green(tokens.savings.toLocaleString())]);
            console.log(chalk.bold(`\nToken Audit: ${file}`));
            console.log(table.toString());
            if (options.compare) {
                const beforeHtml = await fs.readFile(options.compare, 'utf-8');
                const diff = await compareTokens(beforeHtml, html);
                console.log(chalk.bold(`\nComparison vs ${options.compare}:`));
                console.log(`  Savings: ${chalk.green(diff.savingsTokens.toLocaleString())} tokens (${chalk.bold(diff.savingsPercent)}%)`);
            }
            if (validationResult) {
                console.log(`\nValidation: ${validationResult.passed ? chalk.green('PASSED ✅') : chalk.red('FAILED ❌')}`);
                if (validationResult.errors.length > 0) {
                    console.log(chalk.red('\nErrors:'));
                    validationResult.errors.forEach(e => {
                        console.log(chalk.red(`  - [${e.type}] Line ${e.line}, Col ${e.column}: ${e.message}`));
                        if (e.snippet)
                            console.log(chalk.gray(`    Snippet: ${e.snippet}`));
                    });
                }
                if (validationResult.warnings.length > 0) {
                    console.log(chalk.yellow('\nWarnings:'));
                    validationResult.warnings.forEach(w => console.log(chalk.yellow(`  - ${w.message}`)));
                }
            }
        }
        if (shouldValidate && validationResult && !validationResult.passed) {
            process.exit(1);
        }
    }
    catch (error) {
        spinner.fail(`Audit failed: ${error.message}`);
        process.exit(1);
    }
}
