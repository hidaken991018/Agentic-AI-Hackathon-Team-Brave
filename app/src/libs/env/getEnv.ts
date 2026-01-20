import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

/**
 * 環境変数を取得するユーティリティ
 *
 * - ローカル環境: process.env（.env.local）から取得
 * - GCP環境: Secret Managerから取得
 *
 * 判定基準: K_SERVICE環境変数の有無（Cloud Run上ではこの変数が自動設定される）
 */

const isGCP = (): boolean => {
  return !!process.env.K_SERVICE;
};

// Secret Managerクライアント（シングルトン）
let secretManagerClient: SecretManagerServiceClient | null = null;

const getSecretManagerClient = (): SecretManagerServiceClient => {
  if (!secretManagerClient) {
    secretManagerClient = new SecretManagerServiceClient();
  }
  return secretManagerClient;
};

// Secret Managerから取得した値をキャッシュ
const secretCache = new Map<string, string>();

// プロジェクトIDのキャッシュ
let cachedProjectId: string | null = null;

/**
 * GCPメタデータサーバーからプロジェクトIDを取得
 * Cloud Run環境では自動的に取得可能
 */
const getProjectIdFromMetadata = async (): Promise<string | undefined> => {
  if (cachedProjectId) {
    return cachedProjectId;
  }

  try {
    const response = await fetch(
      "http://metadata.google.internal/computeMetadata/v1/project/project-id",
      {
        headers: {
          "Metadata-Flavor": "Google",
        },
      }
    );

    if (response.ok) {
      cachedProjectId = await response.text();
      return cachedProjectId;
    }
  } catch (error) {
    console.error("Failed to get project ID from metadata server:", error);
  }

  return undefined;
};

/**
 * Secret Managerからシークレットを取得
 * @param secretName シークレット名
 * @param projectId GCPプロジェクトID
 * @returns シークレットの値
 */
const getSecretFromSecretManager = async (
  secretName: string,
  projectId: string
): Promise<string | undefined> => {
  // キャッシュに存在すればそれを返す
  if (secretCache.has(secretName)) {
    return secretCache.get(secretName);
  }

  try {
    const client = getSecretManagerClient();
    const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;

    const [response] = await client.accessSecretVersion({ name });
    const payload = response.payload?.data;

    if (payload) {
      const value =
        payload instanceof Uint8Array
          ? new TextDecoder().decode(payload)
          : String(payload);
      secretCache.set(secretName, value);
      return value;
    }
  } catch (error) {
    console.error(`Failed to get secret "${secretName}":`, error);
  }

  return undefined;
};

/**
 * 環境変数を取得する
 *
 * ローカル環境では process.env から、GCP環境では Secret Manager から取得する
 *
 * @param key 環境変数名（Secret Manager上のシークレット名と同じ）
 * @param projectId GCPプロジェクトID（GCP環境で必要、デフォルトはGCP_PROJECT_ID環境変数）
 * @returns 環境変数の値
 */
export const getEnv = async (
  key: string,
  projectId?: string
): Promise<string | undefined> => {
  // ローカル環境の場合は process.env から取得
  if (!isGCP()) {
    return process.env[key];
  }

  // GCP環境の場合は Secret Manager から取得
  // プロジェクトIDは引数 > メタデータサーバー の優先順位で取得
  const gcpProjectId = projectId || (await getProjectIdFromMetadata());
  if (!gcpProjectId) {
    console.error(
      "Failed to get GCP project ID. Cannot access Secret Manager without project ID."
    );
    return undefined;
  }

  return getSecretFromSecretManager(key, gcpProjectId);
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
  projectId?: string
): Promise<Map<string, string | undefined>> => {
  const results = new Map<string, string | undefined>();

  await Promise.all(
    keys.map(async (key) => {
      const value = await getEnv(key, projectId);
      results.set(key, value);
    })
  );

  return results;
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
  projectId?: string
): Promise<string> => {
  const value = await getEnv(key, projectId);

  if (value === undefined) {
    throw new Error(`Required environment variable "${key}" is not set.`);
  }

  return value;
};
