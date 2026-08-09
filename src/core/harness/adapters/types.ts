import { NeutralAgentDef, GeneratedFile, ProviderTarget } from '../types.js';

export interface HarnessAdapter {
  readonly providerTarget: ProviderTarget;
  /**
   * Translate neutral agent definitions into provider-native files.
   * Returns paths relative to projectRoot.
   */
  generate(defs: NeutralAgentDef[], projectRoot: string): GeneratedFile[];
}

/**
 * Maps neutral tool names to the native tool name for each provider target.
 * null means the provider uses shell commands or file reads instead of a named tool.
 */
export const TOOL_MAP: Record<ProviderTarget, Record<string, string | null>> = {
  'claude-code': {
    read_memory: 'Read',
    file_write: 'Write',
  },
  codex: {
    read_memory: null,
    file_write: null,
  },
  copilot: {
    read_memory: 'Read',
    file_write: 'Write',
  },
};

/** Resolve neutral tool names to provider-native names, dropping nulls. */
export function resolveTools(neutralTools: string[], target: ProviderTarget): string[] {
  const map = TOOL_MAP[target];
  const resolved = new Set<string>();
  for (const t of neutralTools) {
    const native = map[t];
    if (native) resolved.add(native);
  }
  return [...resolved];
}
