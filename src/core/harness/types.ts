export type ProviderTarget = 'claude-code' | 'codex' | 'copilot';

export interface NeutralAgentDef {
  name: string;
  description: string;
  version: string;
  /** Maps provider name → preferred model id */
  models: Partial<Record<string, string>>;
  /** Neutral tool names: read_memory, file_write */
  tools: string[];
  maxTokens: number;
  /** Relative path where memory files live, e.g. ./memory */
  memoryPath: string;
  /** Default output directory for agent artifacts, e.g. ./test-cases */
  outputPath: string;
  /** Raw body of the .md file (everything after the YAML frontmatter) */
  systemPrompt: string;
}

export interface GeneratedFile {
  /** Relative to the project root passed to the adapter */
  path: string;
  content: string;
}
