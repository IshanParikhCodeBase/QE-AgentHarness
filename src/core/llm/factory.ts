import { QaiConfig } from '../config/types.js';
import { LLMProvider } from './types.js';
import { ClaudeProvider } from './claude.js';
import { OpenAIProvider } from './openai.js';
import { GeminiProvider } from './gemini.js';

export function getProvider(config: QaiConfig): LLMProvider {
  const provider = config.activeProvider;
  if (!provider) {
    throw new Error('No LLM provider configured. Run: qai config set-provider <claude|openai|gemini>');
  }
  const apiKey = config.apiKeys[provider];
  const model = config.defaultModels[provider];

  if (!apiKey) {
    throw new Error(
      `No API key set for "${provider}". Run: qai config set-key ${provider} <your-key>`,
    );
  }

  switch (provider) {
    case 'claude': return new ClaudeProvider(apiKey, model);
    case 'openai': return new OpenAIProvider(apiKey, model);
    case 'gemini': return new GeminiProvider(apiKey, model);
  }
}
