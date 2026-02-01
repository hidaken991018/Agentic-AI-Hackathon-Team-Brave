"use client";

import { createContext, ReactNode, useContext, useState } from "react";

import { HearingJsonInput } from "@/schema/hearingJson/hearingJsonSchema";

interface HearingContextType {
  // Session
  sessionId: string | null;
  setSessionId: (id: string) => void;

  // Hearing JSON (optional - キャッシュ用)
  hearingJson: HearingJsonInput | null;
  setHearingJson: (json: HearingJsonInput) => void;

  // Loading states
  isSubmitting: boolean;
  setIsSubmitting: (loading: boolean) => void;

  // Error state
  error: string | null;
  setError: (error: string | null) => void;

  // Clear all state (for logout/reset)
  clearHearingState: () => void;
}

const HearingContext = createContext<HearingContextType | undefined>(undefined);

export function HearingProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hearingJson, setHearingJson] = useState<HearingJsonInput | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearHearingState = () => {
    setSessionId(null);
    setHearingJson(null);
    setIsSubmitting(false);
    setError(null);
  };

  return (
    <HearingContext.Provider
      value={{
        sessionId,
        setSessionId,
        hearingJson,
        setHearingJson,
        isSubmitting,
        setIsSubmitting,
        error,
        setError,
        clearHearingState,
      }}
    >
      {children}
    </HearingContext.Provider>
  );
}

export function useHearing() {
  const context = useContext(HearingContext);
  if (context === undefined) {
    throw new Error("useHearing must be used within a HearingProvider");
  }
  return context;
}
