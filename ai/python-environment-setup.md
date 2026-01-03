# Python 環境構築ガイド（uv）

本プロジェクトでは、Python のバージョン管理およびパッケージ管理に **uv** を使用します。

## 前提条件

- macOS / Linux / Windows（WSL 推奨）
- インターネット接続

## 1. uv のインストール

### macOS / Linux

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Windows（PowerShell）

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### Homebrew（macOS / Linux）

```bash
brew install uv
```

インストール後、ターミナルを再起動するか以下を実行してパスを通します。

```bash
source $HOME/.local/bin/env  # macOS / Linux
```

### インストール確認

```bash
uv --version
# uv 0.9.20
```

## 2. プロジェクトのセットアップ

### 2.1 Python 環境の構築

プロジェクトディレクトリで以下を実行します。

```bash
uv sync
```

このコマンドで以下が自動的に行われます：

1. `.python-version` に記載された Python バージョンのインストール（未インストールの場合）
2. `.venv` ディレクトリに仮想環境を作成
3. `pyproject.toml` に記載された依存パッケージのインストール
4. `uv.lock` に基づく厳密なバージョンでの再現

### 2.2 セットアップ確認

```bash
# 仮想環境のPythonバージョン確認
uv run python --version

# パッケージの確認
uv run python -c "import vertexai; print(vertexai.__version__)"
```

## 3. 日常的な使い方

### コマンドの実行

`uv run` を使うと、仮想環境を明示的に activate せずにコマンドを実行できます。

```bash
# Pythonスクリプトの実行
uv run python main.py

# 任意のコマンド
uv run <command>
```

### 仮想環境の activate（従来の方法）

activate とは、現在のシェルセッションで仮想環境の Python をデフォルトとして使用する状態にすることです。activate すると `uv run` なしで直接 `python` などを実行できます。

```bash
# macOS / Linux
source .venv/bin/activate

# Windows
.venv\Scripts\activate
```

### パッケージの追加

```bash
# 本番依存の追加
uv add <package-name>

# 開発依存の追加
uv add --dev <package-name>

# バージョン指定
uv add "requests>=2.28.0,<3.0.0"
```

### パッケージの削除

```bash
uv remove <package-name>
```

### 依存関係の更新

```bash
# 特定のパッケージのみ更新
uv lock --upgrade-package <package-name>

# lockファイル更新後、インストール
uv sync
```

## 4. プロジェクト構成

uv で管理されるプロジェクトは以下のファイル構成になります。

```
project/
├── .python-version    # 使用するPythonバージョン（例: 3.11）
├── .venv/             # 仮想環境（.gitignoreに含める）
├── pyproject.toml     # プロジェクト設定・依存関係定義
├── uv.lock            # 依存関係のロックファイル（コミット必須）
└── ...
```

### 各ファイルの役割

| ファイル          | 役割                           | Git 管理  |
| ----------------- | ------------------------------ | --------- |
| `.python-version` | Python バージョンの指定        | ✅ する   |
| `pyproject.toml`  | プロジェクト設定・依存関係     | ✅ する   |
| `uv.lock`         | 依存関係の厳密なバージョン固定 | ✅ する   |
| `.venv/`          | 仮想環境                       | ❌ しない |

## 参考リンク

- [uv 公式ドキュメント](https://docs.astral.sh/uv/)
- [uv GitHub リポジトリ](https://github.com/astral-sh/uv)
