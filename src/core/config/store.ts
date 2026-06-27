import fs from 'fs';
import path from 'path';
import os from 'os';
import { QaiConfig, DEFAULT_CONFIG } from './types.js';

const CONFIG_PATH = path.join(os.homedir(), '.qai', 'config.json');

export function readConfig(): QaiConfig {
  if (!fs.existsSync(CONFIG_PATH)) {
    return structuredClone(DEFAULT_CONFIG);
  }
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return structuredClone(DEFAULT_CONFIG);
  }
}

export function writeConfig(config: QaiConfig): void {
  const dir = path.dirname(CONFIG_PATH);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
}
