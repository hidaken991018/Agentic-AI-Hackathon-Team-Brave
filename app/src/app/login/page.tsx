"use client";
import { useState } from "react";

import { useRouter } from "next/dist/client/components/navigation";

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
import { useAuth } from "@/context/AuthContext";
import { login, linkWithEmailAndPassword } from "@/libs/firebase/auth";

/**
 * エラーメッセージマッピング
 */
const getErrorMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    "auth/email-already-in-use": "このメールアドレスは既に使用されています",
    "auth/invalid-email": "無効なメールアドレスです",
    "auth/weak-password": "パスワードが脆弱です（6文字以上を推奨）",
    "auth/user-not-found": "ユーザーが見つかりません",
    "auth/wrong-password": "パスワードが間違っています",
    "auth/network-request-failed": "ネットワークエラーが発生しました",
    "auth/too-many-requests": "リクエストが多すぎます。しばらくしてから再試行してください",
    "auth/operation-not-allowed": "この操作は許可されていません",
  };
  return errorMessages[errorCode] || "認証エラーが発生しました";
};

/**
 * ログインページ
 * @returns JSX.Element
 * @description Firebase Authentication を使用したログインページコンポーネント(TODO:サンプルのためログインの本実装時に削除)
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { isAnonymous } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isAnonymous) {
        // 匿名ユーザーをメール認証にアップグレード
        console.log("[Login] アップグレード開始:", email);
        const userCredential = await linkWithEmailAndPassword(email, password);
        console.log("[Login] アップグレード成功:", userCredential.user.uid);
        alert("アカウントのアップグレードが完了しました！");
      } else {
        // 通常のログイン
        console.log("[Login] ログイン開始:", email);
        const userCredential = await login(email, password);
        console.log("[Login] ログイン成功:", userCredential.user.uid);
      }
      router.push("/auth-sample");
    } catch (err: unknown) {
      console.error("[Login] 失敗:", err);
      const errorCode = (err as { code?: string }).code || "unknown";
      setError(getErrorMessage(errorCode));
    } finally {
      setIsSubmitting(false);
    }
  };

  // UI動的切り替え
  const title = isAnonymous ? "アカウント登録" : "ログイン";
  const description = isAnonymous
    ? "メールアドレスとパスワードを設定して、データを保存しましょう"
    : "メールアドレスとパスワードを入力してください";
  const buttonText = isAnonymous ? "登録" : "ログイン";

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="text-sm text-slate-500">
            {description}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {isAnonymous && (
              <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
                ログインしていない状態です。メールアドレスとパスワードを登録すると、データを永続的に保存できます。
              </div>
            )}
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">メールアドレス</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@example.com"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">パスワード</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6文字以上"
                required
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              variant="default"
              disabled={isSubmitting}
            >
              {isSubmitting ? "処理中..." : buttonText}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
