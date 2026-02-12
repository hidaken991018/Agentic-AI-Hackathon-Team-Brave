"use client";

import { useEffect, useState } from "react";

import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { AiCommentSection } from "@/components/lifeplan/AiCommentSection";
import { LifePlanChart } from "@/components/lifeplan/LifePlanChart";
import { LifePlanCombinedView } from "@/components/lifeplan/LifePlanCombinedView";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LifeCompassData } from "@/schema/lifeCompassData/lifeCompassDataSchema";

type ViewMode = "chart" | "both";

export default function LifePlanPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const [viewMode, setViewMode] = useState<ViewMode>("both");
  const [data, setData] = useState<LifeCompassData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // sessionIdがある場合はセッションからデータを取得
        // ない場合はテスト用APIを使用（開発用）
        const apiUrl = sessionId
          ? `/api/life-compass?sessionId=${sessionId}`
          : "/api/test-life-compass-data";

        const response = await fetch(apiUrl);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || errorData.details || "データの取得に失敗しました"
          );
        }
        const result: LifeCompassData = await response.json();
        setData(result);
      } catch (err) {
        console.error("[life-compass page] エラー:", err);
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="container mx-auto flex min-h-[400px] items-center justify-center px-4 py-8">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8">
            <p className="text-destructive text-center">
              {error || "データの取得に失敗しました"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 px-4 py-8">
      <AiCommentSection
        commentList={data.aiComment.commentList}
        nextActionList={data.aiComment.nextActionList}
      />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">ライフプラン表</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "both" ? "default" : "outline"}
                onClick={() => setViewMode("both")}
              >
                詳細ライフプラン
              </Button>
              <Button
                variant={viewMode === "chart" ? "default" : "outline"}
                onClick={() => setViewMode("chart")}
              >
                資産推移グラフ
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "both" && <LifePlanCombinedView data={data.lifePlan} />}
          {viewMode === "chart" && <LifePlanChart data={data.lifePlan} />}
        </CardContent>
      </Card>
    </div>
  );
}
