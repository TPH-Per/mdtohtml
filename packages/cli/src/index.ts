#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { auditCommand } from './commands/audit.js';
import { generateCommand } from './commands/generate.js';
import { serveCommand } from './commands/serve.js';
import { exportCommand } from './commands/export.js';

const program = new Command();

program
  .name('llm-html')
  .description('Structured HTML Output Framework for AI Agents')
  .version('0.1.0');

program
  .command('init')
  .description('Scaffold project config for llm-html-kit')
  .option('-p, --provider <provider>', 'LLM provider: claude | gemini | copilot', 'claude')
  .option('-o, --output-dir <dir>', 'Output directory', './output')
  .action(initCommand);

program
  .command('audit <file>')
  .description('Run token audit and validation on a generated HTML file')
  .option('-f, --format <format>', 'Output format: table | json', 'table')
  .action(auditCommand);

program
  .command('generate <prompt>')
  .description('Call LLM API with user prompt')
  .option('-p, --provider <provider>', 'LLM provider')
  .option('-o, --output <output>', 'Output file')
  .option('--open', 'Launch preview')
  .action(generateCommand);

program
  .command('serve')
  .description('Local preview with live stylesheet')
  .option('-d, --dir <dir>', 'Directory to serve')
  .option('-p, --port <port>', 'Port to use', parseInt)
  .action(serveCommand);

program
  .command('export <file>')
  .description('Bundle HTML and CSS into a single file')
  .option('-o, --output <output>', 'Output file path')
  .action(exportCommand);

program.parse();
