import { get_encoding } from '@dqbd/tiktoken';
import { STYLE_BLOCK_RE, STYLE_ATTR_RE } from './constants.js';
// Singleton — one encoder per process lifetime
let _enc = null;
function encoder() {
    if (!_enc) {
        _enc = get_encoding('cl100k_base');
        // Free WASM memory when Node exits
        process.on('exit', () => { _enc?.free(); });
    }
    return _enc;
}
function countWithTiktoken(s) {
    return encoder().encode(s).length;
}
/**
 * @param html     Raw HTML string to analyze
 * @param encoding 'cl100k_base' (OpenAI/Anthropic), 'gemini' (char-based estimate)
 */
export async function countTokens(html, encoding = 'cl100k_base') {
    const count = encoding === 'gemini'
        ? (s) => Math.ceil(s.length / 4)
        : countWithTiktoken;
    const raw = count(html);
    // Collect all style noise: <style>...</style> and style="..." attributes
    let styleTokens = 0;
    for (const m of html.matchAll(STYLE_BLOCK_RE))
        styleTokens += count(m[0]);
    for (const m of html.matchAll(STYLE_ATTR_RE))
        styleTokens += count(m[0]);
    const structure = Math.max(0, raw - styleTokens);
    return { raw, structure, style: styleTokens, savings: styleTokens };
}
export async function compareTokens(beforeHtml, afterHtml, encoding = 'cl100k_base') {
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
