"use client";

import { useEffect, useState } from "react";

import { Loader2 } from "lucide-react";

import { AiCommentSection } from "@/components/lifeplan/AiCommentSection";
import { LifePlanChart } from "@/components/lifeplan/LifePlanChart";
import { LifePlanCombinedView } from "@/components/lifeplan/LifePlanCombinedView";
import { LifePlanTable } from "@/components/lifeplan/LifePlanTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LifePlanJson } from "@/schema/lifePlanJson/lifePlanJsonSchema";

type ViewMode = "table" | "chart" | "both";

interface AiComment {
  commentList: string[];
  nextActionList: string[];
}

interface LifeCompassData {
  lifePlan: LifePlanJson;
  aiComment: AiComment;
}

export default function LifePlanPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("both");
  const [data, setData] = useState<LifeCompassData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/test-life-compass-data");
        if (!response.ok) {
          throw new Error("データの取得に失敗しました");
        }
        const result: LifeCompassData = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

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
                詳細
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                onClick={() => setViewMode("table")}
              >
                表形式
              </Button>
              <Button
                variant={viewMode === "chart" ? "default" : "outline"}
                onClick={() => setViewMode("chart")}
              >
                概要
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "table" && <LifePlanTable data={data.lifePlan} />}
          {viewMode === "chart" && <LifePlanChart data={data.lifePlan} />}
          {viewMode === "both" && <LifePlanCombinedView data={data.lifePlan} />}
        </CardContent>
      </Card>
    </div>
  );
}
