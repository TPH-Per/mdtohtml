import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, access } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { execa } from 'execa';

const CLI_BIN = join(__dirname, '../dist/cli.js');

async function exists(p: string) {
  try { await access(p); return true; } catch { return false; }
}

describe('llm-html init', () => {
  let tmpDir: string;
  beforeEach(async () => { tmpDir = await mkdtemp(join(tmpdir(), 'init-test-')); });
  afterEach(async () => { await rm(tmpDir, { recursive: true, force: true }); });

  it('creates llm-html.config.ts', async () => {
    await execa('node', [CLI_BIN, 'init', '--provider', 'claude'], { cwd: tmpDir });
    expect(await exists(join(tmpDir, 'llm-html.config.ts'))).toBe(true);
  });

  it('creates CLAUDE.md with real CSS classes in vocabulary', async () => {
    await execa('node', [CLI_BIN, 'init', '--provider', 'claude'], { cwd: tmpDir });
    const content = await readFile(join(tmpDir, 'CLAUDE.md'), 'utf-8');
    expect(content).toContain('HTML Output Contract');
    expect(content).toContain('<link rel="stylesheet"');
    // Must have actual classes — not placeholder
    expect(content).toMatch(/card|callout|prose|heading/);
  });

  it('appends to existing CLAUDE.md without losing existing content', async () => {
    const existingPath = join(tmpDir, 'CLAUDE.md');
    await import('fs/promises').then(f => f.writeFile(existingPath, '# My Project\n\nExisting content here.\n'));
    await execa('node', [CLI_BIN, 'init', '--provider', 'claude'], { cwd: tmpDir });
    const content = await readFile(existingPath, 'utf-8');
    expect(content).toContain('Existing content here.');
    expect(content).toContain('HTML Output Contract');
  });

  it('creates GEMINI.md for gemini provider', async () => {
    await execa('node', [CLI_BIN, 'init', '--provider', 'gemini'], { cwd: tmpDir });
    expect(await exists(join(tmpDir, 'GEMINI.md'))).toBe(true);
    const content = await readFile(join(tmpDir, 'GEMINI.md'), 'utf-8');
    expect(content).toContain('HTML Output Contract');
  });

  it('creates .github/copilot-instructions.md for copilot provider', async () => {
    await execa('node', [CLI_BIN, 'init', '--provider', 'copilot'], { cwd: tmpDir });
    const filePath = join(tmpDir, '.github', 'copilot-instructions.md');
    expect(await exists(filePath)).toBe(true);
    const content = await readFile(filePath, 'utf-8');
    expect(content).toMatch(/^#/m);
    expect(content).toContain('```html');
  });

  it('copies styles.css to output directory', async () => {
    await execa('node', [CLI_BIN, 'init', '--provider', 'claude', '--output-dir', './out'],
      { cwd: tmpDir });
    expect(await exists(join(tmpDir, 'out', 'styles.css'))).toBe(true);
  });

  it('fails with exit 1 if config already exists and no --force', async () => {
    await execa('node', [CLI_BIN, 'init', '--provider', 'claude'], { cwd: tmpDir });
    const { exitCode } = await execa(
      'node', [CLI_BIN, 'init', '--provider', 'claude'], { cwd: tmpDir, reject: false }
    );
    expect(exitCode).toBe(1);
  });

  it('overwrites with --force flag', async () => {
    await execa('node', [CLI_BIN, 'init', '--provider', 'claude'], { cwd: tmpDir });
    const { exitCode } = await execa(
      'node', [CLI_BIN, 'init', '--provider', 'claude', '--force'],
      { cwd: tmpDir, reject: false }
    );
    expect(exitCode).toBe(0);
  });
});
