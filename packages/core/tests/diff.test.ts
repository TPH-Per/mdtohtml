import { describe, it, expect } from 'vitest';
import { formatDiffReport } from '../src/diff';
import { compareTokens } from '../src/tokenizer';

const HTML_WITH_STYLE = `<!DOCTYPE html><html><head>
<style>.x{color:red}</style>
</head><body><div class="card">Hello</div></body></html>`;

const HTML_WITHOUT_STYLE = `<!DOCTYPE html><html><head>
<link rel="stylesheet" href="./styles.css">
</head><body><div class="card">Hello</div></body></html>`;

describe('TokenDiff reporter', () => {
  it('should format diff as table string', async () => {
    const diff = await compareTokens(HTML_WITH_STYLE, HTML_WITHOUT_STYLE);
    const report = formatDiffReport(diff);
    expect(report).toContain('Structure tokens');
    expect(report).toContain('Style tokens');
    expect(report).toContain('%');
  });
});
