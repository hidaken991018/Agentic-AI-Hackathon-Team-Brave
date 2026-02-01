"use client";

import { MessageSquare, ListChecks } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AiCommentSectionProps {
  commentList: string[];
  nextActionList: string[];
}

export function AiCommentSection({
  commentList,
  nextActionList,
}: AiCommentSectionProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* FPからのコメント */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5" />
            FPからのコメント
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {commentList.map((comment) => (
              <li key={comment} className="flex gap-2 text-sm text-muted-foreground">
                <span className="text-primary font-medium">•</span>
                <span>{comment}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* 次のアクション */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ListChecks className="h-5 w-5" />
            次のアクション
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {nextActionList.map((action, index) => (
              <li key={action} className="flex gap-3 text-sm">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs text-muted-foreground">
                  {index + 1}
                </span>
                <span className="text-muted-foreground">{action}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
