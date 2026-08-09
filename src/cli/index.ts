import { Command } from 'commander';
import { registerConfigCommands } from './commands/config.js';
import { registerContextCommands } from './commands/context.js';
import { registerMemoryCommands } from './commands/memory.js';
import { registerHarnessCommands } from './commands/harness.js';

const program = new Command();

program
  .name('qai')
  .description('Quality Engineering AI Agent Harness')
  .version('0.1.0');

registerConfigCommands(program);
registerContextCommands(program);
registerMemoryCommands(program);
registerHarnessCommands(program);

program.parse(process.argv);
