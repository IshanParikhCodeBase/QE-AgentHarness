# Harness Memory

This directory holds per-client business rules, features, and test conventions.
Files here are version-controlled and read directly by agents at runtime.

## Structure

```
harness/memory/
└── <client-slug>/
    ├── rules.md        — business rules and constraints
    ├── features.md     — product features
    └── conventions.md  — test conventions
```

## Adding memory

- **From the qai CLI:** `qai harness export-memory --client <name>`
- **Manually:** create a subfolder and add markdown files
- **From a document:** `qai memory ingest <file>` then re-export

Rules in this directory inform the test-case-drafter and any other agents that read memory.