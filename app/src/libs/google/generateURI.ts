/**
 * ADK パターン用の URI 生成（既存 - 後方互換性のため維持）
 *
 * @param location - GCP リージョン（例: asia-northeast1）
 * @param resourceName - リソース名（例: projects/xxx/locations/yyy/agents/zzz）
 * @returns ADK パターンの :query エンドポイント URI
 */
export function getSessionURI(location: string, resourceName: string) {
  return `https://${location}-aiplatform.googleapis.com/v1/${resourceName}:query`;
}

/**
 * REST API パターン用のセッションベース URI 生成
 *
 * @param location - GCP リージョン（例: asia-northeast1）
 * @param projectId - GCP プロジェクト ID
 * @param reasoningEngineId - Reasoning Engine ID
 * @returns セッション一覧・作成用のベース URI
 */
export function getSessionsBaseURI(
  location: string,
  projectId: string,
  reasoningEngineId: string,
) {
  return `https://${location}-aiplatform.googleapis.com/v1beta1/projects/${projectId}/locations/${location}/reasoningEngines/${reasoningEngineId}/sessions`;
}

/**
 * REST API パターン用の個別セッション URI 生成
 *
 * @param location - GCP リージョン（例: asia-northeast1）
 * @param projectId - GCP プロジェクト ID
 * @param reasoningEngineId - Reasoning Engine ID
 * @param sessionId - セッション ID
 * @returns 特定セッション操作用の URI
 */
export function getSessionURI_REST(
  location: string,
  projectId: string,
  reasoningEngineId: string,
  sessionId: string,
) {
  return `${getSessionsBaseURI(location, projectId, reasoningEngineId)}/${sessionId}`;
}
