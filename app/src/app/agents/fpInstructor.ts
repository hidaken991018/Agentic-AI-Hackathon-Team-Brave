import { CONSTS } from "@/app/consts";
import { queryAIAgent } from "@/app/libs/google/queryAIAgent";

export async function fpInstructor(
  accessToken: string,
  userId: string,
  sessionId: string,
  requestToAi: string,
  userMessage: string,
) {
  const query = `${CONSTS.PROMPT.ROLE_DEFINITION.FP}${requestToAi}${userMessage}`;

  return await queryAIAgent(
    process.env.VERTEX_LOCATION || "",
    process.env.RESOURCE_NAME || "",
    accessToken,
    userId,
    sessionId,
    query,
  );
}
