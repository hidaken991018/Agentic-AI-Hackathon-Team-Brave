/**
 * 回答処理サービス
 *
 * AI解釈結果からhearingJSONを構築し、
 * セッションに保存します。
 */

import { User } from "firebase/auth";

import { authenticatedFetch } from "@/libs/api/hearingApi";
import {
  buildHearingJson,
  extractEstimations,
} from "@/libs/hearing/hearingJsonBuilder";
import { HearingJsonInput } from "@/schema/hearingJson/hearingJsonSchema";
import { InterpretedDataResponse } from "@/services/hearing/schema/interpretedDataSchema";

export interface ProcessAndSaveAnswersOptions {
  sessionId: string;
  user: User;
  interpretedResults: InterpretedDataResponse[];
  questionCount: number;
}

/**
 * AI解釈結果を処理してセッションに保存
 *
 * @param options - 処理オプション
 * @throws セッション保存APIが失敗した場合にエラーをthrow
 */
export async function processAndSaveAnswers(
  options: ProcessAndSaveAnswersOptions,
): Promise<void> {
  const { sessionId, user, interpretedResults, questionCount } = options;

  // デバッグ: interpretedResults の中身を詳細にログ
  console.log(
    "[processAndSaveAnswers] interpretedResults count:",
    interpretedResults.length,
  );
  console.log(
    "[processAndSaveAnswers] interpretedResults raw:",
    JSON.stringify(interpretedResults, null, 2),
  );
  for (const [i, result] of interpretedResults.entries()) {
    console.log(`[processAndSaveAnswers] result[${i}].structuredData:`, JSON.stringify(result.structuredData));
    console.log(`[processAndSaveAnswers] result[${i}].structuredData keys:`, Object.keys(result.structuredData ?? {}));
    console.log(`[processAndSaveAnswers] result[${i}].estimations:`, JSON.stringify(result.estimations));
  }

  // 部分的なhearingJSON更新を構築
  const hearingJsonUpdate = buildHearingJson(
    {} as HearingJsonInput, // 空のベース - AI結果のみ
    interpretedResults,
  );

  console.log(
    "[processAndSaveAnswers] Hearing JSON update:",
    JSON.stringify(hearingJsonUpdate, null, 2),
  );

  // セッションに保存（差分更新）
  console.log(
    "[processAndSaveAnswers] Saving hearing JSON update to session...",
  );

  const saveResponse = await authenticatedFetch(
    user,
    "/api/hearing/direct-data",
    {
      method: "POST",
      body: JSON.stringify({
        sessionId,
        data: {
          hearingJsonUpdate,
          estimations: extractEstimations(interpretedResults),
          updatedAt: new Date().toISOString(),
        },
        invocationId: `hearing-additional-${questionCount}`,
      }),
    },
  );

  if (!saveResponse.ok) {
    throw new Error(
      `Failed to save hearing JSON update: ${saveResponse.statusText}`,
    );
  }

  console.log("[processAndSaveAnswers] Hearing JSON update saved successfully");
}
