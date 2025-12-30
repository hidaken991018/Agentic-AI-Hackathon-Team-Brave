# --------------------------------------------------------------------------------
# 1. Terraform 本体の設定（Backend: チーム共有のための保存場所）
# --------------------------------------------------------------------------------
terraform {

  # 状態ファイル（tfstate）を Google Cloud Storage に保存し、複数人での同時編集を可能にします
  backend "gcs" {
    bucket = "ai-brave-terraform-state" # 先ほど作成したバケット名
    prefix = "terraform/state"          # バケット内での保存先フォルダ
  }

  required_providers {
    google = {
      source  = "hashicorp/google"
    }
  }
}

# --------------------------------------------------------------------------------
# 2. Google Cloud プロバイダーの設定
# --------------------------------------------------------------------------------
provider "google" {
  project = "fifth-boulder-481807-f8" # あなたのプロジェクトID
  region  = "asia-northeast1"         # デフォルトのリージョン（東京）
}

# --------------------------------------------------------------------------------
# 3. リソースの定義（管理対象のインフラ）
# --------------------------------------------------------------------------------

# 管理用バケット自体の定義（すでに作成済みですが、コードに含めておくことでTerraformの管理下に置かれます）
resource "google_storage_bucket" "infra_setting_storage" {
  name          = "ai-brave-terraform-state"
  location      = "ASIA"
  force_destroy = true # 削除時に中身があっても強制削除を許可

  # セキュリティ：公開アクセスを禁止する設定
  public_access_prevention = "enforced"

  # 誤って削除されないよう、バージョニング（履歴管理）を有効にすることを推奨します
  versioning {
    enabled = true
  }
}