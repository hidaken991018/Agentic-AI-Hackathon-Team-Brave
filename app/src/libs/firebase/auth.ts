import {
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  UserCredential,
  signInAnonymously as firebaseSignInAnonymously,
  EmailAuthProvider,
  linkWithCredential,
} from "firebase/auth";

import { auth } from "./firebase";

/**
 * メールアドレスとパスワードでログイン
 */
export const login = async (
  email: string,
  password: string,
): Promise<UserCredential> => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("Login Service Error:", error);
    throw error;
  }
};

/**
 * ログアウト
 */
export const logout = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Logout Service Error:", error);
    throw error;
  }
};

/**
 * 匿名認証でログイン
 */
export const signInAnonymously = async (): Promise<UserCredential> => {
  try {
    return await firebaseSignInAnonymously(auth);
  } catch (error) {
    console.error("Anonymous Sign-in Error:", error);
    throw error;
  }
};

/**
 * メール認証へのアップグレード（匿名ユーザー→メール認証）
 */
export const linkWithEmailAndPassword = async (
  email: string,
  password: string,
): Promise<UserCredential> => {
  const user = auth.currentUser;

  if (!user?.isAnonymous) {
    throw new Error("User is already linked with a credential");
  }

  try {
    const credential = EmailAuthProvider.credential(email, password);
    return await linkWithCredential(user, credential);
  } catch (error) {
    console.error("Link with Email Error:", error);
    throw error;
  }
};

/**
 * 匿名ユーザー判定
 */
export const isAnonymousUser = (): boolean => {
  return auth.currentUser?.isAnonymous ?? false;
};
