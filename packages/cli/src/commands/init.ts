import fs from 'fs/promises';
import path from 'path';
import {
  loadContract,
  vocabularyToPromptFragment,
} from '@llm-html-kit/core';
import {
  buildClaudeSystemPrompt,
  buildGeminiSystemPrompt,
  buildCopilotInstructions,
} from '@llm-html-kit/prompt-builder';

const CONFIG_TEMPLATE = (provider: string, outputDir: string) => `import { defineConfig } from 'llm-html-kit';

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

async function resolveStylesheetPath(): Promise<string> {
  // Try local node_modules first
  const localPath = path.resolve(
    process.cwd(),
    'node_modules/@llm-html-kit/stylesheet/dist/styles.css'
  );
  try {
    await fs.access(localPath);
    return localPath;
  } catch {}
  // Try global npm
  try {
    return require.resolve('@llm-html-kit/stylesheet/dist/styles.css');
  } catch {}
  
  // Try monorepo local resolution (for dev/testing)
  const monorepoPath = path.resolve(
    __dirname,
    '../../../stylesheet/dist/styles.css'
  );
  try {
    await fs.access(monorepoPath);
    return monorepoPath;
  } catch {}

  throw new Error(
    'Cannot find @llm-html-kit/stylesheet/dist/styles.css.\\n' +
    'Run: pnpm turbo build   (in monorepo)\\n' +
    '  or: npm install -g llm-html-kit   (global install)'
  );
}

export async function initCommand(options: {
  provider: 'claude' | 'gemini' | 'copilot';
  outputDir: string;
  force?: boolean;
}) {
  const { provider, outputDir, force } = options;
  const cwd = process.cwd();

  // 1. Check if config already exists
  const configPath = path.join(cwd, 'llm-html.config.ts');
  if (!force) {
    try {
      await fs.access(configPath);
      console.error(
        '✗ llm-html.config.ts already exists. Use --force to overwrite.'
      );
      process.exit(1);
    } catch {}
  }

  // 2. Resolve stylesheet
  let stylesheetPath: string;
  try {
    stylesheetPath = await resolveStylesheetPath();
  } catch (err: any) {
    console.error('✗ ' + err.message);
    process.exit(1);
  }

  // 3. Load contract
  const contract = await loadContract(stylesheetPath);
  const classCount = contract.classes.length;

  // 4. Build instruction content
  let instructionContent: string;
  let instructionFile: string;

  if (provider === 'claude') {
    instructionContent = '\\n---\\n' + buildClaudeSystemPrompt(contract, {
      maxVocabularyTokens: 600,
      includeExample: true,
    }) + '\\n';
    instructionFile = path.join(cwd, 'CLAUDE.md');
  } else if (provider === 'gemini') {
    instructionContent = '\\n---\\n' + buildGeminiSystemPrompt(contract, {
      maxVocabularyTokens: 600,
      includeExample: true,
    }) + '\\n';
    instructionFile = path.join(cwd, 'GEMINI.md');
  } else {
    instructionContent = buildCopilotInstructions(contract, {
      maxVocabularyTokens: 600,
      includeExample: true,
    });
    instructionFile = path.join(cwd, '.github', 'copilot-instructions.md');
    await fs.mkdir(path.join(cwd, '.github'), { recursive: true });
  }

  // 5. Write config
  await fs.writeFile(configPath, CONFIG_TEMPLATE(provider, outputDir));

  // 6. Write/append instruction file
  let instructionAction: string;
  if (provider === 'copilot') {
    await fs.writeFile(instructionFile, instructionContent);
    instructionAction = 'Created';
  } else {
    try {
      const existing = await fs.readFile(instructionFile, 'utf-8');
      await fs.writeFile(instructionFile, existing + instructionContent);
      instructionAction = 'Appended to';
    } catch {
      await fs.writeFile(instructionFile, instructionContent);
      instructionAction = 'Created';
    }
  }

  // 7. Copy styles.css to outputDir
  await fs.mkdir(path.join(cwd, outputDir), { recursive: true });
  const destCssPath = path.join(cwd, outputDir, 'styles.css');
  await fs.copyFile(stylesheetPath, destCssPath);

  // 8. Print summary
  const instrTokens = Math.round(instructionContent.length / 4);
  const relInstructionFile = path.relative(cwd, instructionFile);
  const relDestCss = path.relative(cwd, destCssPath);

  console.log('');
  console.log('  ✓ Created llm-html.config.ts');
  console.log(`  ✓ ${instructionAction} ${relInstructionFile} (~${instrTokens} tokens)`);
  console.log(`  ✓ Copied styles.css → ${relDestCss}`);
  console.log(`  ✓ ${classCount} CSS classes in contract (checksum: ${contract.checksum.slice(0, 8)})`);
  console.log('');

  const nextCmd = provider === 'claude'
    ? 'Use Claude Code: "Generate output/report.html as an HTML report"'
    : provider === 'gemini'
    ? 'Use Gemini CLI: gemini "Generate output/report.html as an HTML report"'
    : 'Use Copilot: gh copilot suggest "Generate output/report.html"';
  console.log(`  Next: ${nextCmd}`);
  console.log(`  Then: llm-html audit output/report.html --validate`);
  console.log('');
}
