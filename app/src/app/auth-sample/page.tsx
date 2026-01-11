"use client";

import { useRouter } from "next/navigation";

import { useAuth } from "@/app/context/AuthContext";
import { logout } from "@/app/libs/firebase/auth";

/** 認証サンプルページ
 * @returns JSX.Element
 * @description Firebase Authentication を使用した認証サンプルページ(TODO:サンプルのため本実装時に削除)
 */
export default function AuthSamplePage() {
  const router = useRouter();
  // ページコンポーネント内
  const { user } = useAuth();
  const handleLogout = async () => {
    try {
      // 1. Firebase からログアウト
      await logout();

      // 2. ログアウト成功後の処理
      // ログインページへ遷移
      router.push("/login");

      // サーバーコンポーネントの状態もリセットするためにリフレッシュ
      router.refresh();
    } catch (error) {
      console.error("ログアウトに失敗しました", error);
    }
  };

  return (
    <div>
      <div>ようこそ {user?.email} さん</div>
      <button onClick={handleLogout}>ログアウト</button>
    </div>
  );
}
