import readline from 'readline';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import fs from 'fs';
import { input } from '@inquirer/prompts';
import { readConfig, writeConfig } from '../core/config/store.js';
import { readMemory } from '../core/memory/store.js';
import { getProvider } from '../core/llm/factory.js';
import { ScenarioDrafterAgent } from '../core/agents/scenario-drafter/index.js';
import {
  printWorkingHeader,
  printToolCall,
  printDivider,
  renderMarkdown,
  createSpinner,
  success,
  failure,
  hint,
} from './ui.js';

// ─── PDF extraction ───────────────────────────────────────────────────────────

async function extractFileText(filePath: string): Promise<string | null> {
  const trimmed = filePath.trim();
  if (!trimmed) return null;

  if (!fs.existsSync(trimmed)) {
    hint(`  File not found, skipping: ${trimmed}`);
    return null;
  }

  const ext = path.extname(trimmed).toLowerCase();

  if (ext === '.pdf') {
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const buffer = fs.readFileSync(trimmed);
      const data = await pdfParse(buffer);
      return `[Attached: ${path.basename(trimmed)}]\n${data.text.trim()}`;
    } catch {
      hint(`  Could not extract text from PDF: ${path.basename(trimmed)}`);
      return null;
    }
  }

  // Plain text / markdown / other readable formats
  try {
    const content = fs.readFileSync(trimmed, 'utf8');
    return `[Attached: ${path.basename(trimmed)}]\n${content.trim()}`;
  } catch {
    hint(`  Could not read file: ${path.basename(trimmed)}`);
    return null;
  }
}

// ─── Banner ───────────────────────────────────────────────────────────────────

function printBanner(): void {
  const cfg = readConfig();
  const model = cfg.activeProvider ? cfg.defaultModels[cfg.activeProvider] : null;

  console.log('');
  console.log(chalk.bold(chalk.green('qai')) + chalk.dim('  ·  quality engineering agent'));
  console.log(chalk.dim('─'.repeat(process.stdout.columns || 80)));
  const providerDisplay = cfg.activeProvider
    ? chalk.dim(`${cfg.activeProvider}  (${model})`)
    : chalk.dim('nil  — run: qai config set-provider <claude|openai|gemini>');
  console.log(`  ${chalk.dim('LLM provider')}  ${chalk.dim('·')}  ${providerDisplay}`);
  console.log('');
  console.log(chalk.dim('  Type /draft-test-cases to get started.'));
  console.log(chalk.dim('  /context <name>  ·  /memory  ·  /help  ·  ctrl+c to exit'));
  console.log('');
}

// ─── Command handlers ─────────────────────────────────────────────────────────

function handleHelp(): void {
  console.log('');
  console.log(chalk.bold('Commands'));
  console.log(chalk.dim('─'.repeat(process.stdout.columns || 80)));
  console.log(`  ${chalk.cyan('/draft-test-cases')}  ${chalk.dim('·')}  Draft test scenarios for a feature`);
  console.log(`  ${chalk.cyan('/context <name>')}   ${chalk.dim('·')}  Switch active client`);
  console.log(`  ${chalk.cyan('/memory')}            ${chalk.dim('·')}  Show current client memory`);
  console.log(`  ${chalk.cyan('/config')}             ${chalk.dim('·')}  Show configuration`);
  console.log(`  ${chalk.cyan('/clear')}              ${chalk.dim('·')}  Clear the screen`);
  console.log(`  ${chalk.cyan('exit')} ${chalk.dim('/')} ${chalk.cyan('quit')}         ${chalk.dim('·')}  Exit qai`);
  console.log('');
}

function handleContext(arg: string): void {
  if (!arg) {
    hint('  Usage: /context <client-name>');
    return;
  }
  const slug = arg.toLowerCase().replace(/\s+/g, '-');
  const cfg = readConfig();
  cfg.activeClient = slug;
  writeConfig(cfg);
  fs.mkdirSync(path.join(os.homedir(), '.qai', 'clients', slug), { recursive: true });
  success(`Active client → ${chalk.bold(slug)}`);
}

function handleMemory(): void {
  const cfg = readConfig();
  if (!cfg.activeClient) {
    hint('  No active client  ·  run /context <name>');
    return;
  }
  const memory = readMemory(cfg.activeClient);
  console.log('');
  console.log(chalk.green('●') + ' ' + chalk.bold(cfg.activeClient) + chalk.dim('  ·  memory'));
  console.log(chalk.dim('─'.repeat(process.stdout.columns || 80)));
  if (memory.client.name) {
    console.log(`  ${chalk.dim('name')}      ${chalk.dim('·')}  ${memory.client.name}`);
    console.log(`  ${chalk.dim('industry')}  ${chalk.dim('·')}  ${memory.client.industry}`);
  } else {
    console.log(chalk.dim('  client info not set  ·  run: qai memory add-client'));
  }
  console.log('');
  console.log(`  ${chalk.bold('Features')}         ${chalk.dim(String(memory.features.length))}`);
  console.log(`  ${chalk.bold('Business Rules')}   ${chalk.dim(String(memory.businessRules.length))}`);
  console.log(`  ${chalk.bold('Test Conventions')} ${chalk.dim(String(memory.testConventions.length))}`);
  console.log('');
  hint('  run: qai memory show  for full detail');
}

