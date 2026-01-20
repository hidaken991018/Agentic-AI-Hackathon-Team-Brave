# --------------------------------------------------------------------------------
# 0. 変数の定義（GitHub Actions 等から注入されるリスト）
# --------------------------------------------------------------------------------
variable "allowed_users" {
  description = "Cloud Run へのアクセスを許可するメールアドレスのリスト"
  type        = list(string)
  # GitHub Actions の Secrets で設定
}

# --------------------------------------------------------------------------------
# Cloud Run サービス本体
# --------------------------------------------------------------------------------
resource "google_cloud_run_v2_service" "front_back_app" {
  name     = "life-compass-agent"
  location = "asia-northeast1"
  
  template {
    # Cloud SQL 接続のためのアノテーション
    annotations = {
      "run.googleapis.com/cloudsql-instances" = google_sql_database_instance.main_db.connection_name
    }

    containers {
      image = "us-docker.pkg.dev/cloudrun/container/hello" # 実際は自身のイメージを指定
      
      # 必要に応じてDB接続用の環境変数を追加
      env {
        name  = "DB_CONNECTION_NAME"
        value = google_sql_database_instance.main_db.connection_name
      }
    }
  }

  # APIが有効化されるまで作成を待機
  depends_on = [google_project_service.required_apis]
}

# --------------------------------------------------------------------------------
# IAM 権限設定（サービスアカウントの特定）
# --------------------------------------------------------------------------------

# Cloud Runが使用するサービスアカウント（デフォルトを使用する場合の指定）
locals {
  run_service_account = "serviceAccount:${data.google_project.project.number}-compute@developer.gserviceaccount.com"
}


# --------------------------------------------------------------------------------
# IAM 権限設定（リソースへのアクセス許可）
# --------------------------------------------------------------------------------

# 1. 変数 allowed_users に基づくアクセス権限設定
resource "google_cloud_run_v2_service_iam_member" "private_access" {
  # リストを set に変換してループ処理
  for_each = toset(var.allowed_users)

  location = google_cloud_run_v2_service.front_back_app.location
  name     = google_cloud_run_v2_service.front_back_app.name
  role     = "roles/run.invoker"
  
  # 各メールアドレスに "user:" プレフィックスを付けて指定
  member   = "user:${each.value}"
}

# 2. Vertex AI 利用権限の付与
resource "google_project_iam_member" "run_vertex_ai" {
  project = data.google_project.project.project_id
  role    = "roles/aiplatform.user"
  member  = local.run_service_account
  
  depends_on = [google_cloud_run_v2_service.front_back_app]
}

# 3. Firestore 読み書き権限の付与
resource "google_project_iam_member" "run_firestore" {
  project = data.google_project.project.project_id
  role    = "roles/datastore.user"
  member  = local.run_service_account
  
  depends_on = [google_cloud_run_v2_service.front_back_app]
}

# Cloud RunのURLを出力
output "cloud_run_url" {
  value = google_cloud_run_v2_service.front_back_app.uri
}