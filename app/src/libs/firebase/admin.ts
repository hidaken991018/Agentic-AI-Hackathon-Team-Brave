/**
 * Firebase Admin SDK 初期化
 *
 * サーバーサイドでの Firebase 認証トークン検証に使用します。
 *
 * @module firebaseAdmin
 */

import { initializeApp, cert, getApps, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";

let adminApp: App | undefined;
let adminAuth: Auth | undefined;

/**
 * Firebase Admin App を取得（シングルトン）
 */
export function getAdminApp(): App {
  if (!adminApp) {
    if (getApps().length === 0) {
      // 環境変数からサービスアカウント情報を取得
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      };

      adminApp = initializeApp({
        credential: cert(serviceAccount),
      });
    } else {
      adminApp = getApps()[0];
    }
  }
  return adminApp;
}

/**
 * Firebase Admin Auth を取得（シングルトン）
 */
export function getAdminAuth(): Auth {
  if (!adminAuth) {
    adminAuth = getAuth(getAdminApp());
  }
  return adminAuth;
}
