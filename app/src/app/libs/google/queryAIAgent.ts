type HasTextParts = {
  content?: {
    parts?: Array<{
      text?: string;
    }>;
  };
};

function extractText(obj: HasTextParts): string {
  return obj?.content?.parts?.map((p) => p?.text ?? "").join("") ?? "";
}

function tryParseJson<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

export async function queryAIAgent(
  projectLocation: string,
  resourceName: string,
  accessToken: string,
  userId: string,
  sessionId: string,
  message: string,
): Promise<string> {
  const url = `https://${projectLocation}-aiplatform.googleapis.com/v1/${resourceName}:streamQuery?alt=sse`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      classMethod: "async_stream_query",
      input: {
        user_id: userId,
        session_id: sessionId,
        message,
      },
    }),
  });

  if (!res.ok || !res.body) {
    const text = await res.text();
    throw new Error(`Agent Engine error: ${res.status} ${text}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");

  let buffer = "";
  let out = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    if (buffer.includes("\ndata:") || buffer.startsWith("data:")) {
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const ev of events) {
        const lines = ev.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const jsonStr = line.replace(/^data:\s*/, "").trim();
          if (!jsonStr) continue;

          const obj = tryParseJson<HasTextParts>(jsonStr);
          if (obj) out += extractText(obj);
        }
      }
      continue;
    }
  }

  if (buffer.trim()) {
    const obj = tryParseJson<HasTextParts>(buffer);
    if (obj) out += extractText(obj);
  }

  return out;
}
