import { NextRequest, NextResponse } from "next/server";

import { analyzeLifePlan } from "@/agents/lifePlanAnalyzer";
import { createLifePlanFromHearing } from "@/app/features/lifePlan";
import type { HearingJson } from "@/app/features/lifePlan/types";
import { getSessionEvents, SessionEvent } from "@/libs/google/sessionManager";
import { convertLifePlanToTsvCompact } from "@/libs/lifeplan";
import type { AiCommentJson } from "@/schema/aiCommentJson/aiCommentJsonSchema";

/**
 * セッションイベントからヒアリングJSONを抽出・マージ
 *
 * イベントは以下の形式で保存されている:
 * - "hearing": 初回ヒアリング完了時（hearingJson全体）
 * - "hearing-additional-N": 追加質問回答時（hearingJsonUpdate部分更新）
 */
function extractHearingJsonFromEvents(
  events: SessionEvent[],
): HearingJson | null {
  let hearingJson: HearingJson | null = null;

  // イベントをタイムスタンプ順にソート
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  for (const event of sortedEvents) {
    // "hearing" または "hearing-additional-*" イベントを処理
    if (!event.invocationId.startsWith("hearing")) {
      continue;
    }

    // イベントのコンテンツからデータを抽出
    const textPart = event.content?.parts?.find((p) => p.text);
    if (!textPart?.text) {
      continue;
    }

    try {
      const data = JSON.parse(textPart.text);

      if (event.invocationId === "hearing" && data.hearingJson) {
        // 初回ヒアリング: 完全なhearingJsonを設定
        hearingJson = data.hearingJson as HearingJson;
      } else if (
        event.invocationId.startsWith("hearing-additional-") &&
        data.hearingJsonUpdate
      ) {
        // 追加質問: 部分更新をマージ
        if (hearingJson) {
          hearingJson = deepMerge(
            hearingJson as unknown as Record<string, unknown>,
            data.hearingJsonUpdate as Record<string, unknown>,
          ) as unknown as HearingJson;
        }
      }
    } catch (e) {
      console.error(`Failed to parse event ${event.invocationId}:`, e);
    }
  }

  return hearingJson;
}

/**
 * 値が「空/デフォルト」かどうかを判定
 * hearingJsonUpdateのスケルトンデフォルト値による上書きを防ぐ
 */
function isEmptyValue(value: unknown): boolean {
  if (value === 0 || value === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

/**
 * オブジェクトの深いマージ
 */
function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (
      sourceValue &&
      typeof sourceValue === "object" &&
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === "object" &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>,
      );
    } else if (sourceValue !== undefined && !isEmptyValue(sourceValue)) {
      result[key] = sourceValue;
    }
  }

  return result;
}

/**
 * GET /api/life-compass?sessionId={sessionId}
 * セッションからヒアリングJSONを取得し、ライフプランとAIコメントを生成して返す
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId is required" },
      { status: 400 },
    );
  }

  try {
    // 1. セッションからイベントを取得
    const eventsResult = await getSessionEvents(sessionId);

    if (!eventsResult.ok) {
      console.error("[life-compass] イベント取得エラー:", eventsResult.error.message);
      return NextResponse.json(
        {
          error: "Failed to get session events",
          details: eventsResult.error.message,
        },
        { status: 404 },
      );
    }

    // 2. イベントからヒアリングJSONを抽出
    const hearingJson = extractHearingJsonFromEvents(eventsResult.value);

    if (!hearingJson) {
      return NextResponse.json(
        { error: "No hearing data found in session" },
        { status: 404 },
      );
    }

    // 3. ライフプランを生成
    const lifePlan = createLifePlanFromHearing(hearingJson);

    // 4. ライフプランをTSV形式に変換（軽量版）
    const lifePlanTsv = convertLifePlanToTsvCompact(lifePlan);

    // 5. AIにTSVを分析させてコメントを取得
    const aiCommentRaw = await analyzeLifePlan(lifePlanTsv);

    // 6. AIのレスポンスをパース
    let aiComment: Omit<AiCommentJson, "quizDirectionList">;
    try {
      const parsed = JSON.parse(aiCommentRaw) as AiCommentJson;
      // quizDirectionList を除外
      const { quizDirectionList: _, ...aiCommentWithoutQuiz } = parsed;
      aiComment = aiCommentWithoutQuiz;
    } catch {
      console.error("[life-compass] Failed to parse AI response:", aiCommentRaw);
      return NextResponse.json(
        {
          error: "Failed to parse AI response",
          raw: aiCommentRaw,
        },
        { status: 502 },
      );
    }

    // 7. レスポンスを返す
    return NextResponse.json({ lifePlan, aiComment });
  } catch (error) {
    console.error("[life-compass] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate life compass data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
