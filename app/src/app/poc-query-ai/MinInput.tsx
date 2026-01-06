"use client";

import { useState } from "react";

import { queryToServer } from "@/app/poc-query-ai/queryToServer";

export default function MinInput() {
  const [text, setText] = useState("");

  return (
    <>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="入力してください"
        rows={3}
      />

      <br />

      <button onClick={() => queryToServer(text)} disabled={!text.trim()}>
        送信
      </button>
    </>
  );
}
