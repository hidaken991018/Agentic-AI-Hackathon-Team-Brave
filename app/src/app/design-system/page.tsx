"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

/**デザイン確認用ページ
 * @returns JSX.Element
 * @description デザインシステムで設定したカラーパレットやコンポーネントスタイルが正しく反映されているか確認するためのページコンポーネント
 * @remarks 本番環境には不要なページのため、開発・確認用としてのみ使用
 */
export default function DesignSystemPage() {
  return (
    <div className="container mx-auto space-y-10 px-4 py-10">
      {/* 1. 見出しの確認 */}
      <section className="space-y-2">
        <Heading level={1}>デザインシステム確認用ページ</Heading>
        <p className="text-muted-foreground">
          設定したカラーパレットが反映されているか確認しましょう。
        </p>
      </section>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* 2. カード & ボタン */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons & Cards</CardTitle>
            <CardDescription>
              メイン・サブ・アクセントカラーの確認
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button>メインボタン (Primary)</Button>
              <Button variant="secondary">サブボタン (Secondary)</Button>
              <Button variant="destructive">アクセント (Destructive)</Button>
              <Button variant="outline">アウトライン</Button>
            </div>
          </CardContent>
        </Card>

        {/* 3. 入力フォーム関連 */}
        <Card>
          <CardHeader>
            <CardTitle>Forms & Inputs</CardTitle>
            <CardDescription>Input, Textarea, Select, Radio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Input & Label */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="email">メールアドレス</Label>
              <Input type="email" id="email" placeholder="example@mail.com" />
            </div>

            {/* Select */}
            <div className="grid w-full items-center gap-1.5">
              <Label>プルダウン選択</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="イベントを選択してください" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="marriage">
                    結婚・パートナーシップ
                  </SelectItem>
                  <SelectItem value="childbirth">出産・育児開始</SelectItem>
                  <SelectItem value="home-purchase">マイホーム購入</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Radio Group */}
            <div className="grid w-full items-center gap-1.5">
              <Label className="mb-2">優先度（ラジオボタン）</Label>
              <RadioGroup defaultValue="low" className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="r1" />
                  <Label htmlFor="r1">高</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="r2" />
                  <Label htmlFor="r2">低</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Textarea */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="message">備考</Label>
              <Textarea
                placeholder="こちらに詳細を入力してください"
                id="message"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* カラーパレットの直接確認用 */}
      <section className="space-y-6">
        <Heading level={2}>カラーパレット詳細確認</Heading>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* 1. メインカラー */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">メインカラー (Primary)</span>
            <div className="bg-primary text-primary-foreground flex h-20 items-center justify-center rounded-md font-bold">
              #1D3557
            </div>
            <p className="text-muted-foreground text-xs">
              主にボタン、重要なUI要素、ヘッダーに使用
            </p>
          </div>

          {/* 2. アクセントカラー */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">
              アクセントカラー (Destructive)
            </span>
            <div className="bg-destructive text-destructive-foreground flex h-20 items-center justify-center rounded-md font-bold">
              #E63946
            </div>
            <p className="text-muted-foreground text-xs">
              警告、エラー、重要な注目ポイントに使用
            </p>
          </div>

          {/* 3. ベースカラー */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">
              ベースカラー (Background)
            </span>
            <div className="bg-background border-border text-foreground flex h-20 items-center justify-center rounded-md border font-bold">
              #F1FAEE
            </div>
            <p className="text-muted-foreground text-xs">
              全体の背景色。清潔感のあるオフホワイト
            </p>
          </div>

          {/* 4. テキストカラー */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">
              テキストカラー (Foreground)
            </span>
            <div className="flex h-20 items-center justify-center rounded-md bg-[#222222] font-bold text-white">
              #222222
            </div>
            <p className="text-muted-foreground text-xs">
              本文、タイトルなどの主要な文字色
            </p>
          </div>

          {/* 5. サブテキストカラー */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">
              サブテキストカラー (Muted Foreground)
            </span>
            <div className="flex h-20 items-center justify-center rounded-md bg-[#696969] font-bold text-white">
              #696969
            </div>
            <p className="text-muted-foreground text-xs">
              補足説明、プレースホルダーなどの補助的な文字色
            </p>
          </div>

          {/* 6. ユーティリティカラー（1） */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">
              ユーティリティカラー(1) (Secondary)
            </span>
            <div className="bg-secondary text-secondary-foreground flex h-20 items-center justify-center rounded-md font-bold">
              #457B9D
            </div>
            <p className="text-muted-foreground text-xs">
              サブボタン、バッジ、セクションの区切りなどに使用
            </p>
          </div>

          {/* 7. ユーティリティカラー（2） */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">
              ユーティリティカラー(2) (Accent)
            </span>
            <div className="bg-accent text-accent-foreground flex h-20 items-center justify-center rounded-md font-bold">
              #A8DADC
            </div>
            <p className="text-muted-foreground text-xs">
              ホバー時の背景色、選択中ステート、境界線に使用
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
