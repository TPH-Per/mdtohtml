export * from './builders/claude.js';
export * from './builders/gemini.js';
export * from './builders/copilot.js';
export * from './builders/base.js';
export interface PromptOptions {
    includeVocabularyReference?: boolean;
    maxVocabularyTokens?: number;
    htmlWrapperInstruction?: boolean;
    includeExample?: boolean;
}
