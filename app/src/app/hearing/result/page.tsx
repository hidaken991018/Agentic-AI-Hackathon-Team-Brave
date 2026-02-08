"use client";

import { useSearchParams } from "next/navigation";

import { Card } from "@/components/ui/card";

/**
 * ヒアリング結果ページ（簡易版）
 *
 * TODO: 実際の結果表示ロジックを実装
 */
export default function HearingResultPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">ヒアリング完了</h1>
        <p className="text-gray-600">
          ヒアリングが完了しました。ありがとうございました。
        </p>
        {sessionId && (
          <p className="mt-4 text-sm text-gray-500">
            セッション ID: {sessionId}
          </p>
        )}
        <div className="mt-6">
          <p className="text-sm text-gray-500">
            ※ 結果表示は現在開発中です
          </p>
        </div>
      </Card>
    </div>
  );
}
