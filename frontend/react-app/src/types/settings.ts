import type { IntegrationStatus } from "./integration";

export interface AppSettings {
  application: {
    environment: string;
    backend: string;
    apiBaseUrl: string;
    version: string;
  };
  ai: {
    model: string;
    agentCore: string;
    region: string;
  };
  rag: {
    knowledgeBase: string;
    vectorStore: string;
    embeddingModel: string;
    topK: number;
  };
  enterpriseApis: {
    name: string;
    status: IntegrationStatus;
  }[];
}
