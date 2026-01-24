"use client";
import { useRouter } from "next/dist/client/components/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { login } from "@/libs/firebase/auth";

/**
 * ログインページ
 * @returns JSX.Element
 * @description Firebase Authentication を使用したログインページコンポーネント(TODO:サンプルのためログインの本実装時に削除)
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await login(email, password);
      console.log("ログイン成功:", userCredential.user);
      // ログイン後のリダイレクト処理などをここに書く
      router.push("/auth-sample");
    } catch (error) {
      console.error("ログイン失敗:", error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">ログイン</CardTitle>
          <CardDescription className="text-sm text-slate-500">
            メールアドレスとパスワードを入力してください
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">メールアドレス</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">パスワード</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" variant="default">
              ログイン
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
