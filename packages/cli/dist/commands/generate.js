"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCommand = generateCommand;
const promises_1 = __importDefault(require("fs/promises"));
const core_1 = require("@llm-html-kit/core");
const prompt_builder_1 = require("@llm-html-kit/prompt-builder");
// A mock of actual LLM calling for scaffolding purposes.
async function callLLM(prompt, systemPrompt, provider) {
    console.log(`Calling ${provider} API...`);
    // Simulated HTML response
    return `<!DOCTYPE html><html><head><link rel="stylesheet" href="./styles.css"></head><body><div class="card prose"><p>Simulated HTML response for: ${prompt}</p></div></body></html>`;
}
async function generateCommand(prompt, options) {
    console.log(`Generating HTML for prompt: "${prompt}"`);
    // Note: in a real implementation we'd read llm-html.config.ts here
    const provider = options.provider || 'claude';
    const outputPath = options.output || './output/generated.html';
    // For scaffolding, we mock a contract
    const contract = {
        classes: ['card', 'prose'],
        customProperties: [],
        source: '',
        checksum: 'mock123'
    };
    let systemPrompt = '';
    if (provider === 'claude') {
        systemPrompt = (0, prompt_builder_1.buildClaudeSystemPrompt)(contract, {});
    }
    else if (provider === 'gemini') {
        systemPrompt = (0, prompt_builder_1.buildGeminiSystemPrompt)(contract, {});
    }
    else {
        systemPrompt = (0, prompt_builder_1.buildCopilotInstructions)(contract, {});
    }
    const generatedHTML = await callLLM(prompt, systemPrompt, provider);
    // Validate the output
    const validationResult = await (0, core_1.validateHTML)(generatedHTML, contract, {
        noInlineStyles: true,
        requireLinkTag: true,
        allowedClasses: 'auto'
    });
    if (!validationResult.passed) {
        console.error('Validation failed:');
        validationResult.errors.forEach(e => console.error(`- [${e.type}] ${e.message}`));
        process.exit(1);
    }
    // Token Audit
    const tokens = await (0, core_1.countTokens)(generatedHTML);
    console.log(`Token audit: Structure(${tokens.structure}), Style(${tokens.style})`);
    // Write output
    await promises_1.default.mkdir('./output', { recursive: true });
    await promises_1.default.writeFile(outputPath, generatedHTML);
    console.log(`Successfully generated and validated HTML at ${outputPath}`);
}
