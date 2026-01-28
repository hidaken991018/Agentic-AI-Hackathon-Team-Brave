import {
  getSecret,
  getSecrets,
  getProjectIdFromMetadata,
} from "@/libs/google/secretManager";

/**
 * 環境変数を取得するための設定モジュール
 *
 * - ローカル環境: process.env（.env.local）から取得
 * - GCP環境: Secret Managerから取得
 *
 * 判定基準: K_SERVICE環境変数の有無（Cloud Run上ではこの変数が自動設定される）
 */

/**
 * GCP環境かどうかを判定
 */
export const isGCP = (): boolean => {
  return !!process.env.K_SERVICE;
};

/**
 * 環境情報を取得
 */
export const getEnvInfo = () => {
  const gcp = isGCP();
  return {
    isGCP: gcp,
    environment: gcp ? "GCP (Cloud Run)" : "Local",
    source: gcp ? "Secret Manager" : ".env.local (process.env)",
  };
};

/**
 * 環境変数を取得する
 *
 * ローカル環境では process.env から、GCP環境では Secret Manager から取得する
 *
 * @param key 環境変数名（Secret Manager上のシークレット名と同じ）
 * @param projectId GCPプロジェクトID（GCP環境で必要、省略時はメタデータサーバーから取得）
 * @returns 環境変数の値
 */
export const getEnv = async (
  key: string,
  projectId?: string,
): Promise<string | undefined> => {
  // ローカル環境の場合は process.env から取得
  if (!isGCP()) {
    return process.env[key];
  }

  // GCP環境の場合は Secret Manager から取得
  const gcpProjectId = projectId || (await getProjectIdFromMetadata());
  if (!gcpProjectId) {
    console.error(
      "Failed to get GCP project ID. Cannot access Secret Manager without project ID.",
    );
    return undefined;
  }

  return getSecret(key, gcpProjectId);
};

/**
 * 複数の環境変数を一括で取得する
 *
 * @param keys 環境変数名の配列
 * @param projectId GCPプロジェクトID
 * @returns 環境変数名と値のマップ
 */
export const getEnvs = async (
  keys: string[],
  projectId?: string,
): Promise<Map<string, string | undefined>> => {
  // ローカル環境の場合は process.env から取得
  if (!isGCP()) {
    const results = new Map<string, string | undefined>();
    keys.forEach((key) => {
      results.set(key, process.env[key]);
    });
    return results;
  }

  // GCP環境の場合は Secret Manager から取得
  const gcpProjectId = projectId || (await getProjectIdFromMetadata());
  if (!gcpProjectId) {
    console.error(
      "Failed to get GCP project ID. Cannot access Secret Manager without project ID.",
    );
    return new Map();
  }

  return getSecrets(keys, gcpProjectId);
};

/**
 * 必須の環境変数を取得する（存在しない場合はエラー）
 *
 * @param key 環境変数名
 * @param projectId GCPプロジェクトID
 * @returns 環境変数の値
 * @throws 環境変数が存在しない場合
 */
export const getRequiredEnv = async (
  key: string,
  projectId?: string,
): Promise<string> => {
  const value = await getEnv(key, projectId);

  if (value === undefined) {
    throw new Error(`Required environment variable "${key}" is not set.`);
  }

  return value;
};
