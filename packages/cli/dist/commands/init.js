import fs from 'fs/promises';
import path from 'path';
import { loadContract, } from '@llm-html-kit/core';
import { buildClaudeSystemPrompt, buildGeminiSystemPrompt, buildCopilotInstructions, } from '@llm-html-kit/prompt-builder';
import { resolveStylesheetPath } from '../utils/resolve-stylesheet.js';
import chalk from 'chalk';
import ora from 'ora';
const CONFIG_TEMPLATE = (provider, outputDir) => `import { defineConfig } from 'llm-html-kit';

export default defineConfig({
  stylesheet: './node_modules/@llm-html-kit/stylesheet/dist/styles.css',
  outputDir: '${outputDir}',
  provider: '${provider}',
  tokenBudget: 8000,
  validation: {
    noInlineStyles: true,
    requireLinkTag: true,
    allowedClasses: 'auto',
  },
});
`;
export async function initCommand(options) {
    const { provider, outputDir, force } = options;
    const cwd = process.cwd();
    const spinner = ora('Initializing llm-html-kit...').start();
    try {
        // 1. Check if config already exists
        const configPath = path.join(cwd, 'llm-html.config.ts');
        if (!force) {
            try {
                await fs.access(configPath);
                spinner.fail(chalk.red('llm-html.config.ts already exists. Use --force to overwrite.'));
                process.exit(1);
            }
            catch { }
        }
        // 2. Resolve stylesheet
        spinner.text = 'Resolving CSS contract...';
        let stylesheetPath;
        try {
            stylesheetPath = await resolveStylesheetPath();
        }
        catch (err) {
            spinner.fail(chalk.red(err.message));
            process.exit(1);
        }
        // 3. Load contract
        const contract = await loadContract(stylesheetPath);
        const classCount = contract.classes.length;
        // 4. Build instruction content
        spinner.text = 'Generating agent instructions...';
        let instructionContent;
        let instructionFile;
        const promptOptions = {
            maxVocabularyTokens: 600,
            includeExample: true,
        };
        if (provider === 'claude') {
            instructionContent = '\n---\n' + buildClaudeSystemPrompt(contract, promptOptions) + '\n';
            instructionFile = path.join(cwd, 'CLAUDE.md');
        }
        else if (provider === 'gemini') {
            instructionContent = '\n---\n' + buildGeminiSystemPrompt(contract, promptOptions) + '\n';
            instructionFile = path.join(cwd, 'GEMINI.md');
        }
        else {
            instructionContent = buildCopilotInstructions(contract, promptOptions);
            instructionFile = path.join(cwd, '.github', 'copilot-instructions.md');
            await fs.mkdir(path.join(cwd, '.github'), { recursive: true });
        }
        // 5. Write config
        await fs.writeFile(configPath, CONFIG_TEMPLATE(provider, outputDir));
        // 6. Write/append instruction file
        let instructionAction;
        if (provider === 'copilot') {
            await fs.writeFile(instructionFile, instructionContent);
            instructionAction = 'Created';
        }
        else {
            try {
                const existing = await fs.readFile(instructionFile, 'utf-8');
                await fs.writeFile(instructionFile, existing + instructionContent);
                instructionAction = 'Appended to';
            }
            catch {
                await fs.writeFile(instructionFile, instructionContent);
                instructionAction = 'Created';
            }
        }
        // 7. Copy styles.css to outputDir
        await fs.mkdir(path.join(cwd, outputDir), { recursive: true });
        const destCssPath = path.join(cwd, outputDir, 'styles.css');
        await fs.copyFile(stylesheetPath, destCssPath);
        spinner.succeed(chalk.green('Initialization complete!'));
        // 8. Print summary
        const instrTokens = Math.round(instructionContent.length / 4);
        const relInstructionFile = path.relative(cwd, instructionFile);
        const relDestCss = path.relative(cwd, destCssPath);
        console.log('');
        console.log(`  ${chalk.cyan('✓')} Created ${chalk.bold('llm-html.config.ts')}`);
        console.log(`  ${chalk.cyan('✓')} ${instructionAction} ${chalk.bold(relInstructionFile)} (~${instrTokens} tokens)`);
        console.log(`  ${chalk.cyan('✓')} Copied styles.css → ${chalk.bold(relDestCss)}`);
        console.log(`  ${chalk.cyan('✓')} ${chalk.bold(classCount)} CSS classes in contract (checksum: ${chalk.gray(contract.checksum.slice(0, 8))})`);
        console.log('');
        const nextCmd = provider === 'claude'
            ? 'Use Claude Code: "Generate output/report.html as an HTML report"'
            : provider === 'gemini'
                ? 'Use Gemini CLI: gemini "Generate output/report.html as an HTML report"'
                : 'Use Copilot: gh copilot suggest "Generate output/report.html"';
        console.log(`  ${chalk.bold('Next steps:')}`);
        console.log(`  1. ${nextCmd}`);
        console.log(`  2. ${chalk.cyan(`llm-html audit ${outputDir}/report.html --validate`)}`);
        console.log('');
    }
    catch (error) {
        spinner.fail(chalk.red(`Initialization failed: ${error.message}`));
        process.exit(1);
    }
}
