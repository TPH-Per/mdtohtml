# llm-html-kit

A CLI-first toolkit that gives AI agents a shared contract for generating structured, token-efficient HTML output with a pre-baked stylesheet system, token analytics, and test harness.

## Quickstart

### Installation & Build

Because this tool relies on a built stylesheet contract, make sure you install dependencies and build it first (or install it globally once built):

```bash
git clone https://github.com/TPH-Per/mdtohtml.git
cd mdtohtml
pnpm install
pnpm build
```

Alternatively, you can link it globally for your agents to use:
```bash
npm install -g .
```

### Project Setup

Go to your project directory and initialize the configuration for your preferred AI agent:

```bash
cd your-project
llm-html init --provider claude
# Or for gemini: llm-html init --provider gemini
# Or for copilot: llm-html init --provider copilot
```

## Features
- **Token Efficiency**: Eliminate inline styles from LLM output.
- **Contract Enforcement**: Validate generated HTML for CSS conformity.
- **Cross-Platform**: Support for Claude Code, Gemini CLI, and GitHub Copilot.
- **Instant Preview**: Live reload with `llm-html serve`.

See documentation for details on extending the CSS vocabulary or configuring rules.
