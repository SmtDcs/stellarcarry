"use client";

import { useState, useCallback } from "react";
import { MOCK_REPUTATION } from "@/lib/reputation.mock";
import type { ReputationData } from "@/lib/types";

interface ReputationState {
  data: ReputationData | null;
  isLoading: boolean;
  error: string | null;
}

export function useReputation(): ReputationState & { refresh: () => void } {
  const [state] = useState<ReputationState>({
    data: MOCK_REPUTATION,
    isLoading: false,
    error: null,
  });

  const refresh = useCallback(() => {
    // no-op for mock — wired for real EscrowClient.getReputation later
  }, []);

  return { ...state, refresh };
}
