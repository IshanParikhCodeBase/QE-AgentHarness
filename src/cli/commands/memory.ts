import { Command } from 'commander';
import chalk from 'chalk';
import { input } from '@inquirer/prompts';
import { appendRule, appendFeature, appendConvention } from '../../core/memory/store.js';
import { success } from '../ui.js';

export function registerMemoryCommands(program: Command): void {
  const cmd = program.command('memory').description('Manage project memory');

  // ── add-rule ──────────────────────────────────────────────────────────────
  cmd
    .command('add-rule')
    .description('Add a business rule to memory/rules.md')
    .action(async () => {
      console.log('');
      console.log(chalk.bold('Add business rule'));
      console.log(chalk.dim('─'.repeat(42)));

      const rule = await input({ message: 'Rule:' });
      const context = await input({ message: 'Applies when:' });
      const tagsRaw = await input({ message: 'Tags (comma-separated):', default: '' });
      const tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean);

      appendRule(rule, context, tags);
      console.log('');
      success('Rule added  ·  memory/rules.md');
    });

  // ── add-feature ───────────────────────────────────────────────────────────
  cmd
    .command('add-feature')
    .description('Add a product feature to memory/features.md')
    .action(async () => {
      console.log('');
      console.log(chalk.bold('Add feature'));
      console.log(chalk.dim('─'.repeat(42)));

      const name = await input({ message: 'Name:' });
      const description = await input({ message: 'Description:' });
      const tagsRaw = await input({ message: 'Tags (comma-separated):', default: '' });
      const tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean);

      appendFeature(name, description, tags);
      console.log('');
      success('Feature added  ·  memory/features.md');
    });

  // ── add-convention ────────────────────────────────────────────────────────
  cmd
    .command('add-convention')
    .description('Add a test convention to memory/conventions.md')
    .action(async () => {
      console.log('');
      console.log(chalk.bold('Add test convention'));
      console.log(chalk.dim('─'.repeat(42)));

      const convention = await input({ message: 'Convention:' });

      appendConvention(convention);
      console.log('');
      success('Convention added  ·  memory/conventions.md');
    });
}