function handleConfig(): void {
  const cfg = readConfig();
  console.log('');
  console.log(
    `  ${chalk.dim('LLM provider')}  ${chalk.dim('·')}  ` +
      (cfg.activeProvider ? chalk.cyan(cfg.activeProvider) : chalk.dim('nil')),
  );
  console.log(
    `  ${chalk.dim('model')}          ${chalk.dim('·')}  ` +
      (cfg.activeProvider ? chalk.dim(cfg.defaultModels[cfg.activeProvider]) : chalk.dim('nil')),
  );
  console.log('');
}

// ─── /draft-test-cases ────────────────────────────────────────────────────────

async function handleDraftTestCases(): Promise<void> {
  const cfg = readConfig();

  if (!cfg.activeClient) {
    failure('No active client  ·  run /context <name> first');
    return;
  }

  let provider;
  try {
    provider = getProvider(cfg);
  } catch (err) {
    failure((err as Error).message);
    return;
  }

  const W = process.stdout.columns || 80;

  // ── Step 1: Feature description ───────────────────────────────────────────
  console.log('');
  console.log(chalk.dim('─'.repeat(W)));
  console.log(chalk.bold('  Describe the feature'));
  console.log(chalk.dim('─'.repeat(W)));

  const featureDescription = await input({
    message: chalk.reset(''),
    theme: {
      prefix: chalk.cyan('>'),
      style: { answer: (t: string) => chalk.white(t) },
    },
  });

  if (!featureDescription.trim()) {
    hint('  No description provided, cancelling.');
    return;
  }

  // ── Step 2: Optional file attachments ─────────────────────────────────────
  console.log('');
  console.log(chalk.dim('─'.repeat(W)));
  console.log(chalk.bold('  Attach files') + chalk.dim('  ·  PDF or text  ·  optional'));
  console.log(chalk.dim('─'.repeat(W)));

  const file1Path = await input({
    message: chalk.reset('File 1  (press Enter to skip)'),
    theme: {
      prefix: chalk.cyan('>'),
      style: { answer: (t: string) => chalk.dim(t) },
    },
  });

  let file2Path = '';
  if (file1Path.trim()) {
    file2Path = await input({
      message: chalk.reset('File 2  (press Enter to skip)'),
      theme: {
        prefix: chalk.cyan('>'),
        style: { answer: (t: string) => chalk.dim(t) },
      },
    });
  }

  // ── Build feature doc ─────────────────────────────────────────────────────
  let featureDoc = featureDescription.trim();

  for (const filePath of [file1Path, file2Path]) {
    const extracted = await extractFileText(filePath);
    if (extracted) featureDoc += '\n\n' + extracted;
  }

  // ── Run agent ─────────────────────────────────────────────────────────────
  printWorkingHeader('Test Scenario Drafter');

  let spinner = createSpinner('consulting memory...');
  spinner.start();

  try {
    const result = await ScenarioDrafterAgent.run(
      { featureDoc },
      {
        provider,
        activeClient: cfg.activeClient,
        onToolCall: (_toolName, toolInput) => {
          spinner.stop();
          printToolCall('read_memory', (toolInput as { query: string }).query);
          spinner = createSpinner('processing...');
          spinner.start();
        },
      },
    );

    spinner.stop();
    printDivider();
    console.log(renderMarkdown(result));
    printDivider();
  } catch (err) {
    spinner.stop();
    failure((err as Error).message);
  }
}

// ─── REPL entry point ─────────────────────────────────────────────────────────

export async function startRepl(): Promise<void> {
  printBanner();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: process.stdin.isTTY ?? true,
  });

  rl.on('SIGINT', () => {
    console.log('\n\n' + chalk.dim('Goodbye.') + '\n');
    rl.close();
    process.exit(0);
  });

  const line = () => chalk.dim('─'.repeat(process.stdout.columns || 80));
  const statusBar = () =>
    chalk.dim('  ►► /draft-test-cases to draft  ·  /help for all commands  ·  ctrl+c to exit');

  const prompt = () => {
    process.stdout.write('\n' + line() + '\n' + chalk.cyan('> ') + chalk.reset(''));
  };

  const askLine = (): Promise<string | null> =>
    new Promise((resolve) => {
      prompt();
      rl.once('line', (userLine) => {
        process.stdout.write(line() + '\n' + statusBar() + '\n');
        resolve(userLine);
      });
      rl.once('close', () => resolve(null));
    });

  while (true) {
    const firstLine = await askLine();

    if (firstLine === null) {
      console.log('\n' + chalk.dim('Goodbye.') + '\n');
      break;
    }

    const trimmed = firstLine.trim();
    if (!trimmed) continue;

    if (trimmed === 'exit' || trimmed === 'quit') {
      console.log('\n' + chalk.dim('Goodbye.') + '\n');
      rl.close();
      break;
    }

    if (trimmed === '/draft-test-cases') {
      // Pause the main rl while inquirer prompts are active
      rl.pause();
      await handleDraftTestCases();
      rl.resume();
      console.log('');
      continue;
    }

    if (trimmed === '/help') { handleHelp(); continue; }
    if (trimmed.startsWith('/context')) { handleContext(trimmed.slice('/context'.length).trim()); continue; }
    if (trimmed === '/memory') { handleMemory(); continue; }
    if (trimmed === '/config') { handleConfig(); continue; }

    if (trimmed === '/clear') {
      console.clear();
      printBanner();
      continue;
    }

    if (trimmed.startsWith('/')) {
      hint(`  Unknown command "${trimmed}"  ·  type /help`);
      continue;
    }

    hint(`  Type /draft-test-cases to draft test scenarios  ·  /help for all commands`);
  }
}
