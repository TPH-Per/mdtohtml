import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { execa } from 'execa';

const CLI_BIN = join(__dirname, '../dist/index.js');

async function writeTmpHtml(dir: string, name: string, content: string) {
  // Ensure styles.css exists alongside HTML
  const cssPath = join(dir, 'styles.css');
  try { await import('fs/promises').then(f => f.access(cssPath)); }
  catch { await writeFile(cssPath, '/* mock */'); }
  const filePath = join(dir, name);
  await writeFile(filePath, content);
  return filePath;
}

const CLEAN_HTML = `<!DOCTYPE html>
<html lang="en"><head>
<link rel="stylesheet" href="./styles.css">
</head><body>
<main class="container stack">
<div class="card"><div class="card-body prose"><p>Clean content.</p></div></div>
</main></body></html>`;

const DIRTY_HTML = `<!DOCTYPE html>
<html lang="en"><head>
<link rel="stylesheet" href="./styles.css">
</head><body>
<div style="color: red; padding: 8px;">Inline style here</div>
</body></html>`;

const NO_LINK_HTML = `<!DOCTYPE html>
<html><head></head><body><p>No link tag</p></body></html>`;

describe('llm-html audit', () => {
  let tmpDir: string;
  beforeEach(async () => { tmpDir = await mkdtemp(join(tmpdir(), 'audit-test-')); });
  afterEach(async () => { await rm(tmpDir, { recursive: true, force: true }); });

  it('outputs valid JSON with token counts', async () => {
    const f = await writeTmpHtml(tmpDir, 'test.html', CLEAN_HTML);
    const { stdout } = await execa('node', [CLI_BIN, 'audit', f, '--format', 'json']);
    const result = JSON.parse(stdout);
    expect(result.tokens.raw).toBeGreaterThan(0);
    expect(result.tokens.structure).toBeGreaterThan(0);
    expect(typeof result.tokens.style).toBe('number');
  });

  it('style token = 0 for HTML with external CSS only', async () => {
    const f = await writeTmpHtml(tmpDir, 'clean.html', CLEAN_HTML);
    const { stdout } = await execa('node', [CLI_BIN, 'audit', f, '--format', 'json']);
    expect(JSON.parse(stdout).tokens.style).toBe(0);
  });

  it('exits 0 for clean HTML with --validate', async () => {
    const f = await writeTmpHtml(tmpDir, 'clean.html', CLEAN_HTML);
    const { exitCode } = await execa(
      'node', [CLI_BIN, 'audit', f, '--validate'], { reject: false }
    );
    expect(exitCode).toBe(0);
  });

  it('exits 1 for HTML with inline styles when --validate', async () => {
    const f = await writeTmpHtml(tmpDir, 'dirty.html', DIRTY_HTML);
    const { exitCode } = await execa(
      'node', [CLI_BIN, 'audit', f, '--validate'], { reject: false }
    );
    expect(exitCode).toBe(1);
  });

  it('JSON includes validation errors on --validate', async () => {
    const f = await writeTmpHtml(tmpDir, 'dirty.html', DIRTY_HTML);
    const { stdout } = await execa(
      'node', [CLI_BIN, 'audit', f, '--format', 'json', '--validate'], { reject: false }
    );
    const result = JSON.parse(stdout);
    expect(result.validation).toBeDefined();
    expect(result.validation.passed).toBe(false);
    expect(result.validation.errors.length).toBeGreaterThan(0);
  });

  it('inline style error includes correct line number', async () => {
    const f = await writeTmpHtml(tmpDir, 'dirty.html', DIRTY_HTML);
    const { stdout } = await execa(
      'node', [CLI_BIN, 'audit', f, '--format', 'json', '--validate'], { reject: false }
    );
    const result = JSON.parse(stdout);
    const err = result.validation.errors.find((e: any) => e.type === 'inline-style');
    expect(err.line).toBeGreaterThan(1); // Not 1 — should be actual line
  });

  it('exits 1 for missing stylesheet link when --validate', async () => {
    const f = await writeTmpHtml(tmpDir, 'nolink.html', NO_LINK_HTML);
    const { exitCode } = await execa(
      'node', [CLI_BIN, 'audit', f, '--validate'], { reject: false }
    );
    expect(exitCode).toBe(1);
  });
});
