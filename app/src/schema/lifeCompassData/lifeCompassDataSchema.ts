import type { AiCommentJson } from "@/schema/aiCommentJson/aiCommentJsonSchema";
import type { LifePlanJson } from "@/schema/lifePlanJson/lifePlanJsonSchema";

/**
 * ライフコンパス画面で使用するデータ型
 * APIレスポンスの型として使用
 */
export interface LifeCompassData {
  lifePlan: LifePlanJson;
  aiComment: Pick<AiCommentJson, "commentList" | "nextActionList">;
}
