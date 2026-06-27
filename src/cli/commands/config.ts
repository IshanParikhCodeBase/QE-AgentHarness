import { Command } from 'commander';
import chalk from 'chalk';
import { readConfig, writeConfig } from '../../core/config/store.js';
import { ProviderName } from '../../core/config/types.js';
import { success, failure } from '../ui.js';

const VALID_PROVIDERS: ProviderName[] = ['claude', 'openai', 'gemini'];

export function registerConfigCommands(program: Command): void {
  const cmd = program.command('config').description('Manage qai configuration');

  cmd
    .command('set-provider <provider>')
    .description('Set the active LLM provider (claude | openai | gemini)')
    .action((provider: string) => {
      if (!VALID_PROVIDERS.includes(provider as ProviderName)) {
        failure(`Unknown provider "${provider}". Choose: ${VALID_PROVIDERS.join(', ')}`);
        process.exit(1);
      }
      const cfg = readConfig();
      cfg.activeProvider = provider as ProviderName;
      writeConfig(cfg);
      success(`Active provider → ${chalk.bold(provider)}`);
    });

  cmd
    .command('set-key <provider> <key>')
    .description('Set the API key for a provider')
    .action((provider: string, key: string) => {
      if (!VALID_PROVIDERS.includes(provider as ProviderName)) {
        failure(`Unknown provider "${provider}". Choose: ${VALID_PROVIDERS.join(', ')}`);
        process.exit(1);
      }
      const cfg = readConfig();
      cfg.apiKeys[provider as ProviderName] = key;
      writeConfig(cfg);
      success(`API key saved for ${chalk.bold(provider)}`);
    });

  cmd
    .command('show')
    .description('Show current configuration')
    .action(() => {
      const cfg = readConfig();

      console.log('');
      console.log(chalk.bold('Configuration'));
      console.log(chalk.dim('─'.repeat(42)));
      console.log(
        `  LLM provider     ${chalk.dim('·')} ${cfg.activeProvider ? chalk.cyan(cfg.activeProvider) : chalk.dim('nil')}`,
      );

      console.log('');
      console.log(chalk.bold('  API Keys'));
      for (const p of VALID_PROVIDERS) {
        const key = cfg.apiKeys[p];
        const display = key
          ? chalk.green(`${key.slice(0, 6)}...${key.slice(-4)}`)
          : chalk.dim('not set');
        console.log(`  ${p.padEnd(10)} ${chalk.dim('·')} ${display}`);
      }

      console.log('');
      console.log(chalk.bold('  Default Models'));
      for (const [p, m] of Object.entries(cfg.defaultModels)) {
        console.log(`  ${p.padEnd(10)} ${chalk.dim('·')} ${chalk.dim(m)}`);
      }
      console.log('');
    });
}
