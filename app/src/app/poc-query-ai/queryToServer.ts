export async function queryToServer(
  userId: string,
  usedSessionId: string,
  userMessage: string,
) {
  const res = await fetch("/api/agent/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      usedSessionId,
      userMessage,
    }),
  });

  const json = await res.json();
  console.log(json);

  return json;
}
