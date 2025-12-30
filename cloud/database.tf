# --- データベース (Firestore) ---
resource "google_firestore_database" "database" {
  name        = "(default)"
  location_id = "asia-northeast1"
  type        = "FIRESTORE_NATIVE"

  depends_on = [google_project_service.required_apis]
}

# --- データベース (Cloud SQL: PostgreSQLを想定) ---
resource "google_sql_database_instance" "main_db" {
  name             = "life-compass-db"
  region           = "asia-northeast1"
  database_version = "POSTGRES_15"
  
  settings {
    tier = "db-f1-micro" # 最小構成
  }

  deletion_protection = true
  depends_on          = [google_project_service.required_apis]
}