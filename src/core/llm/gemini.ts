import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { LLMProvider, Message, ToolDefinition, AgentLoopOptions } from './types.js';

export class GeminiProvider implements LLMProvider {
  readonly name = 'gemini' as const;
  private client: GoogleGenerativeAI;
  private defaultModel: string;

  constructor(apiKey: string, defaultModel: string) {
    this.client = new GoogleGenerativeAI(apiKey);
    this.defaultModel = defaultModel;
  }

  async complete(messages: Message[], opts?: { model?: string; maxTokens?: number }): Promise<string> {
    const systemMsg = messages.find((m) => m.role === 'system');
    const nonSystem = messages.filter((m) => m.role !== 'system');

    const model = this.client.getGenerativeModel({
      model: opts?.model ?? this.defaultModel,
      ...(systemMsg && { systemInstruction: systemMsg.content }),
      generationConfig: { maxOutputTokens: opts?.maxTokens ?? 4096 },
    });

    const history = nonSystem.slice(0, -1).map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history });
    const last = nonSystem[nonSystem.length - 1];
    const result = await chat.sendMessage(last.content);
    return result.response.text();
  }

  async runAgentLoop(
    messages: Message[],
    tools: ToolDefinition[],
    executeTool: (name: string, input: Record<string, unknown>) => Promise<string>,
    opts?: AgentLoopOptions,
  ): Promise<string> {
    const systemMsg = messages.find((m) => m.role === 'system');
    const nonSystem = messages.filter((m) => m.role !== 'system');

    const model = this.client.getGenerativeModel({
      model: opts?.model ?? this.defaultModel,
      ...(systemMsg && { systemInstruction: systemMsg.content }),
      generationConfig: { maxOutputTokens: opts?.maxTokens ?? 4096 },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [{ functionDeclarations: tools.map((t) => ({ name: t.name, description: t.description, parameters: t.inputSchema as any })) }],
    });

    const history = nonSystem.slice(0, -1).map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history });
    const last = nonSystem[nonSystem.length - 1];
    let result = await chat.sendMessage(last.content);

    while (true) {
      const functionCalls = result.response.functionCalls();
      if (!functionCalls || functionCalls.length === 0) {
        return result.response.text();
      }

      const responseParts: Part[] = [];
      for (const call of functionCalls) {
        const input = call.args as Record<string, unknown>;
        opts?.onToolCall?.(call.name, input);
        const toolResult = await executeTool(call.name, input);
        responseParts.push({
          functionResponse: {
            name: call.name,
            response: { result: toolResult },
          },
        });
      }

      result = await chat.sendMessage(responseParts);
    }
  }
}
