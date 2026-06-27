import { LLMProvider } from '../llm/types.js';

export interface AgentContext {
  provider: LLMProvider;
  activeClient: string;
  onToolCall?: (toolName: string, input: Record<string, unknown>) => void;
}

export interface Agent<TInput, TOutput> {
  name: string;
  run(input: TInput, ctx: AgentContext): Promise<TOutput>;
}
