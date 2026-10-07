export type RAGDocumentType = "POLICY" | "CLAIMS_RULES" | "CLINICAL_GUIDELINE" | "CODING_REFERENCE" | "FAQ";

export interface RAGSource {
  id: string;
  documentName: string;
  documentType: RAGDocumentType;
  page: number;
  section: string;
  /** 0 to 1 */
  relevanceScore: number;
  excerpt: string;
}

export interface RAGEvidence {
  claimId: string;
  query: string;
  /** Grounded answer produced from the retrieved sources. */
  answer: string;
  knowledgeBase: string;
  retrievedAt: string;
  retrievalLatencyMs: number;
  topK: number;
  sources: RAGSource[];
}
