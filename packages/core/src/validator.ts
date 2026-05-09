import { parse } from 'node-html-parser';
import type { CSSContract } from './contract';

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

  // Check for <style> blocks
  if (rules.noInlineStyles !== false) {
    const styleBlocks = root.querySelectorAll('style');
    for (const style of styleBlocks) {
      errors.push({
        type: 'inline-style',
        line: 1, // rough estimate without full source mapping
        column: 1,
        message: 'Found <style> block, which is forbidden.',
        snippet: style.toString().substring(0, 50) + '...'
      });
    }
  }

  // Walk elements for style="" and class=""
  const elements = root.querySelectorAll('*');
  const allowedClasses = Array.isArray(rules.allowedClasses) 
    ? new Set(rules.allowedClasses) 
    : new Set(contract.classes);

  for (const el of elements) {
    // Check style=""
    if (rules.noInlineStyles !== false && el.hasAttribute('style')) {
      errors.push({
        type: 'inline-style',
        line: 1,
        column: 1,
        message: 'Found inline style attribute.',
        snippet: `<${el.tagName} style="${el.getAttribute('style')}">`
      });
    }

    // Check classes
    if (rules.allowedClasses !== undefined && el.hasAttribute('class')) {
      const classAttr = el.getAttribute('class') || '';
      const classes = classAttr.split(/\s+/).filter(Boolean);
      for (const cls of classes) {
        if (!allowedClasses.has(cls)) {
          warnings.push({
            message: `Unknown class '${cls}' found on <${el.rawTagName}>`
          });
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
