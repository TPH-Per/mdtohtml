export * from './builders/claude';
export * from './builders/gemini';
export * from './builders/copilot';

export interface PromptOptions {
  includeVocabularyReference?: boolean;
  maxVocabularyTokens?: number;
  htmlWrapperInstruction?: boolean;
}
