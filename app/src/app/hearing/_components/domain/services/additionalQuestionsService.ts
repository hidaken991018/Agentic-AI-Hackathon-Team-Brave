/**
 * 追加質問APIサービス
 *
 * 追加質問APIの呼び出しをカプセル化します。
 */

import { User } from "firebase/auth";

import { authenticatedFetch } from "@/libs/api/hearingApi";
import { AdditionalQuestionsResponse } from "@/services/hearing/schema/additionalQuestionsSchema";

export interface FetchAdditionalQuestionsOptions {
  sessionId: string;
  user: User;
  questionCount: number;
}

/**
 * 追加質問を取得
 *
 * @param options - リクエストオプション
 * @returns 追加質問APIのレスポンス
 * @throws API呼び出しが失敗した場合にエラーをthrow
 */
export async function fetchAdditionalQuestions(
  options: FetchAdditionalQuestionsOptions,
): Promise<AdditionalQuestionsResponse> {
  const { sessionId, user, questionCount } = options;

  const response = await authenticatedFetch(
    user,
    "/api/hearing/additional-questions",
    {
      method: "POST",
      body: JSON.stringify({
        sessionId,
        questionCount,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return await response.json();
}
