# qai — Quality Engineering Agent Harness

A CLI tool for setting up and managing QA agents across AI coding platforms. Engineers use their existing Claude Code, OpenAI Codex, or GitHub Copilot subscription — `qai` handles the setup and memory management so agents work consistently across every project and every team member.

---

## How it works

Agent definitions are written once in a neutral format (`agents/*.md`). `qai` translates them into the native format each platform expects. Business rules and constraints live in `harness/memory/` — plain markdown files committed to the repo so the whole team shares the same context.

```
agents/
└── test-case-drafter.md        ← neutral definition (source of truth)

harness/
└── memory/
    ├── rules.md                ← business rules
    ├── features.md             ← product features
    └── conventions.md          ← test conventions
```

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd AgentHarness
npm install
npm run build
```

### 2. Link globally so `qai` is available from any directory

```bash
npm link
```

---

## Onboarding a new project

### Step 1 — Initialise the harness for your platform

Run this from the root of your project:

```bash
qai harness init --provider claude-code    # Claude Code
qai harness init --provider codex          # OpenAI Codex
qai harness init --provider copilot        # GitHub Copilot
```

This generates the platform-native agent file(s) and creates the `harness/memory/` directory. Commit everything:

```bash
git add .claude/ harness/    # (or AGENTS.md / .github/ depending on provider)
git commit -m "add qai harness"
```

Teammates who pull this get the agent immediately — no setup required on their end.

### Step 2 — Add business rules

```bash
qai memory add-rule
```

The CLI prompts you for the rule, when it applies, and optional tags. Rules are written directly to `harness/memory/rules.md`. Commit them:

```bash
git add harness/memory/
git commit -m "add business rules"
```

### Step 3 — Use the agent

Open your AI platform in the project and ask it to use the agent:

> *"Use test-case-drafter to draft test cases for this feature: [paste feature description]"*

The agent reads the memory files and produces structured test cases that already reflect your business rules.

---

## Commands

### `qai harness`

| Command | What it does |
|---|---|
| `harness init --provider <name>` | Generate native agent files + initialise `harness/memory/` |
| `harness generate --provider <name>` | Regenerate native files after editing an agent definition |
| `harness list` | List all neutral agent definitions in `agents/` |

Supported providers: `claude-code` · `codex` · `copilot`

### `qai memory`

All memory commands write directly to `harness/memory/`. No sync step needed.

| Command | What it does |
|---|---|
| `memory add-rule` | Add a business rule interactively |
| `memory add-feature` | Add a product feature interactively |
| `memory add-convention` | Add a test convention interactively |
| `memory show` | Display all memory files |

---

## Adding a new agent

1. Create `agents/<agent-name>.md` with YAML frontmatter and a system prompt body:

```markdown
---
name: your-agent-name
description: One-line description of what this agent does
version: "1.0"
models:
  claude: claude-sonnet-4-6
  openai: gpt-4o
  codex: gpt-4o
  copilot: gpt-4o
tools:
  - read_memory
  - file_write
max_tokens: 4096
memory_path: ./harness/memory
output_path: ./output
---

Your system prompt here.
```

2. Regenerate the platform files:

```bash
qai harness generate --provider claude-code
```

The new agent is immediately available in your AI platform. No code changes required.

---

## Switching providers

If the team moves to a different platform, regenerate from the same definitions:

```bash
qai harness init --provider codex
git add AGENTS.md && git commit -m "add codex agent config"
```

The agent behaviour and all accumulated memory carry over unchanged.

---

## Development

```bash
npm run dev      # Run without building (uses tsx)
npm run build    # Compile TypeScript → dist/
```
