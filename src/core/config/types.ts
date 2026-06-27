export type ProviderName = 'claude' | 'openai' | 'gemini';

export interface QaiConfig {
  activeProvider: ProviderName | null;
  activeClient: string | null;
  defaultModels: Record<ProviderName, string>;
  apiKeys: Partial<Record<ProviderName, string>>;
}

export const DEFAULT_CONFIG: QaiConfig = {
  activeProvider: null,
  activeClient: null,
  defaultModels: {
    claude: 'claude-sonnet-4-6',
    openai: 'gpt-4o',
    gemini: 'gemini-1.5-pro',
  },
  apiKeys: {},
};
