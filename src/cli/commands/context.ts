import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { readConfig, writeConfig } from '../../core/config/store.js';
import { listClients } from '../../core/memory/store.js';
import { success, hint } from '../ui.js';

export function registerContextCommands(program: Command): void {
  const cmd = program.command('context').description('Manage active client context');

  cmd
    .command('set <name>')
    .description('Set the active client')
    .action((name: string) => {
      const slug = name.toLowerCase().replace(/\s+/g, '-');
      const cfg = readConfig();
      cfg.activeClient = slug;
      writeConfig(cfg);
      const clientDir = path.join(os.homedir(), '.qai', 'clients', slug);
      fs.mkdirSync(clientDir, { recursive: true });
      success(`Active client → ${chalk.bold(slug)}`);
      hint(`  memory · ~/.qai/clients/${slug}/memory.json`);
    });

  cmd
    .command('show')
    .description('Show the active client')
    .action(() => {
      const cfg = readConfig();
      if (!cfg.activeClient) {
        console.log(chalk.dim('No active client  ·  run: qai context set <name>'));
      } else {
        console.log(
          chalk.green('●') +
            ' ' +
            chalk.bold(cfg.activeClient) +
            chalk.dim('  ·  active client'),
        );
      }
    });

  cmd
    .command('list')
    .description('List all known clients')
    .action(() => {
      const clients = listClients();
      const cfg = readConfig();

      if (clients.length === 0) {
        console.log(chalk.dim('No clients yet  ·  run: qai context set <name>'));
        return;
      }

      console.log('');
      for (const client of clients) {
        const isActive = client === cfg.activeClient;
        const marker = isActive ? chalk.green('●') : chalk.dim('○');
        const label = isActive ? chalk.bold(chalk.cyan(client)) : chalk.dim(client);
        const tag = isActive ? chalk.dim('  ·  active') : '';
        console.log(`  ${marker} ${label}${tag}`);
      }
      console.log('');
    });
}
