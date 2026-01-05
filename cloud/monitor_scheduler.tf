# --------------------------------------------------------------------------------
# Cloud Scheduler (定期実行用)
# --------------------------------------------------------------------------------
resource "google_cloud_scheduler_job" "periodic_job" {
  name             = "daily-life-quiz-send-job"
  description      = "定期的なクイズ送信命令"
  schedule          = "0 9 * * *" 
  time_zone        = "Asia/Tokyo"
  region           = "asia-northeast1"
  paused           = true # デフォルトは無効

  http_target {
    http_method = "POST"
    uri         = google_cloud_run_v2_service.front_back_app.uri
    
    # Schedulerが自身を証明してCloud Runを叩くためのトークン設定
    oidc_token {
      # サービスアカウントのアドレスを直接指定するか、dataソースを利用
      service_account_email = "${data.google_project.project.number}-compute@developer.gserviceaccount.com"
      # Cloud RunのURLをAudienceとして指定
      audience = google_cloud_run_v2_service.front_back_app.uri
    }
  }

  depends_on = [google_project_service.required_apis]
}

# SchedulerがCloud Runを起動（Invoke）するための権限
resource "google_cloud_run_v2_service_iam_member" "scheduler_invoker" {
  location = google_cloud_run_v2_service.front_back_app.location
  name     = google_cloud_run_v2_service.front_back_app.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${data.google_project.project.number}-compute@developer.gserviceaccount.com"
}

# --------------------------------------------------------------------------------
# Cloud Monitoring (監視・アラート)
# --------------------------------------------------------------------------------

# 監視ダッシュボード
resource "google_monitoring_dashboard" "run_dashboard" {
  dashboard_json = jsonencode({
    displayName = "Life Compass Agent Monitor"
    gridLayout = {
      widgets = [{
        title = "Cloud Run Request Count"
        xyChart = {
          dataSets = [{
            plotType = "LINE"
            targetAxis = "Y1"
            timeSeriesQuery = {
              timeSeriesFilter = {
                filter = "resource.type=\"cloud_run_revision\" metric.type=\"run.googleapis.com/request_count\""
              }
            }
          }]
        }
      }]
    }
  })
}

# アラートポリシー (5xxエラー検知)
resource "google_monitoring_alert_policy" "run_error_alert" {
  display_name = "Cloud Run Error Alert"
  combiner     = "OR"
  conditions {
    display_name = "High Error Rate"
    condition_threshold {
      filter     = "resource.type=\"cloud_run_revision\" metric.type=\"run.googleapis.com/request_count\" metric.labels.response_code_class=\"5xx\""
      duration   = "60s"
      comparison = "COMPARISON_GT"
      threshold_value = 1

      #エラー解消のための集計設定
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE" # DELTA型メトリクスを「率」に変換して整列させる
      }
    }
  }
}