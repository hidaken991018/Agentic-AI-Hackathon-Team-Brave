export async function queryToServer(text: string) {
  const res = await fetch("/api/agent/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "test-user-001",
      userMessage: text,
    }),
  });

  const json = await res.json();
  console.log(json);
}
