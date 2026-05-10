import type { CSSContract } from './contract.js';
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
export declare function validateHTML(html: string, contract: CSSContract, rules: ValidationRules): Promise<ValidationResult>;
