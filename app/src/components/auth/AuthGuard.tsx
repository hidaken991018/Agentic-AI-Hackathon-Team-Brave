"use client";
import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";

/**
 * 認証ガードコンポーネント
 * @param param0
 * @returns
 */
export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // エラー発生時のみリダイレクト
    if (!loading && error) {
      console.error("[AuthGuard] Authentication error, redirecting to login");
      router.push("/login");
    }
  }, [error, loading, router]);

  console.log("[AuthGuard] render:", { user: user?.uid, loading, error });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="text-sm text-slate-600">認証中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-600">認証エラーが発生しました</p>
          <p className="mt-2 text-xs text-slate-500">{error.message}</p>
        </div>
      </div>
    );
  }

  // 匿名ユーザーも含め、認証済みユーザーは通過
  return <>{children}</>;
};
