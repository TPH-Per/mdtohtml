export interface CSSContract {
    classes: string[];
    customProperties: string[];
    source: string;
    checksum: string;
}
export declare function loadContract(stylesheetPath: string): Promise<CSSContract>;
export declare function groupClassesByCategory(classes: string[]): string;
export declare function vocabularyToPromptFragment(contract: CSSContract, maxTokens?: number): string;
