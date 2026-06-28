import fs from 'fs';
import path from 'path';
import { ToolDefinition } from '../llm/types.js';
import { readMemory } from '../memory/store.js';
import { queryMemory } from '../memory/query.js';

// ─── read_memory ──────────────────────────────────────────────────────────────

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
          'A focused natural-language query, e.g. "payment validation rules" or "test conventions for this client"',
      },
    },
    required: ['query'],
  },
};

// ─── file_write ───────────────────────────────────────────────────────────────

export const FILE_WRITE_TOOL: ToolDefinition = {
  name: 'file_write',
  description:
    'Write content to a file on disk. Use this to save generated test cases. Overwrites the file if it already exists.',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'File path to write to (absolute or relative to current working directory)',
      },
      content: {
        type: 'string',
        description: 'Complete file content to write',
      },
    },
    required: ['path', 'content'],
  },
};

// ─── Executor ─────────────────────────────────────────────────────────────────

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

    if (toolName === 'file_write') {
      const filePath = input.path as string;
      const content = input.content as string;
      const resolved = path.resolve(filePath);
      fs.mkdirSync(path.dirname(resolved), { recursive: true });
      fs.writeFileSync(resolved, content, 'utf8');
      return `Successfully wrote ${content.split('\n').length} lines to ${resolved}`;
    }

    throw new Error(`Unknown tool: ${toolName}`);
  };
}
