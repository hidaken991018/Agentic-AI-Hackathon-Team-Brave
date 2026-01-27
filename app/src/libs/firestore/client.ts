import { cert, getApps, initializeApp } from "firebase-admin/app";
import { Firestore, getFirestore } from "firebase-admin/firestore";

import { isGCP } from "@/config";

/**
 * Firestore クライアント（サーバーサイド用）
 *
 * - ローカル環境: Firestore エミュレータに接続（localhost:8080）
 * - GCP環境: 実際の Firestore に接続（ADC認証）
 *
 * データベースIDは FIRESTORE_DATABASE_ID 環境変数で指定可能
 * 未指定の場合は "(default)" を使用
 */

const firestoreClients: Map<string, Firestore> = new Map();

/**
 * Firebase Admin SDK を初期化
 */
function initializeFirebaseAdmin(): void {
  if (getApps().length > 0) {
    return; // 既に初期化済み
  }

  if (isGCP()) {
    // GCP環境: Application Default Credentials を使用
    initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } else {
    // ローカル環境: サービスアカウントキーを使用（または環境変数）
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (projectId && clientEmail && privateKey) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } else {
      // 環境変数がない場合はエミュレータ用にプロジェクトIDのみで初期化
      initializeApp({
        projectId: projectId || "demo-project",
      });
    }
  }
}

/**
 * Firestore クライアントを取得
 *
 * @param databaseId データベースID（省略時は環境変数 FIRESTORE_DATABASE_ID、未設定なら "(default)"）
 *
 * ローカル環境では FIRESTORE_EMULATOR_HOST が設定されていれば
 * エミュレータに接続する
 */
export function getFirestoreClient(databaseId?: string): Firestore {
  const dbId = databaseId || process.env.FIRESTORE_DATABASE_ID || "(default)";

  // キャッシュ済みのクライアントがあれば返す
  const cached = firestoreClients.get(dbId);
  if (cached) {
    return cached;
  }

  // ローカル環境でエミュレータを使用する場合
  if (!isGCP()) {
    const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
    if (!emulatorHost) {
      // 環境変数が設定されていない場合は自動設定
      process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
      console.log(
        "[Firestore] Emulator mode: connecting to localhost:8080",
      );
    }
  }

  initializeFirebaseAdmin();

  // データベースIDを指定してFirestoreクライアントを取得
  const client =
    dbId === "(default)" ? getFirestore() : getFirestore(dbId);

  firestoreClients.set(dbId, client);

  console.log(`[Firestore] Connected to database: ${dbId}`);

  return client;
}

/**
 * Firestore コレクションへの参照を取得
 */
export function getCollection(collectionName: string, databaseId?: string) {
  const db = getFirestoreClient(databaseId);
  return db.collection(collectionName);
}

/**
 * Firestore ドキュメントへの参照を取得
 */
export function getDocument(
  collectionName: string,
  docId: string,
  databaseId?: string,
) {
  const db = getFirestoreClient(databaseId);
  return db.collection(collectionName).doc(docId);
}
