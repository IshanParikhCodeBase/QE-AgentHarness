import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Agent, AgentContext } from '../types.js';
import { runAgent } from '../runner.js';
import { READ_MEMORY_TOOL, FILE_WRITE_TOOL, createToolExecutor } from '../tools.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface ScenarioDrafterInput {
  featureDoc: string;
  outputFile: string;
  existingContent?: string;
}

export const ScenarioDrafterAgent: Agent<ScenarioDrafterInput, string> = {
  name: 'scenario-drafter',

  async run(input: ScenarioDrafterInput, ctx: AgentContext): Promise<string> {
    const skill = fs.readFileSync(path.join(__dirname, 'skill.md'), 'utf8');

    const existingSection = input.existingContent
      ? `[EXISTING TEST CASES]\n${input.existingContent}`
      : '[EXISTING TEST CASES]\nNone — this is a new file. Start numbering from 1.';

    const userMessage = [
      '[FEATURE DOCUMENT]',
      '',
      input.featureDoc,
      '',
      '[OUTPUT FILE]',
      input.outputFile,
      '',
      existingSection,
      '',
      'Begin by querying memory for relevant business context and test conventions, then generate exactly 25 test cases and write them to the output file.',
    ].join('\n');

    return runAgent(
      {
        skill,
        userMessage,
        tools: [READ_MEMORY_TOOL, FILE_WRITE_TOOL],
        executeTool: createToolExecutor(ctx.activeClient),
      },
      ctx,
    );
  },
};
