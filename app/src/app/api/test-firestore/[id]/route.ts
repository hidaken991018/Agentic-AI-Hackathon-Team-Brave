import { NextResponse } from "next/server";

import { getDocument } from "@/libs/firestore";

/**
 * Firestore 個別ドキュメント操作API（開発用）
 *
 * GET: ドキュメントを取得
 * PUT: ドキュメントを更新
 * DELETE: ドキュメントを削除
 */

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const collectionName = searchParams.get("collection") || "test";

    const docRef = getDocument(collectionName, id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      document: { id: doc.id, ...doc.data() },
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

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const collectionName = searchParams.get("collection") || "test";
    const body = await request.json();

    const docRef = getDocument(collectionName, id);

    await docRef.update({
      ...body,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      documentId: id,
    });
  } catch (error) {
    console.error("Firestore PUT error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const collectionName = searchParams.get("collection") || "test";

    const docRef = getDocument(collectionName, id);
    await docRef.delete();

    return NextResponse.json({
      success: true,
      documentId: id,
    });
  } catch (error) {
    console.error("Firestore DELETE error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
