import { FraudRiskCard } from "@/components/fraud/FraudRiskCard";
import type { AgentResult } from "@/types/agent";

import { DecisionCard } from "./DecisionCard";
import { CodingAgentDetails } from "./details/CodingAgentDetails";
import { DocumentAgentDetails } from "./details/DocumentAgentDetails";
import { PolicyAgentDetails } from "./details/PolicyAgentDetails";

interface AgentDetailsProps {
  result: AgentResult;
  onViewRagEvidence?: () => void;
}

/** Renders the findings of one agent, based on the agent type. */
export function AgentDetails({ result, onViewRagEvidence }: AgentDetailsProps) {
  switch (result.agent) {
    case "DOCUMENT":
      return <DocumentAgentDetails result={result} />;
    case "POLICY":
      return <PolicyAgentDetails result={result} onViewRagEvidence={onViewRagEvidence} />;
    case "CODING":
      return <CodingAgentDetails result={result} />;
    case "FRAUD":
      return <FraudRiskCard analysis={result.analysis} embedded />;
    case "DECISION":
      return (
        <DecisionCard
          compact
          status={result.decision.status}
          reason={result.decision.reason}
          confidence={result.confidence}
          decidedAt={result.completedAt}
          nextSteps={result.decision.nextSteps}
        />
      );
  }
}
