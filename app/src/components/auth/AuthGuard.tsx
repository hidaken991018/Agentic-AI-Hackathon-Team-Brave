"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/context/AuthContext";

/**
 * 認証ガードコンポーネント
 * @param param0
 * @returns
 */
export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login"); // ログインしてなければログイン画面へ
    }
  }, [user, loading, router]);
  console.log("AuthGuard render:", { user, loading });
  if (loading || !user) {
    return <p>Loading...</p>; // 判定中は何も出さない、もしくはローディングを出す
  }

  return <>{children}</>;
};
