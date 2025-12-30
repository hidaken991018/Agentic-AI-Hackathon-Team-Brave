# 使用する全APIの一括有効化
resource "google_project_service" "required_apis" {
  for_each = toset([
    "run.googleapis.com",             # Cloud Run用
    "aiplatform.googleapis.com",      # Vertex AI用
    "firestore.googleapis.com",       # Firestore用
    "sqladmin.googleapis.com",        # Cloud SQL用
    "cloudscheduler.googleapis.com",  # Cloud Scheduler用
    "gmail.googleapis.com",           # Gmail API用
    "monitoring.googleapis.com",      # Cloud Monitoring用
  ])

  service            = each.value
  disable_on_destroy = false
}