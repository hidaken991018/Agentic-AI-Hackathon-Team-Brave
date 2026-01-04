# --------------------------------------------------------------------------------
# 0. 変数の定義（GitHub Actions から注入される値を受け取る窓口）
# --------------------------------------------------------------------------------
variable "gcp_project_id" {
  description = "Google CloudのプロジェクトID"
  type        = string
}

# --------------------------------------------------------------------------------
# 1. Terraform 本体の設定（Backend: チーム共有のための保存場所）
# --------------------------------------------------------------------------------
terraform {
  # 状態ファイル（tfstate）を Google Cloud Storage に保存
  backend "gcs" {
    bucket = "ai-brave-terraform-state"
    prefix = "terraform/state"
  }

  required_providers {
    google = {
      source = "hashicorp/google"
    }
  }
}

# --------------------------------------------------------------------------------
# 2. Google Cloud プロバイダーの設定
# --------------------------------------------------------------------------------
provider "google" {
  # 環境変数 var.gcp_project_id を使用
  project = var.gcp_project_id
  region  = "asia-northeast1"
}

# --------------------------------------------------------------------------------
# 3. リソースの定義（管理対象のインフラ）
# --------------------------------------------------------------------------------

# 管理用バケット自体の定義
resource "google_storage_bucket" "infra_setting_storage" {
  name          = "ai-brave-terraform-state"
  location      = "ASIA"
  force_destroy = true

  public_access_prevention = "enforced"

  versioning {
    enabled = true
  }
}

# プロジェクトの詳細情報を取得するための「窓口」
data "google_project" "project" {
}