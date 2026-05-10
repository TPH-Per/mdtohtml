#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { auditCommand } from './commands/audit.js';
import { serveCommand } from './commands/serve.js';
import { exportCommand } from './commands/export.js';
import { toMdCommand } from './commands/to-md.js';
const program = new Command();
program
    .name('llm-html')
    .description('HTML contract, validation, and preview toolkit for AI agent CLIs')
    .version('0.2.0');
program
    .command('init')
    .description('Inject HTML contract into Claude / Gemini / Copilot instruction files')
    .option('-p, --provider <p>', 'claude | gemini | copilot', 'claude')
    .option('-o, --output-dir <dir>', 'Output directory for generated HTML', './output')
    .option('--force', 'Overwrite existing config')
    .action(initCommand);
program
    .command('audit <file>')
    .description('Token audit and HTML contract validation')
    .option('-f, --format <fmt>', 'table | json', 'table')
    .option('--validate', 'Validate against CSS contract (exit 1 on errors)')
    .option('--compare <before>', 'Compare token count against a previous file')
    .option('-c, --config <path>', 'Path to config file')
    .action(auditCommand);
program
    .command('serve')
    .description('Local preview server with live reload')
    .option('-d, --dir <dir>', 'Directory to serve', './output')
    .option('-p, --port <port>', 'Port', parseInt, 3000)
    .option('-c, --config <path>', 'Path to config file')
    .action(serveCommand);
program
    .command('export <file>')
    .description('Bundle HTML + CSS into a single standalone file')
    .option('-o, --output <out>', 'Output file path')
    .option('-c, --config <path>', 'Path to config file')
    .action(exportCommand);
program
    .command('to-md <file>')
    .description('Convert HTML to clean Markdown (for RAG / archival)')
    .option('-o, --output <out>', 'Output .md file path')
    .option('--quiet', 'Suppress token stats output')
    .option('-c, --config <path>', 'Path to config file')
    .action(toMdCommand);
program.parse();
