import fs from 'fs';
import path from 'path';
import os from 'os';
import { ClientMemory } from './types.js';

function emptyMemory(): ClientMemory {
  return {
    client: { name: '', industry: '', description: '' },
    features: [],
    businessRules: [],
    testConventions: [],
    updatedAt: new Date().toISOString(),
  };
}

export function getMemoryPath(clientName: string): string {
  return path.join(os.homedir(), '.qai', 'clients', clientName, 'memory.json');
}

export function readMemory(clientName: string): ClientMemory {
  const memPath = getMemoryPath(clientName);
  if (!fs.existsSync(memPath)) {
    return emptyMemory();
  }
  try {
    return JSON.parse(fs.readFileSync(memPath, 'utf8')) as ClientMemory;
  } catch {
    return emptyMemory();
  }
}

export function writeMemory(clientName: string, memory: ClientMemory): void {
  const memPath = getMemoryPath(clientName);
  fs.mkdirSync(path.dirname(memPath), { recursive: true });
  memory.updatedAt = new Date().toISOString();
  fs.writeFileSync(memPath, JSON.stringify(memory, null, 2), 'utf8');
}

export function listClients(): string[] {
  const clientsDir = path.join(os.homedir(), '.qai', 'clients');
  if (!fs.existsSync(clientsDir)) return [];
  return fs.readdirSync(clientsDir).filter((name) => {
    return fs.statSync(path.join(clientsDir, name)).isDirectory();
  });
}
