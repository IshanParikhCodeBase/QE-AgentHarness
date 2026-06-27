import OpenAI from 'openai';
import { LLMProvider, Message, ToolDefinition, AgentLoopOptions } from './types.js';

export class OpenAIProvider implements LLMProvider {
  readonly name = 'openai' as const;
  private client: OpenAI;
  private defaultModel: string;

  constructor(apiKey: string, defaultModel: string) {
    this.client = new OpenAI({ apiKey });
    this.defaultModel = defaultModel;
  }

  async complete(messages: Message[], opts?: { model?: string; maxTokens?: number }): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: opts?.model ?? this.defaultModel,
      max_tokens: opts?.maxTokens ?? 4096,
      messages: messages.map((m) => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      })),
    });
    return response.choices[0]?.message?.content ?? '';
  }

  async runAgentLoop(
    messages: Message[],
    tools: ToolDefinition[],
    executeTool: (name: string, input: Record<string, unknown>) => Promise<string>,
    opts?: AgentLoopOptions,
  ): Promise<string> {
    const history: OpenAI.Chat.ChatCompletionMessageParam[] = messages.map((m) => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    }));

    const openaiTools: OpenAI.Chat.ChatCompletionTool[] = tools.map((t) => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.inputSchema,
      },
    }));

    while (true) {
      const response = await this.client.chat.completions.create({
        model: opts?.model ?? this.defaultModel,
        max_tokens: opts?.maxTokens ?? 4096,
        messages: history,
        tools: openaiTools,
        tool_choice: 'auto',
      });

      const message = response.choices[0].message;
      history.push(message);

      if (!message.tool_calls || message.tool_calls.length === 0) {
        return message.content ?? '';
      }

      for (const call of message.tool_calls) {
        const input = JSON.parse(call.function.arguments) as Record<string, unknown>;
        opts?.onToolCall?.(call.function.name, input);
        const result = await executeTool(call.function.name, input);
        history.push({ role: 'tool', tool_call_id: call.id, content: result });
      }
    }
  }
}
