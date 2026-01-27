import { NextResponse } from "next/server";

import { addDocumentWithTTL, getCollection } from "@/libs/firestore";

/**
 * Firestore 接続テスト用API（開発用）
 *
 * GET: ドキュメント一覧を取得
 * POST: 新規ドキュメントを作成（TTL対応）
 *   - ttl: 有効期限（秒）。省略時はTTLなし
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const collectionName = searchParams.get("collection") || "test";

    const collection = getCollection(collectionName);
    const snapshot = await collection
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const documents = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      collection: collectionName,
      documents,
    });
  } catch (error) {
    console.error("Firestore GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const collectionName = searchParams.get("collection") || "test";
    const ttlParam = searchParams.get("ttl");
    const ttlSeconds = ttlParam ? parseInt(ttlParam, 10) : undefined;

    const body = await request.json();

    const docRef = await addDocumentWithTTL(
      collectionName,
      body,
      ttlSeconds,
    );

    return NextResponse.json({
      success: true,
      documentId: docRef.id,
      ttl: ttlSeconds ? `${ttlSeconds}秒後に自動削除` : "TTLなし",
    });
  } catch (error) {
    console.error("Firestore POST error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
