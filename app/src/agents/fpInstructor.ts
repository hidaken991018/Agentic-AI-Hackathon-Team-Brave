import { CONSTS } from "@/consts";
import { getEnv } from "@/libs/env";
import { queryAIAgent } from "@/libs/google/queryAIAgent";

export async function fpInstructor(
  accessToken: string,
  userId: string,
  sessionId: string,
  requestToAi: string,
  userMessage: string,
) {
  const query = `${CONSTS.PROMPT.ROLE_DEFINITION.FP}${requestToAi}${userMessage}`;

  const location = (await getEnv("VERTEX_AGT_LOCATION")) || "";
  const resourceName = (await getEnv("VERTEX_AGT_RESOURCE_NAME")) || "";

  return await queryAIAgent(
    location,
    resourceName,
    accessToken,
    userId,
    sessionId,
    query,
  );
}
