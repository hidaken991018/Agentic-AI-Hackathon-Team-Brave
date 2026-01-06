"use client";

import { useState } from "react";

import { queryToServer } from "@/app/poc-query-ai/queryToServer";

type HttpResponseType = {
  sessionId: string;
  parsed: {
    summary: string;
    suggestions: string[];
    nextAction: string;
  };
};

export default function MinInput() {
  const [userId, setUserId] = useState("user-001");
  const [usedSessionId, setUsedSessionId] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [response, setResponse] = useState<HttpResponseType>();

  const handleSend = async () => {
    const res: HttpResponseType = await queryToServer(
      userId,
      usedSessionId ?? "",
      userMessage,
    );

    if (res) {
      setResponse(res);
    }

    if (res.sessionId) {
      setUsedSessionId(res.sessionId);
    }
  };

  return (
    <>
      <h3>ユーザーID</h3>
      <textarea
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        placeholder="ユーザーID"
        rows={1}
      />
      <br />
      <h3>相談内容</h3>
      <textarea
        value={userMessage}
        onChange={(e) => setUserMessage(e.target.value)}
        placeholder="相談内容を入力"
        rows={3}
      />
      <br />
      <h3>取得したセッションID</h3>
      <p>{usedSessionId}</p>
      <br />
      <h3>サマリー</h3>
      <p>{response?.parsed.summary}</p>
      <br />
      <h3>提案リスト</h3>
      <p>{response?.parsed.suggestions.map((s) => s)}</p>
      <br />
      <br />
      <button onClick={handleSend} disabled={!userMessage.trim()}>
        送信
      </button>
    </>
  );
}
