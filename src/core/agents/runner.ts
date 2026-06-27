import { Message, ToolDefinition } from '../llm/types.js';
import { AgentContext } from './types.js';

export interface RunnerInput {
  skill: string;
  userMessage: string;
  tools: ToolDefinition[];
  executeTool: (name: string, input: Record<string, unknown>) => Promise<string>;
  opts?: { model?: string; maxTokens?: number };
}

export async function runAgent(input: RunnerInput, ctx: AgentContext): Promise<string> {
  const messages: Message[] = [
    { role: 'system', content: input.skill },
    { role: 'user', content: input.userMessage },
  ];

  return ctx.provider.runAgentLoop(messages, input.tools, input.executeTool, {
    ...input.opts,
    onToolCall: ctx.onToolCall,
  });
}
