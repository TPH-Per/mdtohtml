import { encoding_for_model, TiktokenModel } from '@dqbd/tiktoken';

export interface TokenCount {
  raw: number;
  structure: number;
  style: number;
  savings: number;
}

export interface TokenDiff {
  before: TokenCount;
  after: TokenCount;
  savingsTokens: number;
  savingsPercent: number;
}

export async function countTokens(html: string, encoding: string = 'cl100k_base'): Promise<TokenCount> {
  let enc: any = null;
  let countFn: (str: string) => number;
  
  if (encoding === 'gemini') {
    countFn = (str: string) => Math.ceil(str.length / 4);
  } else {
    // defaults to cl100k_base
    enc = encoding_for_model('gpt-3.5-turbo' as TiktokenModel);
    countFn = (str: string) => enc.encode(str).length;
  }

  try {
    const raw = countFn(html);
    
    // Basic parsing for <style> blocks and style="" attributes
    let styleTokens = 0;
    
    // Find <style> blocks
    const styleBlockRegex = /<style[^>]*>[\s\S]*?<\/style>/gi;
    let match;
    while ((match = styleBlockRegex.exec(html)) !== null) {
      styleTokens += countFn(match[0]);
    }
    
    // Find style="" attributes
    const styleAttrRegex = /style\s*=\s*["'][^"']*["']/gi;
    while ((match = styleAttrRegex.exec(html)) !== null) {
      styleTokens += countFn(match[0]);
    }

    const structure = raw - styleTokens;
    const savings = styleTokens; // All inline styles could potentially be saved

    return {
      raw,
      structure: structure > 0 ? structure : 0,
      style: styleTokens,
      savings
    };
  } finally {
    if (enc) {
      enc.free();
    }
  }
}

export async function compareTokens(beforeHTML: string, afterHTML: string, encoding: string = 'cl100k_base'): Promise<TokenDiff> {
  const before = await countTokens(beforeHTML, encoding);
  const after = await countTokens(afterHTML, encoding);
  
  const savingsTokens = before.raw - after.raw;
  const savingsPercent = before.raw > 0 ? (savingsTokens / before.raw) * 100 : 0;
  
  return {
    before,
    after,
    savingsTokens,
    savingsPercent
  };
}
