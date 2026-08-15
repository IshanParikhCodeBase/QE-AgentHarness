import { Command } from 'commander';
import { registerMemoryCommands } from './commands/memory.js';
import { registerHarnessCommands } from './commands/harness.js';
import { registerAgentCommands } from './commands/agent.js';

const program = new Command();

program
  .name('qai')
  .description('Quality Engineering AI Agent Harness')
  .version('0.1.0');

registerMemoryCommands(program);
registerHarnessCommands(program);
registerAgentCommands(program);

program.parse(process.argv);
