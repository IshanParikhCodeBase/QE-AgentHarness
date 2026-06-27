import { ClientMemory } from './types.js';

export interface QueryEntry {
  type: 'feature' | 'businessRule' | 'testConvention';
  content: string;
  score: number;
}

export function queryMemory(memory: ClientMemory, query: string): QueryEntry[] {
  const keywords = query.toLowerCase().split(/\s+/).filter(Boolean);
  const results: QueryEntry[] = [];

  for (const feature of memory.features) {
    const text = `${feature.name} ${feature.description} ${feature.tags.join(' ')}`.toLowerCase();
    const score = keywords.filter((kw) => text.includes(kw)).length;
    if (score > 0) {
      results.push({
        type: 'feature',
        content: `Feature — ${feature.name}: ${feature.description}${feature.tags.length ? ` [tags: ${feature.tags.join(', ')}]` : ''}`,
        score,
      });
    }
  }

  for (const rule of memory.businessRules) {
    const text = `${rule.rule} ${rule.context} ${rule.tags.join(' ')}`.toLowerCase();
    const score = keywords.filter((kw) => text.includes(kw)).length;
    if (score > 0) {
      results.push({
        type: 'businessRule',
        content: `Business Rule — ${rule.rule} (applies when: ${rule.context})${rule.tags.length ? ` [tags: ${rule.tags.join(', ')}]` : ''}`,
        score,
      });
    }
  }

  for (const conv of memory.testConventions) {
    const text = conv.convention.toLowerCase();
    const score = keywords.filter((kw) => text.includes(kw)).length;
    if (score > 0) {
      results.push({
        type: 'testConvention',
        content: `Test Convention — ${conv.convention}`,
        score,
      });
    }
  }

  // If no keyword matches, return all business rules and conventions as general context
  if (results.length === 0) {
    for (const rule of memory.businessRules) {
      results.push({
        type: 'businessRule',
        content: `Business Rule — ${rule.rule} (applies when: ${rule.context})`,
        score: 0,
      });
    }
    for (const conv of memory.testConventions) {
      results.push({
        type: 'testConvention',
        content: `Test Convention — ${conv.convention}`,
        score: 0,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 10);
}
