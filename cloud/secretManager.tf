# --------------------------------------------------------------------------------
# Secret Manager の設定
# --------------------------------------------------------------------------------

# --------------------------------------------------------------------------------
# 1. Secret Manager API の有効化
# --------------------------------------------------------------------------------
resource "google_project_service" "secretmanager_api" {
  service            = "secretmanager.googleapis.com"
  disable_on_destroy = false
}

# --------------------------------------------------------------------------------
# 2. シークレット定義
# --------------------------------------------------------------------------------
locals {
  secrets = {
    "ENV_VAR_TEST"          = "default-value-1"
    "ENV_VAR_TEST_2"        = "default-value-2"
    "DATABASE_URL"          = "postgresql://user:password@host:5432/dbname" # GCPコンソールで実際の値に更新
    "FIRESTORE_DATABASE_ID" = "life-compass"
    "APP_URL"               = "https://example.com" # GCPコンソールで実際の値に更新
    "FIREBASE_PRIVATE_KEY"  = "-----BEGIN PRIVATE KEY-----"              # GCPコンソールで実際の値に更新
    "FIREBASE_CLIENT_EMAIL" = "example@project.iam.gserviceaccount.com"  # GCPコンソールで実際の値に更新
    "FIREBASE_PROJECT_ID"   = "your-project-id"                          # GCPコンソールで実際の値に更新
    "GCP_PROJECT_NUMBER"    = "000000000000"                              # GCPコンソールで実際の値に更新
    "VERTEX_AGT_LOCATION"   = "us-central1"
    "VERTEX_AGT_RESOURCE_NAME" = "projects/000000000000/locations/us-central1/reasoningEngines/0000000000000000000" # GCPコンソールで実際の値に更新
    "VERTEX_GEMINI_MODEL"   = "gemini-2.5-flash"
    "VERTEX_GEMINI_LOCATION" = "us-central1"
  }
}

# --------------------------------------------------------------------------------
# 3. シークレットの作成
#    - 既存のシークレットがある場合は上書きしない
#    - GCPコンソールでの変更も上書きしない
# --------------------------------------------------------------------------------
resource "google_secret_manager_secret" "secrets" {
  for_each  = local.secrets
  secret_id = each.key

  replication {
    auto {}
  }

  depends_on = [google_project_service.secretmanager_api]

  lifecycle {
    ignore_changes = all
  }
}

# 初期バージョン（デフォルト値）- GCPコンソールから新バージョンを追加して上書き可能
resource "google_secret_manager_secret_version" "secret_versions" {
  for_each    = local.secrets
  secret      = google_secret_manager_secret.secrets[each.key].id
  secret_data = each.value

  lifecycle {
    ignore_changes = all
  }
}

# --------------------------------------------------------------------------------
# 4. Cloud Run サービスアカウントへのアクセス権限付与（シークレット単位）
# --------------------------------------------------------------------------------
resource "google_secret_manager_secret_iam_member" "secret_access" {
  for_each  = local.secrets
  secret_id = google_secret_manager_secret.secrets[each.key].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = local.run_service_account
}
