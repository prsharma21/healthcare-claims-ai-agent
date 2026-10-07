import type { RAGEvidence, RAGSource } from "@/types/rag";
import { formatDate } from "@/utils/format";

import type { ClaimContext, OutcomeScenario } from "./agents";

export const knowledgeBaseName = "Mock Knowledge Base (claims-policies-kb)";

type SourceTemplate = Omit<RAGSource, "id">;

interface EvidenceTemplate {
  query: string;
  answer: string;
  sources: SourceTemplate[];
}

/** Retrieval results the (future) Bedrock Knowledge Base would return for each decision scenario. */
function evidenceTemplate(ctx: ClaimContext, scenario: OutcomeScenario): EvidenceTemplate {
  const { claim, policy, payer } = ctx;
  const p = payer.shortCode;
  const careType = claim.claimType.toLowerCase();
  const diagnosis = claim.diagnosisName.toLowerCase();

  switch (scenario) {
    case "APPROVED":
      return {
        query: `Is ${careType} ${diagnosis} treatment covered under ${policy.id}?`,
        answer: `Yes. ${policy.id} covers ${careType} treatment for ${diagnosis} at ${policy.coveragePercent}% while the member is active, and CPT ${claim.procedureCode} does not require prior authorization.`,
        sources: [
          {
            documentName: `policy_${p}_${careType}.pdf`,
            documentType: "POLICY",
            page: 12,
            section: `Section 4.2 - Covered ${careType} services`,
            relevanceScore: 0.92,
            excerpt: `Eligible ${careType} ${diagnosis} treatment is covered at ${policy.coveragePercent}% of allowed charges after the member deductible, provided the member is active on the date of service. Initial and subsequent care (including CPT ${claim.procedureCode}) does not require prior authorization.`,
          },
          {
            documentName: "claims_processing_rules.pdf",
            documentType: "CLAIMS_RULES",
            page: 4,
            section: "Rule 2.1 - Automated adjudication",
            relevanceScore: 0.87,
            excerpt:
              "Claims with valid ICD-10 and CPT codes, active member eligibility, satisfied authorization requirements and a fraud score below 0.30 may be approved through automated adjudication.",
          },
          {
            documentName: `policy_${p}_general.pdf`,
            documentType: "POLICY",
            page: 3,
            section: "Section 1.3 - Eligibility",
            relevanceScore: 0.81,
            excerpt:
              "Benefits are payable only for services rendered while the member's policy is active and premiums are paid up to date. Coverage percentages are applied to the allowed amount.",
          },
        ],
      };
    case "DENIED_INELIGIBLE":
      return {
        query: `Is member ${claim.patientId} eligible for coverage under ${policy.id} on ${formatDate(claim.dateOfService)}?`,
        answer: `No. ${policy.id} ended on ${formatDate(policy.effectiveTo)}. Services after the termination date are not payable.`,
        sources: [
          {
            documentName: `policy_${p}_general.pdf`,
            documentType: "POLICY",
            page: 5,
            section: "Section 2.4 - Termination of coverage",
            relevanceScore: 0.94,
            excerpt:
              "Coverage ends at 23:59 on the policy end date or on the date premiums lapse, whichever is earlier. No benefits are payable for services received after coverage ends.",
          },
          {
            documentName: "claims_processing_rules.pdf",
            documentType: "CLAIMS_RULES",
            page: 6,
            section: "Rule 3.1 - Eligibility denials",
            relevanceScore: 0.89,
            excerpt:
              "If the member is not eligible on the date of service, the claim must be denied with reason code ELG-01. Eligibility denials are not eligible for automated reprocessing.",
          },
          {
            documentName: "member_eligibility_faq.pdf",
            documentType: "FAQ",
            page: 2,
            section: "Q7 - Reinstating a lapsed policy",
            relevanceScore: 0.76,
            excerpt:
              "A lapsed policy may be reinstated within 90 days by paying outstanding premiums. Reinstatement does not cover services received during the lapse period.",
          },
        ],
      };
    case "DENIED_NOT_COVERED":
      return {
        query: `Is CPT ${claim.procedureCode} (${claim.procedureDescription.toLowerCase()}) covered under ${policy.id}?`,
        answer: `No. CPT ${claim.procedureCode} is a cosmetic procedure and is listed as an exclusion in ${policy.id}.`,
        sources: [
          {
            documentName: `policy_${p}_exclusions.pdf`,
            documentType: "POLICY",
            page: 2,
            section: "Section 7.1 - Cosmetic procedures",
            relevanceScore: 0.95,
            excerpt:
              "Procedures performed primarily to improve appearance, including chemical peels (CPT 15788-15793) and dermabrasion, are excluded unless required to treat a covered injury or illness.",
          },
          {
            documentName: "cpt_coding_reference.pdf",
            documentType: "CODING_REFERENCE",
            page: 41,
            section: "Integumentary system - 15788",
            relevanceScore: 0.84,
            excerpt: "CPT 15788: Chemical peel, facial; epidermal. Typically reported for cosmetic indications.",
          },
          {
            documentName: "claims_processing_rules.pdf",
            documentType: "CLAIMS_RULES",
            page: 7,
            section: "Rule 3.4 - Excluded services",
            relevanceScore: 0.8,
            excerpt: "Claims for excluded services must be denied with reason code EXC-02 and the exclusion clause cited in the denial letter.",
          },
        ],
      };
    case "REQUEST_INFO_AUTHORIZATION":
      return {
        query: `Does CPT ${claim.procedureCode} require prior authorization under ${policy.id}?`,
        answer: `Yes. CPT ${claim.procedureCode} requires prior authorization under ${policy.id}. Without an authorization reference the claim must be pended for information.`,
        sources: [
          {
            documentName: "prior_authorization_rules.pdf",
            documentType: "CLAIMS_RULES",
            page: 3,
            section: "Table 1 - Procedures requiring authorization",
            relevanceScore: 0.93,
            excerpt: `Elective surgical procedures including total knee arthroplasty (CPT 27447) and laparoscopic cholecystectomy (CPT 47562) require prior authorization before the date of service.`,
          },
          {
            documentName: `policy_${p}_surgical.pdf`,
            documentType: "POLICY",
            page: 9,
            section: "Section 5.3 - Planned surgery",
            relevanceScore: 0.86,
            excerpt: `Planned inpatient surgery is covered at ${policy.coveragePercent}% when prior authorization has been obtained. Claims without authorization will be pended and the provider asked to supply it.`,
          },
          {
            documentName: "clinical_guidelines_surgical.pdf",
            documentType: "CLINICAL_GUIDELINE",
            page: 14,
            section: "Medical necessity criteria",
            relevanceScore: 0.74,
            excerpt: "Documentation should include conservative treatment history, imaging results and functional assessment supporting medical necessity.",
          },
        ],
      };
    case "REQUEST_INFO_DOCUMENTS":
      return {
        query: `What documentation is required to adjudicate an ${careType} claim under ${policy.id}?`,
        answer: "A signed claim form with the attending physician's name and an itemized bill are mandatory. Incomplete claims must be pended for information.",
        sources: [
          {
            documentName: "claims_documentation_requirements.pdf",
            documentType: "CLAIMS_RULES",
            page: 2,
            section: "Section 1 - Mandatory documents",
            relevanceScore: 0.91,
            excerpt:
              "Every claim must include: a claim form signed by the treating provider, the attending physician's name, and an itemized bill showing each service and charge.",
          },
          {
            documentName: "claims_processing_rules.pdf",
            documentType: "CLAIMS_RULES",
            page: 5,
            section: "Rule 2.6 - Incomplete claims",
            relevanceScore: 0.85,
            excerpt: "If mandatory fields are missing, set the claim to Request Information and notify the provider within 2 business days.",
          },
          {
            documentName: "provider_billing_faq.pdf",
            documentType: "FAQ",
            page: 4,
            section: "Q12 - Why was my claim pended?",
            relevanceScore: 0.72,
            excerpt: "The most common reasons for pended claims are missing signatures, missing itemized bills and missing authorization numbers.",
          },
        ],
      };
    case "FRAUD_DUPLICATE":
      return {
        query: "What is the policy for duplicate claim submissions?",
        answer: "Claims matching a previously paid claim on patient, provider, procedure and date of service must be held and routed for fraud review.",
        sources: [
          {
            documentName: "fraud_waste_abuse_policy.pdf",
            documentType: "CLAIMS_RULES",
            page: 6,
            section: "Section 3.1 - Duplicate billing",
            relevanceScore: 0.95,
            excerpt:
              "A claim is a suspected duplicate when the patient, provider, procedure code and date of service match a previously processed claim. Suspected duplicates must not be paid and are referred to the Special Investigations Unit.",
          },
          {
            documentName: "claims_processing_rules.pdf",
            documentType: "CLAIMS_RULES",
            page: 9,
            section: "Rule 4.2 - Fraud score thresholds",
            relevanceScore: 0.88,
            excerpt: "Claims with a fraud score of 0.70 or higher are set to Fraud Review and excluded from automated adjudication.",
          },
          {
            documentName: `policy_${p}_${careType}.pdf`,
            documentType: "POLICY",
            page: 12,
            section: `Section 4.2 - Covered ${careType} services`,
            relevanceScore: 0.71,
            excerpt: `Eligible ${careType} ${diagnosis} treatment is covered at ${policy.coveragePercent}% of allowed charges.`,
          },
        ],
      };
    case "FRAUD_PATTERN":
      return {
        query: `What billing patterns should trigger fraud review for CPT ${claim.procedureCode}?`,
        answer: `Amounts far above the expected range for CPT ${claim.procedureCode}, combined with provider billing well above peers, require fraud review.`,
        sources: [
          {
            documentName: "fraud_waste_abuse_policy.pdf",
            documentType: "CLAIMS_RULES",
            page: 8,
            section: "Section 3.4 - Upcoding and excessive billing",
            relevanceScore: 0.93,
            excerpt:
              "Billing more than 3 times the expected amount for a procedure, or provider volumes more than 3 times the peer average, are indicators of excessive billing.",
          },
          {
            documentName: "cpt_coding_reference.pdf",
            documentType: "CODING_REFERENCE",
            page: 88,
            section: "Physical medicine - 97110",
            relevanceScore: 0.83,
            excerpt: "CPT 97110: Therapeutic exercises, each 15 minutes. Typical sessions bill 2 to 4 units.",
          },
          {
            documentName: "provider_billing_faq.pdf",
            documentType: "FAQ",
            page: 6,
            section: "Q18 - Fraud review holds",
            relevanceScore: 0.7,
            excerpt: "Claims on fraud review hold are reviewed within 10 business days. Providers may be asked for treatment notes and attendance records.",
          },
        ],
      };
  }
}

export function buildRagEvidence(ctx: ClaimContext, scenario: OutcomeScenario, retrievedAt: string): RAGEvidence {
  const template = evidenceTemplate(ctx, scenario);
  return {
    claimId: ctx.claim.id,
    query: template.query,
    answer: template.answer,
    knowledgeBase: knowledgeBaseName,
    retrievedAt,
    retrievalLatencyMs: 380 + template.query.length * 3,
    topK: template.sources.length,
    sources: template.sources.map((source, index) => ({ ...source, id: `${ctx.claim.id}-SRC-${index + 1}` })),
  };
}
