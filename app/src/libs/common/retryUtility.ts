/**
 * リトライユーティリティ
 *
 * 外部サービス呼び出しにおける一時的な障害に対応するため、
 * 指数バックオフによる自動リトライ機能を提供します。
 *
 * @module retryUtility
 */

/**
 * 成功または失敗を表す Result 型
 * - ok: true の場合、value に成功値が格納される
 * - ok: false の場合、error にエラー情報が格納される
 */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/**
 * 最大リトライ回数超過時に返却されるエラー型
 */
export type RetryError = {
  /** エラーコード: 常に "MAX_RETRIES_EXCEEDED" */
  code: "MAX_RETRIES_EXCEEDED";
  /** エラーメッセージ */
  message: string;
  /** 試行回数 */
  attempts: number;
  /** 最後に発生したエラー */
  lastError: unknown;
};

/**
 * リトライ動作の設定オプション
 */
export interface RetryOptions {
  /** 最大リトライ回数（デフォルト: 2回、計3回試行） */
  maxRetries: number;
  /** 初回リトライまでの待機時間（ミリ秒、デフォルト: 1000ms） */
  initialDelayMs: number;
  /** 指数バックオフの乗数（デフォルト: 2） */
  backoffMultiplier: number;
}

/**
 * デフォルトのリトライオプション
 * - 最大2回リトライ（計3回試行）
 * - 初回待機: 1秒、2回目待機: 2秒
 */
const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 2,
  initialDelayMs: 1000,
  backoffMultiplier: 2,
};

/**
 * 指定時間待機するユーティリティ関数
 * @param ms - 待機時間（ミリ秒）
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 指数バックオフに基づいてリトライ待機時間を計算
 * @param attempt - 現在の試行回数（0始まり）
 * @param initialDelayMs - 初回待機時間
 * @param backoffMultiplier - バックオフ乗数
 * @returns 待機時間（ミリ秒）
 *
 * @example
 * // attempt=0: 1000ms, attempt=1: 2000ms
 */
function calculateDelay(
  attempt: number,
  initialDelayMs: number,
  backoffMultiplier: number,
): number {
  return initialDelayMs * Math.pow(backoffMultiplier, attempt);
}

/**
 * リトライユーティリティサービスのインターフェース
 * 依存性注入やテスト用に使用
 */
export interface RetryUtilityService {
  withRetry<T>(
    operation: () => Promise<T>,
    options?: Partial<RetryOptions>,
  ): Promise<Result<T, RetryError>>;
}

/**
 * 非同期処理を自動リトライ付きで実行
 *
 * 指数バックオフでリトライ間隔を制御:
 * - 1回目のリトライ: initialDelayMs 待機（デフォルト1秒）
 * - 2回目のリトライ: initialDelayMs × backoffMultiplier 待機（デフォルト2秒）
 *
 * @param operation - 実行する非同期処理
 * @param options - リトライ動作のオプション設定
 * @returns 成功時は value、失敗時は RetryError を含む Result
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => fetch('https://api.example.com/data'),
 *   { maxRetries: 3, initialDelayMs: 500 }
 * );
 *
 * if (result.ok) {
 *   console.log('成功:', result.value);
 * } else {
 *   console.error('リトライ後も失敗:', result.error);
 * }
 * ```
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options?: Partial<RetryOptions>,
): Promise<Result<T, RetryError>> {
  const { maxRetries, initialDelayMs, backoffMultiplier } = {
    ...DEFAULT_RETRY_OPTIONS,
    ...options,
  };

  let lastError: unknown;
  const totalAttempts = maxRetries + 1; // Initial attempt + retries

  for (let attempt = 0; attempt < totalAttempts; attempt++) {
    try {
      const result = await operation();
      return { ok: true, value: result };
    } catch (error) {
      lastError = error;

      const isLastAttempt = attempt === totalAttempts - 1;

      if (isLastAttempt) {
        // すべての試行が失敗
        console.warn(
          `[RetryUtility] 全${totalAttempts}回の試行が失敗しました。処理を中断します。`,
          {
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
          },
        );
        break;
      }

      // 次のリトライまでの待機時間を計算
      const delay = calculateDelay(attempt, initialDelayMs, backoffMultiplier);

      console.warn(
        `[RetryUtility] 試行 ${attempt + 1}/${totalAttempts} が失敗。` +
          `${delay}ms 後にリトライします...`,
        {
          error: error instanceof Error ? error.message : String(error),
          nextRetry: attempt + 2,
          delayMs: delay,
          timestamp: new Date().toISOString(),
        },
      );

      await sleep(delay);
    }
  }

  return {
    ok: false,
    error: {
      code: "MAX_RETRIES_EXCEEDED",
      message: `Operation failed after ${totalAttempts} attempts`,
      attempts: totalAttempts,
      lastError,
    },
  };
}

/**
 * リトライユーティリティサービスのインスタンスを作成
 * 依存性注入やモックテストに活用
 *
 * @returns RetryUtilityService のインスタンス
 */
export function createRetryUtilityService(): RetryUtilityService {
  return {
    withRetry,
  };
}
