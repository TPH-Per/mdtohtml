import { parse } from 'node-html-parser';
import type { CSSContract } from './contract.js';
import { STYLE_BLOCK_RE, STYLE_ATTR_RE, TAILWIND_RE } from './constants.js';

export interface ValidationRules {
  noInlineStyles?: boolean;
  noTailwindClasses?: boolean;
  requireLinkTag?: boolean;
  allowedClasses?: 'auto' | string[];
}

export interface ValidationError {
  type: 'inline-style' | 'missing-link-tag' | 'unknown-class' | 'forbidden-tag';
  line: number;
  column: number;
  message: string;
  snippet: string;
}

export interface ValidationWarning {
  message: string;
}

export interface ValidationResult {
  passed: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

function offsetToLineCol(html: string, offset: number): { line: number; column: number } {
  if (offset < 0) return { line: 1, column: 1 };
  const lines = html.slice(0, offset).split('\n');
  return { line: lines.length, column: lines[lines.length - 1].length + 1 };
}

export async function validateHTML(
  html: string,
  contract: CSSContract,
  rules: ValidationRules
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  const root = parse(html, {
    comment: false,
    blockTextElements: {
      script: true,
      noscript: true,
      style: true,
      pre: true
    }
  });

  // Check for link tag
  if (rules.requireLinkTag !== false) {
    const links = root.querySelectorAll('link[rel="stylesheet"]');
    if (links.length === 0) {
      errors.push({
        type: 'missing-link-tag',
        line: 1,
        column: 1,
        message: 'Missing <link rel="stylesheet"> tag',
        snippet: ''
      });
    }
  }

  // Check <style> blocks
  if (rules.noInlineStyles !== false) {
    for (const m of html.matchAll(STYLE_BLOCK_RE)) {
      const { line, column } = offsetToLineCol(html, m.index ?? 0);
      errors.push({
        type: 'inline-style',
        line, 
        column,
        message: 'Found <style> block. Use external stylesheet instead.',
        snippet: m[0].slice(0, 60) + (m[0].length > 60 ? '...' : ''),
      });
    }
  }

  // Check style="" attributes using regex on raw HTML (not DOM traversal)
  if (rules.noInlineStyles !== false) {
    for (const m of html.matchAll(STYLE_ATTR_RE)) {
      const { line, column } = offsetToLineCol(html, m.index ?? 0);
      // Find enclosing tag for snippet
      const tagStart = html.lastIndexOf('<', m.index);
      const tagEnd = html.indexOf('>', m.index ?? 0) + 1;
      const snippet = html.slice(Math.max(0, tagStart), Math.min(html.length, tagEnd));
      errors.push({
        type: 'inline-style',
        line, 
        column,
        message: 'Found inline style attribute.',
        snippet,
      });
    }
  }

  // Check classes via AST
  const elements = root.querySelectorAll('*');
  const allowedClasses = Array.isArray(rules.allowedClasses) 
    ? new Set(rules.allowedClasses) 
    : new Set(contract.classes);

  if (rules.allowedClasses !== undefined || rules.noTailwindClasses) {
    for (const el of elements) {
      if (el.hasAttribute('class')) {
        const classAttr = el.getAttribute('class') || '';
        const classes = classAttr.split(/\s+/).filter(Boolean);
        
        for (const cls of classes) {
          if (rules.allowedClasses !== undefined && !allowedClasses.has(cls)) {
            warnings.push({
              message: `Unknown class '${cls}' found on <${el.rawTagName}>`
            });
          }
          
          if (rules.noTailwindClasses) {
            if (TAILWIND_RE.test(cls) && !allowedClasses.has(cls)) {
              warnings.push({
                message: `Possible Tailwind class '${cls}' on <${el.rawTagName}> — use contract classes instead`
              });
            }
          }
        }
      }
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings
  };
}
