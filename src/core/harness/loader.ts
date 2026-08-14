import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { NeutralAgentDef } from './types.js';

interface RawFrontmatter {
  name?: string;
  description?: string;
  version?: string | number;
  models?: Record<string, string>;
  tools?: string[];
  max_tokens?: number;
  memory_path?: string;
  output_path?: string;
}

function parseFrontmatter(raw: string): { frontmatter: RawFrontmatter; body: string } | null {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return null;
  try {
    const frontmatter = yaml.load(match[1]) as RawFrontmatter;
    return { frontmatter, body: match[2].trim() };
  } catch {
    return null;
  }
}

export function loadAgentDefs(dir: string): NeutralAgentDef[] {
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
  const defs: NeutralAgentDef[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    const parsed = parseFrontmatter(raw);
    if (!parsed) continue;

    const { frontmatter: fm, body } = parsed;
    if (!fm.name || !fm.description) continue;

    defs.push({
      name: fm.name,
      description: fm.description,
      version: String(fm.version ?? '1.0'),
      models: fm.models ?? {},
      tools: fm.tools ?? [],
      maxTokens: fm.max_tokens ?? 4096,
      memoryPath: fm.memory_path ?? './memory',
      outputPath: fm.output_path ?? './test-cases',
      systemPrompt: body,
    });
  }

  return defs;
}
