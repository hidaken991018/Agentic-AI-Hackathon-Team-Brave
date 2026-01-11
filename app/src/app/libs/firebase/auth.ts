import {
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  UserCredential,
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
