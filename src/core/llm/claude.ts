import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, Message, ToolDefinition, AgentLoopOptions } from './types.js';

export class ClaudeProvider implements LLMProvider {
  readonly name = 'claude' as const;
  private client: Anthropic;
  private defaultModel: string;

  constructor(apiKey: string, defaultModel: string) {
    this.client = new Anthropic({ apiKey });
    this.defaultModel = defaultModel;
  }

  async complete(messages: Message[], opts?: { model?: string; maxTokens?: number }): Promise<string> {
    const systemMsg = messages.find((m) => m.role === 'system');
    const nonSystem = messages.filter((m) => m.role !== 'system');

    const response = await this.client.messages.create({
      model: opts?.model ?? this.defaultModel,
      max_tokens: opts?.maxTokens ?? 4096,
      ...(systemMsg && { system: systemMsg.content }),
      messages: nonSystem.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    return response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
  }

  async runAgentLoop(
    messages: Message[],
    tools: ToolDefinition[],
    executeTool: (name: string, input: Record<string, unknown>) => Promise<string>,
    opts?: AgentLoopOptions,
  ): Promise<string> {
    const systemMsg = messages.find((m) => m.role === 'system');
    const history: Anthropic.MessageParam[] = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const anthropicTools: Anthropic.Tool[] = tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.inputSchema as Anthropic.Tool['input_schema'],
    }));

    while (true) {
      const response = await this.client.messages.create({
        model: opts?.model ?? this.defaultModel,
        max_tokens: opts?.maxTokens ?? 4096,
        ...(systemMsg && { system: systemMsg.content }),
        messages: history,
        tools: anthropicTools,
      });

      // Preserve full content (including tool_use blocks) in history
      history.push({ role: 'assistant', content: response.content });

      if (response.stop_reason === 'end_turn') {
        return response.content
          .filter((b): b is Anthropic.TextBlock => b.type === 'text')
          .map((b) => b.text)
          .join('');
      }

      if (response.stop_reason === 'tool_use') {
        const toolUseBlocks = response.content.filter(
          (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
        );
        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const block of toolUseBlocks) {
          const input = block.input as Record<string, unknown>;
          opts?.onToolCall?.(block.name, input);
          const result = await executeTool(block.name, input);
          toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result });
        }

        history.push({ role: 'user', content: toolResults });
      }
    }
  }
}
