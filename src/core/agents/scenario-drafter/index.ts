import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Agent, AgentContext } from '../types.js';
import { runAgent } from '../runner.js';
import { READ_MEMORY_TOOL, createToolExecutor } from '../tools.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface ScenarioDrafterInput {
  featureDoc: string;
}

export const ScenarioDrafterAgent: Agent<ScenarioDrafterInput, string> = {
  name: 'scenario-drafter',

  async run(input: ScenarioDrafterInput, ctx: AgentContext): Promise<string> {
    const skill = fs.readFileSync(path.join(__dirname, 'skill.md'), 'utf8');
    const userMessage = [
      '[FEATURE DOCUMENT]',
      '',
      input.featureDoc,
      '',
      'Begin by querying memory for relevant business context and test conventions, then draft comprehensive test scenarios.',
    ].join('\n');

    return runAgent(
      {
        skill,
        userMessage,
        tools: [READ_MEMORY_TOOL],
        executeTool: createToolExecutor(ctx.activeClient),
      },
      ctx,
    );
  },
};
