import { CONSTS } from "@/app/consts";
import { queryGemini } from "@/app/libs/google/queryGemini";

export async function jsonEditor<T>(responseSchema: T, instructions: string) {
  const prompt = `${CONSTS.PROMPT.ROLE_DEFINITION.JSON_EDITOR}\n${instructions}`;

  return queryGemini(responseSchema, prompt);
}
