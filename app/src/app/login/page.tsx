"use client";
import { useRouter } from "next/dist/client/components/navigation";
import { useState } from "react";

import { login } from "@/app/libs/firebase/auth";

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
    <form onSubmit={handleLogin}>
      <div>
        Email：
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
      </div>
      <br />
      <div>
        Password：
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
      </div>
      <br />
      <button type="submit">Login</button>
    </form>
  );
}
