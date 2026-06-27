import { Command } from 'commander';
import { registerConfigCommands } from './commands/config.js';
import { registerContextCommands } from './commands/context.js';
import { registerMemoryCommands } from './commands/memory.js';
const program = new Command();

program
  .name('qai')
  .description('Quality Engineering AI Agent Harness')
  .version('0.1.0');

registerConfigCommands(program);
registerContextCommands(program);
registerMemoryCommands(program);

// No subcommand → launch interactive REPL
if (process.argv.length <= 2) {
  const { startRepl } = await import('./repl.js');
  await startRepl();
} else {
  program.parse(process.argv);
}
