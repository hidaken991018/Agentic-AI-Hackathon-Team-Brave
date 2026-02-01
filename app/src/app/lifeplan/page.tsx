"use client";

import { useState } from "react";

import { LifePlanChart } from "@/components/lifeplan/LifePlanChart";
import { LifePlanTable } from "@/components/lifeplan/LifePlanTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { lifePlanDefaultValue } from "@/schema/lifePlanJson/lifePlanJsonDefaultValue";

type ViewMode = "table" | "chart";

export default function LifePlanPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const data = lifePlanDefaultValue;

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">ライフプラン表</CardTitle>
            <div className="flex gap-2">
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
                グラフ
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "table" ? (
            <LifePlanTable data={data} />
          ) : (
            <LifePlanChart data={data} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
