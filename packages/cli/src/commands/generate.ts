import fs from 'fs/promises';
import { countTokens, validateHTML, loadContract } from '@llm-html-kit/core';
import { buildClaudeSystemPrompt, buildGeminiSystemPrompt, buildCopilotInstructions } from '@llm-html-kit/prompt-builder';

// A mock of actual LLM calling for scaffolding purposes.
async function callLLM(prompt: string, systemPrompt: string, provider: string) {
  console.log(`Calling ${provider} API...`);
  // Simulated HTML response
  return `<!DOCTYPE html><html><head><link rel="stylesheet" href="./styles.css"></head><body><div class="card prose"><p>Simulated HTML response for: ${prompt}</p></div></body></html>`;
}

export async function generateCommand(prompt: string, options: { provider?: string; output?: string; open?: boolean }) {
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
    systemPrompt = buildClaudeSystemPrompt(contract, {});
  } else if (provider === 'gemini') {
    systemPrompt = buildGeminiSystemPrompt(contract, {});
  } else {
    systemPrompt = buildCopilotInstructions(contract, {});
  }

  const generatedHTML = await callLLM(prompt, systemPrompt, provider);

  // Validate the output
  const validationResult = await validateHTML(generatedHTML, contract, {
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
  const tokens = await countTokens(generatedHTML);
  console.log(`Token audit: Structure(${tokens.structure}), Style(${tokens.style})`);

  // Write output
  await fs.mkdir('./output', { recursive: true });
  await fs.writeFile(outputPath, generatedHTML);
  console.log(`Successfully generated and validated HTML at ${outputPath}`);
}
