export * from '@llm-html-kit/core';
export * from '@llm-html-kit/prompt-builder';
export interface ValidationRules {
    noInlineStyles?: boolean;
    noTailwindClasses?: boolean;
    requireLinkTag?: boolean;
    allowedClasses?: 'auto' | string[];
}
export interface LLMHtmlConfig {
    stylesheet?: string;
    outputDir?: string;
    provider?: 'claude' | 'gemini' | 'copilot' | 'custom';
    model?: string;
    tokenBudget?: number;
    validation?: ValidationRules;
    prompt?: {
        includeVocabularyReference?: boolean;
        maxVocabularyTokens?: number;
        htmlWrapperInstruction?: boolean;
    };
}
export declare function defineConfig(config: LLMHtmlConfig): LLMHtmlConfig;
