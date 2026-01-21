import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

/**
 * Google Cloud Secret Manager のラッパー
 *
 * Secret Manager APIへのアクセスを抽象化し、
 * シークレットの取得とキャッシュを管理する
 */

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
export const getProjectIdFromMetadata = async (): Promise<string | undefined> => {
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
      },
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
export const getSecret = async (
  secretName: string,
  projectId: string,
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
 * 複数のシークレットを一括で取得
 * @param secretNames シークレット名の配列
 * @param projectId GCPプロジェクトID
 * @returns シークレット名と値のマップ
 */
export const getSecrets = async (
  secretNames: string[],
  projectId: string,
): Promise<Map<string, string | undefined>> => {
  const results = new Map<string, string | undefined>();

  await Promise.all(
    secretNames.map(async (name) => {
      const value = await getSecret(name, projectId);
      results.set(name, value);
    }),
  );

  return results;
};
