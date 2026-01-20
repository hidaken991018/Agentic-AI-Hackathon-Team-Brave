import { GoogleAuth } from "google-auth-library";

import { CONSTS } from "@/consts";
import { getRequiredEnv } from "@/libs/env";
import { getSessionURI } from "@/libs/google/generateURI";

export async function createSessionId(userId: string): Promise<string> {
  const LOCATION = await getRequiredEnv("VERTEX_AGT_LOCATION");
  const RESOURCE_NAME = await getRequiredEnv("VERTEX_AGT_RESOURCE_NAME");

  const auth = new GoogleAuth({
    scopes: [CONSTS.ENDPOINT.GOOGLE.CREATE_SESSION_ID],
  });
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();

  if (!token) {
    throw new Error("Failed to get access token");
  }

  const res = await fetch(getSessionURI(LOCATION, RESOURCE_NAME), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      classMethod: "async_create_session",
      input: {
        user_id: userId,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const json = await res.json();

  const sessionId =
    json?.output?.id ?? json?.output?.session_id ?? json?.session_id;

  if (!sessionId) {
    throw new Error(`session_id not found: ${JSON.stringify(json)}`);
  }

  return sessionId;
}
