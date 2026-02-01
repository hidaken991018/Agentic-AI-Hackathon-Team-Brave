/**
 * sessionId検証とリダイレクトフック
 *
 * URLパラメータからsessionIdを取得し、HearingContextに設定します。
 * sessionIdが未設定の場合は /hearing へリダイレクトします。
 */

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { useHearing } from "@/context/HearingContext";

export interface UseSessionIdGuardReturn {
  /** セッションID（設定されている場合） */
  sessionId: string | null;
  /** 準備完了フラグ（リダイレクト判定完了） */
  isReady: boolean;
}

/**
 * sessionId検証とリダイレクトフック
 *
 * @returns sessionIdと準備完了フラグ
 *
 * @example
 * const { sessionId, isReady } = useSessionIdGuard();
 *
 * if (!isReady) {
 *   return <div>Loading...</div>;
 * }
 */
export function useSessionIdGuard(): UseSessionIdGuardReturn {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { sessionId, setSessionId } = useHearing();

  // URLからsessionIdを取得
  const urlSessionId = searchParams.get("sessionId");

  useEffect(() => {
    if (urlSessionId && urlSessionId !== sessionId) {
      // URLからsessionIdを設定（Context更新のみ）
      setSessionId(urlSessionId);
    } else if (!urlSessionId && !sessionId) {
      // sessionIdが未設定の場合はリダイレクト
      console.error("[useSessionIdGuard] No sessionId provided");
      router.push("/hearing");
    }
  }, [urlSessionId, sessionId, setSessionId, router]);

  // 派生状態: sessionIdの存在で判定（stateではなく計算値）
  const currentSessionId = urlSessionId || sessionId;
  const isReady = Boolean(currentSessionId);

  return {
    sessionId: currentSessionId,
    isReady,
  };
}
