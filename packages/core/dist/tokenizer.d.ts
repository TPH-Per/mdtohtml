export interface TokenCount {
    raw: number;
    structure: number;
    style: number;
    savings: number;
}
/**
 * @param html     Raw HTML string to analyze
 * @param encoding 'cl100k_base' (OpenAI/Anthropic), 'gemini' (char-based estimate)
 */
export declare function countTokens(html: string, encoding?: 'cl100k_base' | 'gemini'): Promise<TokenCount>;
export interface TokenDiff {
    before: TokenCount;
    after: TokenCount;
    savingsTokens: number;
    savingsPercent: number;
}
export declare function compareTokens(beforeHtml: string, afterHtml: string, encoding?: 'cl100k_base' | 'gemini'): Promise<TokenDiff>;
