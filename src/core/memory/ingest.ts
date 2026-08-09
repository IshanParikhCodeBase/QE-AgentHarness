import { LLMProvider } from '../llm/types.js';
import { appendRule, appendFeature, appendConvention } from './store.js';

interface ExtractedData {
  features: Array<{ name: string; description: string; tags: string[] }>;
  businessRules: Array<{ rule: string; context: string; tags: string[] }>;
  testConventions: Array<{ convention: string }>;
}

const EXTRACT_PROMPT = `Extract all features, business rules, and test conventions from the document below.

Definitions:
- Features: distinct product capabilities or user-facing functionality
- Business Rules: constraints, validations, or policies that govern system behavior
- Test Conventions: testing standards or quality expectations mentioned in the document

Return ONLY valid JSON — no markdown fences, no explanation — in exactly this shape:
{
  "features": [{ "name": "...", "description": "...", "tags": ["..."] }],
  "businessRules": [{ "rule": "...", "context": "when does this apply", "tags": ["..."] }],
  "testConventions": [{ "convention": "..." }]
}

If a category has no entries, return an empty array for it.

DOCUMENT:
`;

export interface IngestResult {
  features: number;
  businessRules: number;
  testConventions: number;
}

export async function ingestDocument(
  content: string,
  clientName: string,
  provider: LLMProvider,
): Promise<IngestResult> {
  const response = await provider.complete([
    { role: 'user', content: EXTRACT_PROMPT + content },
  ]);

  let extracted: ExtractedData;
  try {
    const clean = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    extracted = JSON.parse(clean) as ExtractedData;
  } catch {
    throw new Error('Could not parse structured data from LLM response. Try again or simplify the document.');
  }

  for (const f of extracted.features ?? []) {
    appendFeature(clientName, f.name, f.description, f.tags ?? []);
  }
  for (const r of extracted.businessRules ?? []) {
    appendRule(clientName, r.rule, r.context, r.tags ?? []);
  }
  for (const c of extracted.testConventions ?? []) {
    appendConvention(clientName, c.convention);
  }

  return {
    features: extracted.features?.length ?? 0,
    businessRules: extracted.businessRules?.length ?? 0,
    testConventions: extracted.testConventions?.length ?? 0,
  };
}
