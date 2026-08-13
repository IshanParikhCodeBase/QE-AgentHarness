# Harness Memory

This directory holds project business rules, features, and test conventions.
Files here are version-controlled and read directly by agents at runtime.

## Structure

```
harness/memory/
├── rules.md        — business rules and constraints
├── features.md     — product features
└── conventions.md  — test conventions
```

## Adding memory

- **Via CLI (interactive):** `qai memory add-rule` / `add-feature` / `add-convention`
- **Manually:** edit the markdown files directly

Rules in this directory inform the test-case-drafter and any other agents that read memory.
