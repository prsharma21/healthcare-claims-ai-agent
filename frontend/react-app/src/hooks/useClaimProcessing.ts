import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { getErrorMessage } from "@/services/apiClient";
import { claimsService } from "@/services/claimsService";
import type { ProcessingRun } from "@/types/agent";
import { claimStatusMeta } from "@/utils/status";

interface UseClaimProcessingOptions {
  onComplete?: (run: ProcessingRun) => void;
}

export interface ClaimProcessingState {
  run: ProcessingRun | null;
  isLoading: boolean;
  error: unknown;
  isRunning: boolean;
  start: () => Promise<void>;
  reload: () => void;
}

/** Loads the processing run for a claim and keeps it updated while the agents run. */
export function useClaimProcessing(claimId: string | undefined, options: UseClaimProcessingOptions = {}): ClaimProcessingState {
  const [run, setRun] = useState<ProcessingRun | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const onCompleteRef = useRef(options.onComplete);
  useEffect(() => {
    onCompleteRef.current = options.onComplete;
  });

  useEffect(() => {
    if (!claimId) return;
    let active = true;
    setRun(null);
    setIsLoading(true);
    setError(null);

    const unsubscribe = claimsService.subscribeToProcessing(claimId, (update) => {
      if (active) setRun(update);
    });

    claimsService.getAgentResults(claimId).then(
      (result) => {
        if (!active) return;
        setRun(result);
        setIsLoading(false);
      },
      (loadError: unknown) => {
        if (!active) return;
        setError(loadError);
        setIsLoading(false);
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [claimId, reloadToken]);

  const start = useCallback(async () => {
    if (!claimId) return;
    toast.info("Claim processing started.", { description: `Running AI agents for ${claimId}.` });
    try {
      const finalRun = await claimsService.processClaim(claimId);
      const decision = finalRun.agents.find((agent) => agent.agent === "DECISION");
      const label = decision?.agent === "DECISION" ? claimStatusMeta[decision.decision.status].label : "Completed";
      toast.success("Claim processing completed.", { description: `${claimId}: ${label}` });
      onCompleteRef.current?.(finalRun);
    } catch (processError) {
      toast.error("Claim processing failed.", { description: getErrorMessage(processError) });
    }
  }, [claimId]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  return {
    run,
    isLoading,
    error,
    isRunning: run?.status === "RUNNING",
    start,
    reload,
  };
}
