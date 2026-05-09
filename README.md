# llm-html-kit

A CLI-first toolkit that gives AI agents a shared contract for generating structured, token-efficient HTML output with a pre-baked stylesheet system, token analytics, and test harness.

## Quickstart

```bash
npm install -g llm-html-kit
cd your-project
llm-html init --provider claude
```

## Features
- **Token Efficiency**: Eliminate inline styles from LLM output.
- **Contract Enforcement**: Validate generated HTML for CSS conformity.
- **Cross-Platform**: Support for Claude Code, Gemini CLI, and GitHub Copilot.
- **Instant Preview**: Live reload with `llm-html serve`.

See documentation for details on extending the CSS vocabulary or configuring rules.
