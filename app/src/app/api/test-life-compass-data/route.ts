import { NextResponse } from "next/server";

import { createLifePlan } from "@/app/features/lifePlan";
import { aiCommentDefaultValues } from "@/schema/aiCommentJson/aiCommentJsonDefaultValue";

/**
 * GET /api/test-life-compass-data
 * lifePlanJson と aiCommentJson のサンプルデータを結合して返す一時的なAPI
 */
export async function GET() {
  try {
    // ライフプランを生成
    const lifePlan = createLifePlan();

    // quizDirectionList を除外
    const { quizDirectionList: _, ...aiCommentWithoutQuiz } =
      aiCommentDefaultValues;

    const combinedData = {
      lifePlan,
      aiComment: aiCommentWithoutQuiz,
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
