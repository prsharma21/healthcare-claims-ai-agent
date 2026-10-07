import { appConfig } from "@/lib/config";
import type { AppSettings } from "@/types/settings";

import { knowledgeBaseName } from "./ragEvidence";

export function getAppSettings(): AppSettings {
  return {
    application: {
      environment: appConfig.environment,
      backend: appConfig.useMockApi ? "Claims API (create) + mock data" : "FastAPI",
      apiBaseUrl: appConfig.apiBaseUrl,
      version: "0.1.0",
    },
    ai: {
      model: "Mock Bedrock Model",
      agentCore: "Not Connected",
      region: "ap-south-1 (planned)",
    },
    rag: {
      knowledgeBase: knowledgeBaseName,
      vectorStore: "Amazon OpenSearch Serverless (planned)",
      embeddingModel: "Mock Titan Embeddings",
      topK: 3,
    },
    enterpriseApis: [
      { name: "EHR", status: "CONNECTED" },
      { name: "Payer", status: "CONNECTED" },
      { name: "Coding", status: "CONNECTED" },
      { name: "Provider", status: "CONNECTED" },
    ],
  };
}
