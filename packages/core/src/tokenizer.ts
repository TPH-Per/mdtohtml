import { get_encoding } from '@dqbd/tiktoken';

export interface TokenCount {
  raw: number;
  structure: number;
  style: number;
  savings: number;
}

// Singleton — one encoder per process lifetime
let _enc: ReturnType<typeof get_encoding> | null = null;

function encoder() {
  if (!_enc) {
    _enc = get_encoding('cl100k_base');
    // Free WASM memory when Node exits
    process.on('exit', () => { _enc?.free(); });
  }
  return _enc;
}

function countWithTiktoken(s: string): number {
  return encoder().encode(s).length;
}

/**
 * @param html     Raw HTML string to analyze
 * @param encoding 'cl100k_base' (OpenAI/Anthropic), 'gemini' (char-based estimate)
 */
export async function countTokens(
  html: string,
  encoding: 'cl100k_base' | 'gemini' = 'cl100k_base'
): Promise<TokenCount> {
  const count = encoding === 'gemini'
    ? (s: string) => Math.ceil(s.length / 4)
    : countWithTiktoken;

  const raw = count(html);

  // Collect all style noise: <style>...</style> and style="..." attributes
  let styleTokens = 0;
  const styleBlockRE = /<style[^>]*>[\s\S]*?<\/style>/gi;
  const styleAttrRE  = / style\s*=\s*(?:"[^"]*"|'[^']*')/gi;

  for (const m of html.matchAll(styleBlockRE)) styleTokens += count(m[0]);
  for (const m of html.matchAll(styleAttrRE))  styleTokens += count(m[0]);

  const structure = Math.max(0, raw - styleTokens);
  return { raw, structure, style: styleTokens, savings: styleTokens };
}

export interface TokenDiff {
  before: TokenCount;
  after: TokenCount;
  savingsTokens: number;
  savingsPercent: number;
}

export async function compareTokens(
  beforeHtml: string,
  afterHtml: string,
  encoding: 'cl100k_base' | 'gemini' = 'cl100k_base'
): Promise<TokenDiff> {
  const [b, a] = await Promise.all([
    countTokens(beforeHtml, encoding),
    countTokens(afterHtml, encoding),
  ]);
  const saved = b.raw - a.raw;
  return {
    before: b,
    after: a,
    savingsTokens: saved,
    savingsPercent: b.raw > 0 ? Math.round((saved / b.raw) * 100) : 0,
  };
}
