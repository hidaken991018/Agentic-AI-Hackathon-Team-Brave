import { CONSTS } from "@/consts";
import { queryAIAgent } from "@/libs/google/queryAIAgent";

export async function fpInstructor(
  accessToken: string,
  userId: string,
  sessionId: string,
  requestToAi: string,
  userMessage: string,
) {
  const query = `${CONSTS.PROMPT.ROLE_DEFINITION.FP}${requestToAi}${userMessage}`;

  return await queryAIAgent(
    process.env.VERTEX_AGT_LOCATION || "",
    process.env.VERTEX_AGT_RESOURCE_NAME || "",
    accessToken,
    userId,
    sessionId,
    query,
  );
}
