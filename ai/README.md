# AI エージェント

## 📁 ディレクトリ構成

```
ai/
├── README.md                      # このファイル
├── python-environment-setup.md    # Python 環境構築ガイド（uv）
├── agent-engine-setup.md          # Agent Engine セットアップガイド
├── create_agent_id.py             # エージェント ID 作成スクリプト
├── pyproject.toml                 # Python プロジェクト設定
├── .python-version                # Python バージョン指定（3.11）
└── .venv/                         # 仮想環境（自動生成）
```

## 🚀 初期セットアップ

### 前提条件

gcloud CLI のインストールと認証が必要です。

```bash
# gcloud CLI のインストール（未インストールの場合）
# https://cloud.google.com/sdk/docs/install

# 認証
gcloud auth application-default login
```

### Python 環境の構築

**[Python 環境構築ガイド](./python-environment-setup.md)** を参照してください。

## 📚 Agent Engine の利用（必要時のみ）

Agent Engine を利用する必要がある場合は、**[Agent Engine セットアップガイド](./agent-engine-setup.md)** を参照してください。
