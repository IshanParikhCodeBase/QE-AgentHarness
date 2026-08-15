import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import { loadAgentDefs } from '../../core/harness/loader.js';

const AGENTS_DIR = 'agents';

function resolveProjectRoot(rootOpt?: string): string {
  return rootOpt ? path.resolve(rootOpt) : process.cwd();
}

export function registerAgentCommands(program: Command): void {
  const cmd = program.command('agent').description('Inspect neutral agent definitions');

  // ── agent list ────────────────────────────────────────────────────────────
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
}
