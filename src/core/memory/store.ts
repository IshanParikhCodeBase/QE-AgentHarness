import fs from 'fs';
import path from 'path';

function getClientDir(clientName: string): string {
  return path.join(process.cwd(), 'harness', 'memory', clientName);
}

function ensureClientDir(clientName: string): string {
  const dir = getClientDir(clientName);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function countHeaders(filePath: string, prefix: string): number {
  if (!fs.existsSync(filePath)) return 0;
  const content = fs.readFileSync(filePath, 'utf8');
  return (content.match(new RegExp(`^## ${prefix}`, 'gm')) ?? []).length;
}

// ─── Rules ────────────────────────────────────────────────────────────────────

export function appendRule(clientName: string, rule: string, context: string, tags: string[]): void {
  const dir = ensureClientDir(clientName);
  const filePath = path.join(dir, 'rules.md');

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, `# Business Rules — ${clientName}\n`, 'utf8');
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

export function appendFeature(clientName: string, name: string, description: string, tags: string[]): void {
  const dir = ensureClientDir(clientName);
  const filePath = path.join(dir, 'features.md');

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, `# Features — ${clientName}\n`, 'utf8');
  }

  const tagsLine = tags.length ? `\n\n**Tags:** ${tags.join(', ')}` : '';
  fs.appendFileSync(filePath, `\n## ${name}\n\n${description}${tagsLine}\n`, 'utf8');
}

// ─── Conventions ──────────────────────────────────────────────────────────────

export function appendConvention(clientName: string, convention: string): void {
  const dir = ensureClientDir(clientName);
  const filePath = path.join(dir, 'conventions.md');

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, `# Test Conventions — ${clientName}\n\n`, 'utf8');
  }

  fs.appendFileSync(filePath, `- ${convention}\n`, 'utf8');
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export function readMemoryFile(
  clientName: string,
  filename: 'rules.md' | 'features.md' | 'conventions.md',
): string | null {
  const filePath = path.join(getClientDir(clientName), filename);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

// ─── Clients ──────────────────────────────────────────────────────────────────

export function listClients(): string[] {
  const memoryDir = path.join(process.cwd(), 'harness', 'memory');
  if (!fs.existsSync(memoryDir)) return [];
  return fs.readdirSync(memoryDir).filter((name) => {
    return fs.statSync(path.join(memoryDir, name)).isDirectory();
  });
}
