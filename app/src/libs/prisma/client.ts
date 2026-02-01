import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { getEnv, isGCP } from "@/config";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Prisma Client のラッパー（Prisma 7.x + Driver Adapter）
 *
 * - ローカル環境: .env.local の DATABASE_URL を使用
 * - GCP環境: Secret Manager から DATABASE_URL を取得
 *
 * PrismaClient はシングルトンとして管理し、
 * 開発時のホットリロードでも接続が増えないようにする
 */

// グローバルにPrismaClientを保持（開発時のホットリロード対策）
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

let prismaClient: PrismaClient | null = null;
let connectionPool: Pool | null = null;

/**
 * データベース接続URLを取得
 */
async function getDatabaseUrl(): Promise<string> {
  const url = await getEnv("DATABASE_URL");

  if (!url) {
    const env = isGCP() ? "GCP (Secret Manager)" : "Local (.env.local)";
    throw new Error(
      `DATABASE_URL is not set. Please configure it in ${env}.`,
    );
  }

  return url;
}

/**
 * PrismaClient のインスタンスを取得
 *
 * 初回呼び出し時にデータベース接続URLを取得し、
 * PrismaClient を初期化する
 */
export async function getPrismaClient(): Promise<PrismaClient> {
  // 既に初期化済みの場合はそれを返す
  if (prismaClient) {
    return prismaClient;
  }

  // グローバルに保持されている場合はそれを返す（開発時のホットリロード対策）
  if (globalForPrisma.prisma) {
    prismaClient = globalForPrisma.prisma;
    connectionPool = globalForPrisma.pool ?? null;
    return prismaClient;
  }

  // データベースURLを取得
  const databaseUrl = await getDatabaseUrl();

  // PostgreSQL接続プールを作成
  connectionPool = new Pool({
    connectionString: databaseUrl,
  });

  // Prisma Adapterを作成
  const adapter = new PrismaPg(connectionPool);

  // PrismaClientを初期化
  prismaClient = new PrismaClient({
    adapter,
  });

  // 開発環境ではグローバルに保持
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prismaClient;
    globalForPrisma.pool = connectionPool;
  }

  return prismaClient;
}

/**
 * データベース接続を切断
 */
export async function disconnectPrisma(): Promise<void> {
  if (prismaClient) {
    await prismaClient.$disconnect();
    prismaClient = null;
  }
  if (connectionPool) {
    await connectionPool.end();
    connectionPool = null;
  }
}
