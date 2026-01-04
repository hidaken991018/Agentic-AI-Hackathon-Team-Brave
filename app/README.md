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
