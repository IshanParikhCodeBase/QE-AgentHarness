import { ProviderTarget } from '../types.js';
import { HarnessAdapter } from './types.js';
import { ClaudeCodeAdapter } from './claude-code.js';
import { CodexAdapter } from './codex.js';
import { CopilotAdapter } from './copilot.js';

const ADAPTERS: Record<ProviderTarget, HarnessAdapter> = {
  'claude-code': new ClaudeCodeAdapter(),
  codex: new CodexAdapter(),
  copilot: new CopilotAdapter(),
};

export function getAdapter(target: ProviderTarget): HarnessAdapter {
  return ADAPTERS[target];
}

export const PROVIDER_TARGETS: ProviderTarget[] = ['claude-code', 'codex', 'copilot'];

export { HarnessAdapter };
