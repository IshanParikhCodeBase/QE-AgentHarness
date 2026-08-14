import fs from 'fs';
import path from 'path';

function getMemoryDir(): string {
  return path.join(process.cwd(), 'memory');
}

function ensureMemoryDir(): string {
  const dir = getMemoryDir();
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function countHeaders(filePath: string, prefix: string): number {
  if (!fs.existsSync(filePath)) return 0;
  const content = fs.readFileSync(filePath, 'utf8');
  return (content.match(new RegExp(`^## ${prefix}`, 'gm')) ?? []).length;
}

// ─── Rules ────────────────────────────────────────────────────────────────────

export function appendRule(rule: string, context: string, tags: string[]): void {
  const dir = ensureMemoryDir();
  const filePath = path.join(dir, 'rules.md');

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '# Business Rules\n', 'utf8');
  }

  const id = `BR-${String(countHeaders(filePath, 'BR-') + 1).padStart(3, '0')}`;
  const tagsLine = tags.length ? `\n**Tags:** ${tags.join(', ')}` : '';
  fs.appendFileSync(
    filePath,
    `\n## ${id}\n\n**Rule:** ${rule}\n**Applies when:** ${context}${tagsLine}\n`,
    'utf8',
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

export function appendFeature(name: string, description: string, tags: string[]): void {
  const dir = ensureMemoryDir();
  const filePath = path.join(dir, 'features.md');

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '# Features\n', 'utf8');
  }

  const tagsLine = tags.length ? `\n\n**Tags:** ${tags.join(', ')}` : '';
  fs.appendFileSync(filePath, `\n## ${name}\n\n${description}${tagsLine}\n`, 'utf8');
}

// ─── Conventions ──────────────────────────────────────────────────────────────

export function appendConvention(convention: string): void {
  const dir = ensureMemoryDir();
  const filePath = path.join(dir, 'conventions.md');

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '# Test Conventions\n\n', 'utf8');
  }

  fs.appendFileSync(filePath, `- ${convention}\n`, 'utf8');
}
