## Node.js/npmのバージョン管理

本プロジェクトでは Volta を用いたNode.js/npm のバージョン管理にも対応する。

### (1) Volta のインストール

ターミナルより以下のコマンドで Volta をインストールする。※インストール後、ターミナルを再起動する。

`curl https://get.volta.sh | bash`

### (2) バージョン確認を行う

`node -v`を実行し、 `package.json` に記載のバージョンと同一であることを確認する。
もし相違がある場合には、パスが通っていない可能性がある。

#### パス通し(1) パス設定

~/.zshrc に以下を追記（すでにあれば順番だけ確認）

`export VOLTA_HOME="$HOME/.volta"`
`export PATH="$VOLTA_HOME/bin:$PATH"`

#### パス通し(2)反映

`source ~/.zshrc`：現在のシェルへも設定を適用する。
`hash -r`：Node.js のバージョンキャッシュを削除する。

#### パス通し(3) 確認

`node -v`を実行し、 `package.json` に記載のバージョンと同一であることを確認する。

## データベース（PostgreSQL/Firestore）の起動

### (1)Docker Desktop を起動する

[Docker Desktop](https://matsuand.github.io/docs.docker.jp.onthefly/desktop/mac/install/)を起動する（要インストール）。

### (2)docker-compose.yaml と同一階層へ移動する。

以下のコマンド（`~`の部分は自身のローカルディレクトリで読み替える）を実行し、docker-compose.yaml が存在するディレクトリへ移動する。

`mv ~/app`

### (3)docker コンテナを起動する

以下のコマンドで docker コンテナを起動する。

`docker compose -p life-compass up --build -d`

その後、Docker Desktop の `Containers` にて `life-compass` が表示されていれば OK。

### ※動作確認

#### 動作確認(1)PostgreSQL

以下のコマンドを実行し、DB 内に入れることを確認する。

`docker exec -it local-postgres psql -U myuser -d mydb`

#### 動作確認(2)Firestore

以下の URL へブラウザ経由でアクセスし、エミュレーターが表示されることを確認する。

`http://localhost:4000`

## ローカル環境でのAIエージェント/Gemini APIを実行する方法

以下のコマンドを実行し、GCP Auth へログインする。

```
gcloud auth application-default login
```

自動的に `application_default_credentials.json` がローカルに作成される。準備完了。

### ※GCP Auth からログアウト

GCP Auth からログアウトするためには以下をコマンドする。
gcloud auth application-default revoke
