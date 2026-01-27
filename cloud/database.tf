# --- データベース (Firestore) ---
resource "google_firestore_database" "database" {
  name        = "life-compass"
  location_id = "asia-northeast1"
  type        = "FIRESTORE_NATIVE"

  depends_on = [google_project_service.required_apis]
}

# --- データベース (Cloud SQL: PostgreSQL) ---
resource "google_sql_database_instance" "main_db" {
  name             = "life-compass-postgres"
  region           = "asia-northeast1"
  database_version = "POSTGRES_15"

  settings {
    tier = "db-f1-micro" # 最小構成
  }

  deletion_protection = true
  depends_on          = [google_project_service.required_apis]
}

# Cloud SQL データベース
resource "google_sql_database" "app_db" {
  name     = "life_compass"
  instance = google_sql_database_instance.main_db.name
}

# Cloud SQL ユーザー
resource "google_sql_user" "app_user" {
  name     = "app_user"
  instance = google_sql_database_instance.main_db.name
  password = var.db_password
}