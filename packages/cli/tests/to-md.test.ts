import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { execa } from 'execa';

const CLI_BIN = join(__dirname, '../dist/cli.js');

const SAMPLE_HTML = `<!DOCTYPE html>
<html><head>
<style>.card { background: white; border-radius: 8px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,.1); }</style>
<link rel="stylesheet" href="./styles.css">
</head><body>
<main>
  <h1>Annual Report 2025</h1>
  <p>This report covers <strong>Q1 through Q4</strong> performance.</p>
  <h2>Revenue</h2>
  <table>
    <thead><tr><th>Quarter</th><th>Revenue</th></tr></thead>
    <tbody>
      <tr><td>Q1</td><td>$1.2M</td></tr>
      <tr><td>Q2</td><td>$1.5M</td></tr>
    </tbody>
  </table>
  <h2>Summary</h2>
  <ul>
    <li>Growth: 25%</li>
    <li>New clients: 42</li>
  </ul>
</main>
</body></html>`;

describe('llm-html to-md', () => {
  let tmpDir: string;
  beforeEach(async () => { tmpDir = await mkdtemp(join(tmpdir(), 'tomd-test-')); });
  afterEach(async () => { await rm(tmpDir, { recursive: true, force: true }); });

  it('creates a .md file from .html', async () => {
    const htmlFile = join(tmpDir, 'report.html');
    await writeFile(htmlFile, SAMPLE_HTML);
    await execa('node', [CLI_BIN, 'to-md', htmlFile]);
    const mdFile = join(tmpDir, 'report.md');
    const content = await readFile(mdFile, 'utf-8');
    expect(content).toBeTruthy();
    expect(content.length).toBeGreaterThan(10);
  });

  it('output markdown is smaller in tokens than input HTML', async () => {
    const htmlFile = join(tmpDir, 'report.html');
    await writeFile(htmlFile, SAMPLE_HTML);
    const { stdout } = await execa('node', [CLI_BIN, 'to-md', htmlFile]);
    // Output includes reduction percentage
    const match = stdout.match(/Reduction: (\d+)%/);
    expect(match).not.toBeNull();
    expect(parseInt(match![1], 10)).toBeGreaterThan(0);
  });

  it('preserves headings in Markdown ATX format', async () => {
    const htmlFile = join(tmpDir, 'report.html');
    await writeFile(htmlFile, SAMPLE_HTML);
    await execa('node', [CLI_BIN, 'to-md', htmlFile]);
    const md = await readFile(join(tmpDir, 'report.md'), 'utf-8');
    expect(md).toContain('# Annual Report');
    expect(md).toContain('## Revenue');
  });

  it('strips <style> blocks from output', async () => {
    const htmlFile = join(tmpDir, 'report.html');
    await writeFile(htmlFile, SAMPLE_HTML);
    await execa('node', [CLI_BIN, 'to-md', htmlFile]);
    const md = await readFile(join(tmpDir, 'report.md'), 'utf-8');
    expect(md).not.toContain('border-radius');
    expect(md).not.toContain('box-shadow');
  });

  it('respects custom --output path', async () => {
    const htmlFile = join(tmpDir, 'report.html');
    await writeFile(htmlFile, SAMPLE_HTML);
    const outFile = join(tmpDir, 'custom-output.md');
    await execa('node', [CLI_BIN, 'to-md', htmlFile, '--output', outFile]);
    const content = await readFile(outFile, 'utf-8');
    expect(content).toBeTruthy();
  });
});
