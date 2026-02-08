"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { onAuthStateChanged, User } from "firebase/auth";

import { signInAnonymously } from "@/libs/firebase/auth";
import { auth } from "@/libs/firebase/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAnonymous: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAnonymous: false,
  error: null,
});

/**
 * 認証コンテキストプロバイダー
 * @param param0
 * @returns
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Firebaseの状態変化を監視する
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // 既に認証済み（匿名 or メール認証）
        console.log("[Auth] User authenticated:", user.uid);
        setUser(user);
        setIsAnonymous(user.isAnonymous);
        setLoading(false);
      } else {
        // 自動匿名認証
        try {
          console.log("[Auth] Signing in anonymously...");
          const credential = await signInAnonymously();
          console.log("[Auth] Anonymous sign-in successful:", credential.user.uid);
          // onAuthStateChangedが再度トリガーされるため、ここでsetUserは不要
        } catch (err) {
          console.error("[Auth] Anonymous sign-in failed:", err);
          setError(err as Error);
          setLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAnonymous, error }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
