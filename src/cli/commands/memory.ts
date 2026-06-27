import { Command } from 'commander';
import chalk from 'chalk';
import { input } from '@inquirer/prompts';
import { randomUUID } from 'crypto';
import fs from 'fs';
import { readConfig } from '../../core/config/store.js';
import { readMemory, writeMemory } from '../../core/memory/store.js';
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

function section(title: string): void {
  console.log('');
  console.log(chalk.bold(title));
}

function row(label: string, value: string): void {
  console.log(`  ${chalk.dim(label.padEnd(14) + '·')} ${value}`);
}

export function registerMemoryCommands(program: Command): void {
  const cmd = program.command('memory').description('Manage client memory');

  cmd
    .command('add-client')
    .description('Set or update client information')
    .action(async () => {
      const clientName = requireClient();
      const memory = readMemory(clientName);

      console.log('');
      console.log(chalk.bold('Client info') + chalk.dim(`  ·  ${clientName}`));
      console.log(chalk.dim('─'.repeat(42)));

      const name = await input({ message: 'Name:', default: memory.client.name });
      const industry = await input({ message: 'Industry:', default: memory.client.industry });
      const description = await input({ message: 'Description:', default: memory.client.description });

      memory.client = { name, industry, description };
      writeMemory(clientName, memory);
      console.log('');
      success('Client info saved');
    });

  cmd
    .command('add-feature')
    .description('Add a product feature to memory')
    .action(async () => {
      const clientName = requireClient();
      const memory = readMemory(clientName);

      console.log('');
      console.log(chalk.bold('Add feature') + chalk.dim(`  ·  ${clientName}`));
      console.log(chalk.dim('─'.repeat(42)));

      const name = await input({ message: 'Name:' });
      const description = await input({ message: 'Description:' });
      const tagsRaw = await input({ message: 'Tags (comma-separated):', default: '' });
      const tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean);

      memory.features.push({ id: randomUUID(), name, description, tags, addedAt: new Date().toISOString() });
      writeMemory(clientName, memory);
      console.log('');
      success('Feature added');
    });

  cmd
    .command('add-rule')
    .description('Add a business rule to memory')
    .action(async () => {
      const clientName = requireClient();
      const memory = readMemory(clientName);

      console.log('');
      console.log(chalk.bold('Add business rule') + chalk.dim(`  ·  ${clientName}`));
      console.log(chalk.dim('─'.repeat(42)));

      const rule = await input({ message: 'Rule:' });
      const context = await input({ message: 'Applies when:' });
      const tagsRaw = await input({ message: 'Tags (comma-separated):', default: '' });
      const tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean);

      memory.businessRules.push({ id: randomUUID(), rule, context, tags, addedAt: new Date().toISOString() });
      writeMemory(clientName, memory);
      console.log('');
      success('Business rule added');
    });

  cmd
    .command('add-convention')
    .description('Add a test convention to memory')
    .action(async () => {
      const clientName = requireClient();
      const memory = readMemory(clientName);

      console.log('');
      console.log(chalk.bold('Add test convention') + chalk.dim(`  ·  ${clientName}`));
      console.log(chalk.dim('─'.repeat(42)));

      const convention = await input({ message: 'Convention:' });

      memory.testConventions.push({ id: randomUUID(), convention, addedAt: new Date().toISOString() });
      writeMemory(clientName, memory);
      console.log('');
      success('Test convention added');
    });

  cmd
    .command('ingest <file>')
    .description('Extract structured memory from a document using LLM')
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
        success('Extraction complete');
        hint(`  ${result.features} features`);
        hint(`  ${result.businessRules} business rules`);
        hint(`  ${result.testConventions} test conventions`);
      } catch (err) {
        spinner.stop();
        failure((err as Error).message);
        process.exit(1);
      }
    });

  cmd
    .command('show')
    .description('Display current client memory')
    .action(() => {
      const clientName = requireClient();
      const memory = readMemory(clientName);

      console.log('');
      console.log(
        chalk.green('●') + ' ' + chalk.bold(clientName) + chalk.dim('  ·  memory'),
      );
      console.log(chalk.dim('─'.repeat(42)));

      // Client info
      section('Client');
      if (memory.client.name) {
        row('name', memory.client.name);
        row('industry', memory.client.industry);
        row('description', memory.client.description);
      } else {
        console.log(chalk.dim('  not set  ·  run: qai memory add-client'));
      }

      // Features
      section(`Features  ${chalk.dim('(' + memory.features.length + ')')}`);
      if (memory.features.length === 0) {
        console.log(chalk.dim('  none'));
      } else {
        for (const f of memory.features) {
          console.log(`  ${chalk.green('•')} ${chalk.bold(f.name)}`);
          console.log(`    ${chalk.dim(f.description)}`);
          if (f.tags.length) console.log(`    ${chalk.dim('tags · ' + f.tags.join(', '))}`);
        }
      }

      // Business rules
      section(`Business Rules  ${chalk.dim('(' + memory.businessRules.length + ')')}`);
      if (memory.businessRules.length === 0) {
        console.log(chalk.dim('  none'));
      } else {
        for (const r of memory.businessRules) {
          console.log(`  ${chalk.green('•')} ${r.rule}`);
          console.log(`    ${chalk.dim('when · ' + r.context)}`);
          if (r.tags.length) console.log(`    ${chalk.dim('tags · ' + r.tags.join(', '))}`);
        }
      }

      // Test conventions
      section(`Test Conventions  ${chalk.dim('(' + memory.testConventions.length + ')')}`);
      if (memory.testConventions.length === 0) {
        console.log(chalk.dim('  none'));
      } else {
        for (const c of memory.testConventions) {
          console.log(`  ${chalk.green('•')} ${c.convention}`);
        }
      }

      console.log('');
    });
}
