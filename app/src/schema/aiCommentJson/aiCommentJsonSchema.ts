import { z } from "zod";

import { aiCommentDefaultValues } from "@/schema/aiCommentJson/aiCommentJsonDefaultValue";

export const aiCommentBaseSchema = z.object({
  commentList: z
    .array(z.string())
    .describe(
      "AIコメント > コメント一覧（ファイナンシャルプランナーからのアドバイスや分析コメント）",
    ),
  nextActionList: z
    .array(z.string())
    .describe(
      "AIコメント > 次のアクション一覧（ユーザーに推奨する具体的なアクション）",
    ),
  quizDirectionList: z
    .string()
    .describe(
      "AIコメント > クイズの方向性（金融リテラシー向上のためのクイズテーマ）",
    ),
});

export type AiCommentJsonInput = z.input<typeof aiCommentBaseSchema>;
export type AiCommentJson = z.output<typeof aiCommentBaseSchema>;

export const aiCommentJsonSchema =
  aiCommentBaseSchema.default(aiCommentDefaultValues);

export const aiCommentJsonSchemaForLlm = z.toJSONSchema(aiCommentJsonSchema);
