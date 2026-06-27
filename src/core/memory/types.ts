export interface Feature {
  id: string;
  name: string;
  description: string;
  tags: string[];
  addedAt: string;
}

export interface BusinessRule {
  id: string;
  rule: string;
  context: string;
  tags: string[];
  addedAt: string;
}

export interface TestConvention {
  id: string;
  convention: string;
  addedAt: string;
}

export interface ClientInfo {
  name: string;
  industry: string;
  description: string;
}

export interface ClientMemory {
  client: ClientInfo;
  features: Feature[];
  businessRules: BusinessRule[];
  testConventions: TestConvention[];
  updatedAt: string;
}
