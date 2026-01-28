import { NextResponse } from "next/server";

import { getPrismaClient } from "@/libs/prisma";

export const runtime = "nodejs";

/**
 * DB接続テスト用APIエンドポイント
 *
 * GET: 全件取得
 * POST: 新規作成
 * PUT: 更新
 * DELETE: 削除
 */

// GET: 全件取得
export async function GET() {
  try {
    const prisma = await getPrismaClient();
    const samples = await prisma.testSample.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: samples,
      count: samples.length,
    });
  } catch (error) {
    console.error("Failed to fetch test samples:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// POST: 新規作成
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message } = body as { message: string };

    if (!message) {
      return NextResponse.json(
        { success: false, error: "message is required" },
        { status: 400 },
      );
    }

    const prisma = await getPrismaClient();
    const sample = await prisma.testSample.create({
      data: { message },
    });

    return NextResponse.json({
      success: true,
      data: sample,
    });
  } catch (error) {
    console.error("Failed to create test sample:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// PUT: 更新
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, message } = body as { id: number; message: string };

    if (!id || !message) {
      return NextResponse.json(
        { success: false, error: "id and message are required" },
        { status: 400 },
      );
    }

    const prisma = await getPrismaClient();
    const sample = await prisma.testSample.update({
      where: { id },
      data: { message },
    });

    return NextResponse.json({
      success: true,
      data: sample,
    });
  } catch (error) {
    console.error("Failed to update test sample:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// DELETE: 削除
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "id is required" },
        { status: 400 },
      );
    }

    const prisma = await getPrismaClient();
    await prisma.testSample.delete({
      where: { id: parseInt(id, 10) },
    });

    return NextResponse.json({
      success: true,
      message: `Deleted sample with id: ${id}`,
    });
  } catch (error) {
    console.error("Failed to delete test sample:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
