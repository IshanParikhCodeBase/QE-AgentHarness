import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { loadAgentDefs } from '../../core/harness/loader.js';
import { getAdapter, PROVIDER_TARGETS } from '../../core/harness/adapters/index.js';
import { ProviderTarget } from '../../core/harness/types.js';
import { readConfig } from '../../core/config/store.js';
import { readMemory } from '../../core/memory/store.js';
import { success, failure, hint } from '../ui.js';

const AGENTS_DIR = 'agents';
const VALID_PROVIDERS = PROVIDER_TARGETS.join(' | ');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveProjectRoot(rootOpt?: string): string {
  return rootOpt ? path.resolve(rootOpt) : process.cwd();
}

function loadDefs(projectRoot: string) {
  const agentsDir = path.join(projectRoot, AGENTS_DIR);
  if (!fs.existsSync(agentsDir)) {
    failure(`No agents/ directory found at ${projectRoot}`);
    hint('Create agents/ and add at least one .md agent definition.');
    process.exit(1);
  }
  const defs = loadAgentDefs(agentsDir);
  if (defs.length === 0) {
    failure('No valid agent definitions found in agents/');
    hint('Each .md file needs a YAML frontmatter block with at minimum: name, description');
    process.exit(1);
  }
  return defs;
}

function writeFiles(files: { path: string; content: string }[], projectRoot: string): string[] {
  const written: string[] = [];
  for (const file of files) {
    const abs = path.join(projectRoot, file.path);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, file.content, 'utf8');
    written.push(file.path);
  }
  return written;
}

function initMemoryDir(projectRoot: string): void {
  const memoryDir = path.join(projectRoot, 'harness', 'memory');
  fs.mkdirSync(memoryDir, { recursive: true });

  const readme = path.join(memoryDir, 'README.md');
  if (!fs.existsSync(readme)) {
    fs.writeFileSync(
      readme,
      [
        '# Harness Memory',
        '',
        'This directory holds per-client business rules, features, and test conventions.',
        'Files here are version-controlled and read directly by agents at runtime.',
        '',
        '## Structure',
        '',
        '```',
        'harness/memory/',
        '└── <client-slug>/',
        '    ├── rules.md        — business rules and constraints',
        '    ├── features.md     — product features',
        '    └── conventions.md  — test conventions',
        '```',
        '',
        '## Adding memory',
        '',
        '- **From the qai CLI:** `qai harness export-memory --client <name>`',
        '- **Manually:** create a subfolder and add markdown files',
        '- **From a document:** `qai memory ingest <file>` then re-export',
        '',
        'Rules in this directory inform the test-case-drafter and any other agents that read memory.',
      ].join('\n'),
      'utf8',
    );
  }
}

// ─── Commands ─────────────────────────────────────────────────────────────────

