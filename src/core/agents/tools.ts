import { ToolDefinition } from '../llm/types.js';
import { readMemory } from '../memory/store.js';
import { queryMemory } from '../memory/query.js';

export const READ_MEMORY_TOOL: ToolDefinition = {
  name: 'read_memory',
  description:
    'Query the client memory for business rules, features, or test conventions relevant to your current task. Call this before drafting to retrieve client-specific context. You may call it multiple times with different queries.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          'A focused natural-language query for what you need, e.g. "payment validation rules" or "test conventions for this client"',
      },
    },
    required: ['query'],
  },
};

export function createToolExecutor(activeClient: string) {
  return async (toolName: string, input: Record<string, unknown>): Promise<string> => {
    if (toolName === 'read_memory') {
      const query = input.query as string;
      const memory = readMemory(activeClient);
      const results = queryMemory(memory, query);

      if (results.length === 0) {
        return 'No relevant entries found in memory for this query. Memory may be empty — use `qai memory add-rule` or `qai memory ingest` to populate it.';
      }

      return results.map((r) => r.content).join('\n');
    }

    throw new Error(`Unknown tool: ${toolName}`);
  };
}
