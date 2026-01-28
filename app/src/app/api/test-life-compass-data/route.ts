import { NextResponse } from "next/server";

import { aiCommentDefaultValues } from "@/schema/aiCommentJson/aiCommentJsonDefaultValue";
import { lifePlanDefaultValue } from "@/schema/lifePlanJson/lifePlanJsonDefaultValue";

/**
 * GET /api/test-life-compass-data
 * lifePlanJson と aiCommentJson のサンプルデータを結合して返す一時的なAPI
 */
export async function GET() {
  // quizDirectionList を除外
  const { quizDirectionList: _, ...aiCommentWithoutQuiz } =
    aiCommentDefaultValues;

  const combinedData = {
    lifePlan: lifePlanDefaultValue,
    aiComment: aiCommentWithoutQuiz,
  };

  return NextResponse.json(combinedData);
}
