import { z } from "zod";

export const AiCommentSchema = z.object({
  commentList: z.array(z.string()),
  nextActionList: z.array(z.string()),
  quizDirectionList: z.string(),
});

export const aiCommentJsonSchemaForLlm = z.toJSONSchema(AiCommentSchema);
