export declare function initCommand(options: {
    provider: 'claude' | 'gemini' | 'copilot';
    outputDir: string;
    force?: boolean;
}): Promise<void>;
