import { CONSTS } from "@/app/consts";
import { queryGenAI } from "@/app/libs/google/queryGenAI";

export async function jsonEditor<T>(responseSchema: T, instructions: string) {
  const prompt = `${CONSTS.PROMPT.ROLE_DEFINITION.JSON_EDITOR}\n${instructions}`;

  return queryGenAI(responseSchema, prompt);
}
