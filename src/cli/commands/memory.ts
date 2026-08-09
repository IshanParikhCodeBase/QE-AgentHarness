import { Command } from 'commander';
import chalk from 'chalk';
import { input } from '@inquirer/prompts';
import fs from 'fs';
import { readConfig } from '../../core/config/store.js';
import { appendRule, appendFeature, appendConvention, readMemoryFile } from '../../core/memory/store.js';
import { ingestDocument } from '../../core/memory/ingest.js';
import { getProvider } from '../../core/llm/factory.js';
import { success, failure, hint, createSpinner } from '../ui.js';

function requireClient(): string {
  const cfg = readConfig();
  if (!cfg.activeClient) {
    failure('No active client  ·  run: qai context set <name>');
    process.exit(1);
  }
  return cfg.activeClient;
}

export function registerMemoryCommands(program: Command): void {
  const cmd = program.command('memory').description('Manage client memory');

  // ── add-rule ──────────────────────────────────────────────────────────────
  cmd
    .command('add-rule')
    .description('Add a business rule to harness/memory/<client>/rules.md')
    .action(async () => {
      const clientName = requireClient();

      console.log('');
      console.log(chalk.bold('Add business rule') + chalk.dim(`  ·  ${clientName}`));
      console.log(chalk.dim('─'.repeat(42)));

      const rule = await input({ message: 'Rule:' });
      const context = await input({ message: 'Applies when:' });
      const tagsRaw = await input({ message: 'Tags (comma-separated):', default: '' });
      const tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean);

      appendRule(clientName, rule, context, tags);
      console.log('');
      success(`Rule added  ·  harness/memory/${clientName}/rules.md`);
    });

  // ── add-feature ───────────────────────────────────────────────────────────
  cmd
    .command('add-feature')
    .description('Add a product feature to harness/memory/<client>/features.md')
    .action(async () => {
      const clientName = requireClient();

      console.log('');
      console.log(chalk.bold('Add feature') + chalk.dim(`  ·  ${clientName}`));
      console.log(chalk.dim('─'.repeat(42)));

      const name = await input({ message: 'Name:' });
      const description = await input({ message: 'Description:' });
      const tagsRaw = await input({ message: 'Tags (comma-separated):', default: '' });
      const tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean);

      appendFeature(clientName, name, description, tags);
      console.log('');
      success(`Feature added  ·  harness/memory/${clientName}/features.md`);
    });

  // ── add-convention ────────────────────────────────────────────────────────
  cmd
    .command('add-convention')
    .description('Add a test convention to harness/memory/<client>/conventions.md')
    .action(async () => {
      const clientName = requireClient();

      console.log('');
      console.log(chalk.bold('Add test convention') + chalk.dim(`  ·  ${clientName}`));
      console.log(chalk.dim('─'.repeat(42)));

      const convention = await input({ message: 'Convention:' });

      appendConvention(clientName, convention);
      console.log('');
      success(`Convention added  ·  harness/memory/${clientName}/conventions.md`);
    });

  // ── ingest ────────────────────────────────────────────────────────────────
  cmd
    .command('ingest <file>')
    .description('Extract rules, features, and conventions from a document using LLM')
    .action(async (file: string) => {
      const clientName = requireClient();

      if (!fs.existsSync(file)) {
        failure(`File not found: ${file}`);
        process.exit(1);
      }

      const content = fs.readFileSync(file, 'utf8');
      const cfg = readConfig();

      let provider;
      try {
        provider = getProvider(cfg);
      } catch (err) {
        failure((err as Error).message);
        process.exit(1);
      }

      console.log('');
      const spinner = createSpinner(`extracting from ${chalk.bold(file)}...`);
      spinner.start();

      try {
        const result = await ingestDocument(content, clientName, provider);
        spinner.stop();
        console.log('');
        success('Extraction complete  ·  written to harness/memory/' + clientName + '/');
        hint(`  ${result.features} features`);
        hint(`  ${result.businessRules} business rules`);
        hint(`  ${result.testConventions} test conventions`);
      } catch (err) {
        spinner.stop();
        failure((err as Error).message);
        process.exit(1);
      }
    });

  // ── show ──────────────────────────────────────────────────────────────────
  cmd
    .command('show')
    .description('Display current client memory files')
    .action(() => {
      const clientName = requireClient();

      console.log('');
      console.log(chalk.green('●') + ' ' + chalk.bold(clientName) + chalk.dim('  ·  harness/memory'));
      console.log(chalk.dim('─'.repeat(42)));

      for (const [label, filename] of [
        ['Business Rules', 'rules.md'],
        ['Features', 'features.md'],
        ['Test Conventions', 'conventions.md'],
      ] as const) {
        const content = readMemoryFile(clientName, filename);
        console.log('');
        console.log(chalk.bold(label));
        if (!content) {
          console.log(chalk.dim('  none yet'));
        } else {
          // Print each non-header, non-empty line indented
          for (const line of content.split('\n').slice(1)) {
            if (line.trim() === '') continue;
            console.log('  ' + chalk.dim(line));
          }
        }
      }

      console.log('');
    });
}