export function registerHarnessCommands(program: Command): void {
  const cmd = program.command('harness').description('Manage the agent harness and provider adapters');

  // ── harness init ──────────────────────────────────────────────────────────
  cmd
    .command('init')
    .description('Initialise the harness for a provider: generate native agent files + memory dir')
    .requiredOption('-p, --provider <target>', `Provider to target (${VALID_PROVIDERS})`)
    .option('-r, --root <path>', 'Project root (defaults to cwd)')
    .action((opts: { provider: string; root?: string }) => {
      const target = opts.provider as ProviderTarget;
      if (!PROVIDER_TARGETS.includes(target)) {
        failure(`Unknown provider "${target}". Valid targets: ${VALID_PROVIDERS}`);
        process.exit(1);
      }

      const projectRoot = resolveProjectRoot(opts.root);
      const defs = loadDefs(projectRoot);
      const adapter = getAdapter(target);
      const files = adapter.generate(defs, projectRoot);
      const written = writeFiles(files, projectRoot);

      initMemoryDir(projectRoot);

      console.log('');
      console.log(chalk.bold('harness init') + chalk.dim(`  ·  ${target}`));
      console.log(chalk.dim('─'.repeat(42)));
      success(`${defs.length} agent${defs.length !== 1 ? 's' : ''} loaded`);
      for (const f of written) {
        console.log(`  ${chalk.green('✓')} ${f}`);
      }
      console.log(`  ${chalk.green('✓')} harness/memory/`);
      console.log('');
      hint('Next: populate memory with  qai harness export-memory  or  qai memory add-rule');

      if (target === 'claude-code') {
        hint('Restart Claude Code in this project to pick up the new subagent(s).');
      }
    });

  // ── harness generate ──────────────────────────────────────────────────────
  cmd
    .command('generate')
    .description('Re-generate provider-native files from neutral definitions (no memory dir init)')
    .requiredOption('-p, --provider <target>', `Provider to target (${VALID_PROVIDERS})`)
    .option('-r, --root <path>', 'Project root (defaults to cwd)')
    .action((opts: { provider: string; root?: string }) => {
      const target = opts.provider as ProviderTarget;
      if (!PROVIDER_TARGETS.includes(target)) {
        failure(`Unknown provider "${target}". Valid targets: ${VALID_PROVIDERS}`);
        process.exit(1);
      }

      const projectRoot = resolveProjectRoot(opts.root);
      const defs = loadDefs(projectRoot);
      const adapter = getAdapter(target);
      const files = adapter.generate(defs, projectRoot);
      const written = writeFiles(files, projectRoot);

      console.log('');
      console.log(chalk.bold('harness generate') + chalk.dim(`  ·  ${target}`));
      console.log(chalk.dim('─'.repeat(42)));
      for (const f of written) {
        console.log(`  ${chalk.green('✓')} ${f}`);
      }
      console.log('');
      success('Done');
    });

  // ── harness list ──────────────────────────────────────────────────────────
  cmd
    .command('list')
    .description('List all neutral agent definitions in agents/')
    .option('-r, --root <path>', 'Project root (defaults to cwd)')
    .action((opts: { root?: string }) => {
      const projectRoot = resolveProjectRoot(opts.root);
      const agentsDir = path.join(projectRoot, AGENTS_DIR);
      const defs = loadAgentDefs(agentsDir);

      console.log('');
      console.log(chalk.bold('Agent definitions') + chalk.dim(`  ·  ${agentsDir}`));
      console.log(chalk.dim('─'.repeat(42)));

      if (defs.length === 0) {
        console.log(chalk.dim('  none'));
      } else {
        for (const def of defs) {
          console.log(`  ${chalk.green('●')} ${chalk.bold(def.name)}  ${chalk.dim('v' + def.version)}`);
          console.log(`    ${chalk.dim(def.description)}`);
          console.log(`    tools: ${chalk.dim(def.tools.join(', ') || 'none')}`);
          const modelsSummary = Object.entries(def.models)
            .map(([p, m]) => `${p}→${m}`)
            .join(', ');
          if (modelsSummary) console.log(`    models: ${chalk.dim(modelsSummary)}`);
          console.log('');
        }
      }
    });

  // ── harness export-memory ─────────────────────────────────────────────────
  cmd
    .command('export-memory')
    .description('Export client memory from ~/.qai into harness/memory/ (version-controlled)')
    .option('-c, --client <name>', 'Client slug to export (defaults to active client)')
    .option('-r, --root <path>', 'Project root (defaults to cwd)')
    .action((opts: { client?: string; root?: string }) => {
      const cfg = readConfig();
      const clientName = opts.client ?? cfg.activeClient;

      if (!clientName) {
        failure('No client specified and no active client set.');
        hint('Run: qai context set <name>  or pass  --client <name>');
        process.exit(1);
      }

      const memory = readMemory(clientName);
      const projectRoot = resolveProjectRoot(opts.root);
      const clientDir = path.join(projectRoot, 'harness', 'memory', clientName);
      fs.mkdirSync(clientDir, { recursive: true });

      // rules.md
      const rulesLines = [
        `# Business Rules — ${clientName}`,
        '',
        memory.businessRules.length === 0
          ? '_No business rules recorded yet._'
          : memory.businessRules
              .map(
                (r, i) =>
                  `## BR-${String(i + 1).padStart(3, '0')} — ${r.rule}\n\n**Applies when:** ${r.context}${r.tags.length ? `\n\n**Tags:** ${r.tags.join(', ')}` : ''}`,
              )
              .join('\n\n'),
      ];
      fs.writeFileSync(path.join(clientDir, 'rules.md'), rulesLines.join('\n'), 'utf8');

      // features.md
      const featuresLines = [
        `# Features — ${clientName}`,
        '',
        memory.features.length === 0
          ? '_No features recorded yet._'
          : memory.features
              .map(
                (f) =>
                  `## ${f.name}\n\n${f.description}${f.tags.length ? `\n\n**Tags:** ${f.tags.join(', ')}` : ''}`,
              )
              .join('\n\n'),
      ];
      fs.writeFileSync(path.join(clientDir, 'features.md'), featuresLines.join('\n'), 'utf8');

      // conventions.md
      const conventionsLines = [
        `# Test Conventions — ${clientName}`,
        '',
        memory.testConventions.length === 0
          ? '_No test conventions recorded yet._'
          : memory.testConventions.map((c) => `- ${c.convention}`).join('\n'),
      ];
      fs.writeFileSync(
        path.join(clientDir, 'conventions.md'),
        conventionsLines.join('\n'),
        'utf8',
      );

      console.log('');
      console.log(chalk.bold('export-memory') + chalk.dim(`  ·  ${clientName}`));
      console.log(chalk.dim('─'.repeat(42)));
      console.log(`  ${chalk.green('✓')} harness/memory/${clientName}/rules.md  ${chalk.dim('(' + memory.businessRules.length + ' rules)')}`);
      console.log(`  ${chalk.green('✓')} harness/memory/${clientName}/features.md  ${chalk.dim('(' + memory.features.length + ' features)')}`);
      console.log(`  ${chalk.green('✓')} harness/memory/${clientName}/conventions.md  ${chalk.dim('(' + memory.testConventions.length + ' conventions)')}`);
      console.log('');
      success('Memory exported — commit harness/memory/ to version control');
    });
}
