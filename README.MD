# qai — Quality Engineering Agent Harness

A terminal-based AI agent harness for quality engineering work. Run it from anywhere via the `qai` command.

---

## Setup

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd AgentHarness
npm install
```

### 2. Build

```bash
npm run build
```

### 3. Link globally so `qai` is available from any directory

```bash
npm link
```

---

## Configure

Set your LLM provider and API key:

```bash
qai config set-provider claude        # or: openai | gemini
qai config set-key claude <your-key>
```

Supported providers:
- **Claude** — get a key at console.anthropic.com
- **OpenAI** — get a key at platform.openai.com
- **Gemini** — get a key at aistudio.google.com

---

## Usage

Launch the interactive REPL:

```bash
qai
```

### REPL commands

| Command | What it does |
|---|---|
| `/draft-test-cases` | Guided flow to draft test scenarios for a feature |
| `/context <name>` | Switch active client (memory is namespaced per client) |
| `/memory` | Show current client memory summary |
| `/config` | Show active provider and model |
| `/clear` | Clear the screen |
| `exit` | Exit qai |

### Drafting test scenarios

Run `/draft-test-cases` in the REPL. It will ask you:
1. **Describe the feature** — paste a paragraph describing what's being built
2. **Attach files (optional)** — provide up to 2 file paths (PDF or plain text) for additional context like specs or PRDs

The agent queries client memory for relevant business rules and conventions before drafting.

---

## Memory

Memory is stored globally at `~/.qai/clients/<client-name>/memory.json` — never inside client repos.

```bash
qai memory add-client       # Set client name, industry, description
qai memory add-feature      # Add a known feature
qai memory add-rule         # Add a business rule
qai memory add-convention   # Add a test convention
qai memory ingest <file>    # Extract structured memory from an unstructured doc (PRD, spec, etc.)
qai memory show             # Print all stored memory for the active client
```

---

## Development

```bash
npm run dev     # Run without building (uses tsx)
npm run build   # Compile TypeScript → dist/
```

Adding a new agent: create a directory under `src/core/agents/<agent-name>/` with a `skill.md` (system prompt) and `index.ts` (thin wrapper). No changes to core required.
