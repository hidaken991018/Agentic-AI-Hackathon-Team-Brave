import { NextResponse } from "next/server";

import { analyzeLifePlan } from "@/agents/lifePlanAnalyzer";
import { createLifePlan } from "@/app/features/lifePlan";
import { convertLifePlanToTsvCompact } from "@/libs/lifeplan";
import type { AiCommentJson } from "@/schema/aiCommentJson/aiCommentJsonSchema";

/**
 * GET /api/test-life-compass-data
 * ライフプランを生成し、AIによる分析コメントを取得して返すAPI
 *
 * @deprecated 代わりに /api/life-compass を使用してください
 */
export async function GET() {
  try {
    // 1. ライフプランを生成
    const lifePlan = createLifePlan();

    // 2. ライフプランをTSV形式に変換（軽量版）
    const lifePlanTsv = convertLifePlanToTsvCompact(lifePlan);

    // 3. AIにTSVを分析させてコメントを取得
    const aiCommentRaw = await analyzeLifePlan(lifePlanTsv);

    // 4. AIのレスポンスをパース
    let aiComment: Omit<AiCommentJson, "quizDirectionList">;
    try {
      const parsed = JSON.parse(aiCommentRaw) as AiCommentJson;
      // quizDirectionList を除外
      const { quizDirectionList: _, ...aiCommentWithoutQuiz } = parsed;
      aiComment = aiCommentWithoutQuiz;
    } catch {
      console.error("Failed to parse AI response:", aiCommentRaw);
      return NextResponse.json(
        {
          error: "Failed to parse AI response",
          raw: aiCommentRaw,
        },
        { status: 502 },
      );
    }

    // 5. レスポンスを返す
    const combinedData = {
      lifePlan,
      aiComment,
    };

    return NextResponse.json(combinedData);
  } catch (error) {
    console.error("Error generating life compass data:", error);
    return NextResponse.json(
      {
        error: "Failed to generate life compass data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
