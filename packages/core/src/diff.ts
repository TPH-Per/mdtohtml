import { TokenDiff } from './tokenizer';

export function formatDiffReport(diff: TokenDiff): string {
  return `
┌─────────────────────────────────────────────────────────┐
│  Token Audit Report                                     │
├──────────────────────┬──────────────────────────────────┤
│  Total tokens        │  ${diff.before.raw}              │
│  Structure tokens    │  ${diff.before.structure}        │
│  Style tokens        │  ${diff.before.style}            │
│  Savings if external │  ${diff.savingsTokens}           │
│  Savings %           │  ${diff.savingsPercent.toFixed(1)}%│
└─────────────────────────────────────────────────────────┘
  `.trim();
}
