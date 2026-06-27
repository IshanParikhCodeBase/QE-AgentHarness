import chalk from 'chalk';
import ora, { type Ora } from 'ora';

// ─── Symbols ────────────────────────────────────────────────────────────────

const SYM = {
  work: '●',
  tool: '⎿',
  check: '✓',
  cross: '✗',
  dot: '·',
  bullet: '•',
  subBullet: '◦',
};

// ─── Working header ──────────────────────────────────────────────────────────

export function printWorkingHeader(agentName: string): void {
  console.log('');
  console.log(chalk.green(SYM.work) + ' ' + chalk.bold(agentName));
}

// ─── Tool call line ──────────────────────────────────────────────────────────

export function printToolCall(toolName: string, query: string): void {
  console.log(
    `  ${chalk.green(SYM.tool)} ` +
      chalk.bold(toolName) +
      `  ` +
      chalk.dim(`"${query}"`),
  );
}

// ─── Spinner (used between tool calls) ───────────────────────────────────────

export function createSpinner(text: string): Ora {
  return ora({
    text: chalk.dim(text),
    indent: 2,
    color: 'green',
    spinner: 'dots',
  });
}

// ─── Divider ─────────────────────────────────────────────────────────────────

export function printDivider(): void {
  console.log('\n' + chalk.dim('─'.repeat(60)) + '\n');
}

// ─── Markdown renderer ────────────────────────────────────────────────────────
//
// Handles the subset of markdown produced by the scenario drafter:
//   ### headers, **bold**, *italic*, `code`, - bullets, 1. numbered, ---

export function renderMarkdown(text: string): string {
  return text
    .split('\n')
    .map(renderLine)
    .join('\n');
}

function renderLine(line: string): string {
  // H3 / H2 / H1 — add blank line before for breathing room
  if (/^### /.test(line)) return '\n' + chalk.bold(chalk.cyan(line.slice(4)));
  if (/^## /.test(line)) return '\n' + chalk.bold(chalk.cyan(line.slice(3)));
  if (/^# /.test(line)) return '\n' + chalk.bold(chalk.underline(chalk.cyan(line.slice(2))));

  // Horizontal rule
  if (/^---+$/.test(line.trim())) return chalk.dim('─'.repeat(60));

  // Numbered list: "1. ..."
  const numMatch = line.match(/^(\s*)(\d+)\.\s+(.*)/);
  if (numMatch) {
    const [, indent, num, rest] = numMatch;
    return `${indent}${chalk.dim(num + '.')} ${renderInline(rest)}`;
  }

  // Nested bullet: "  - ..."
  if (/^ {2,}- /.test(line)) {
    const content = line.replace(/^ {2,}- /, '');
    return `    ${chalk.dim(SYM.subBullet)} ${renderInline(content)}`;
  }

  // Top-level bullet: "- ..."
  if (/^- /.test(line)) {
    return `  ${chalk.green(SYM.bullet)} ${renderInline(line.slice(2))}`;
  }

  return renderInline(line);
}

function renderInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, (_, t: string) => chalk.bold(t))
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, (_, t: string) => chalk.italic(t))
    .replace(/`(.+?)`/g, (_, t: string) => chalk.bgBlack(chalk.white(` ${t} `)));
}

// ─── Status messages ──────────────────────────────────────────────────────────

export function success(msg: string): void {
  console.log(chalk.green(SYM.check) + ' ' + msg);
}

export function failure(msg: string): void {
  console.log(chalk.red(SYM.cross) + ' ' + msg);
}

export function hint(msg: string): void {
  console.log(chalk.dim(msg));
}
