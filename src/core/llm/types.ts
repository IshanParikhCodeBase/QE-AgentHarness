export type ProviderName = 'claude' | 'openai' | 'gemini';

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface AgentLoopOptions {
  model?: string;
  maxTokens?: number;
  onToolCall?: (toolName: string, input: Record<string, unknown>) => void;
}

export interface LLMProvider {
  name: ProviderName;
  complete(messages: Message[], opts?: { model?: string; maxTokens?: number }): Promise<string>;
  runAgentLoop(
    messages: Message[],
    tools: ToolDefinition[],
    executeTool: (name: string, input: Record<string, unknown>) => Promise<string>,
    opts?: AgentLoopOptions,
  ): Promise<string>;
}
