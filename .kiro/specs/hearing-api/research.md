# Research & Design Decisions

---
**Purpose**: hearing-api 機能の技術設計を支える調査結果と設計決定の記録

**Usage**:
- ディスカバリーフェーズで得た知見を記録
- design.md には載せきれない詳細なトレードオフを文書化
- 将来の監査や再利用のための参照資料
---

## Summary
- **Feature**: `hearing-api`
- **Discovery Scope**: Extension（既存システムの拡張）
- **Key Findings**:
  - 既存の API 統合パターン（`/api/agent/query`）を踏襲し、新しい3つのエンドポイントを追加
  - セッション管理は既存の `createSessionId.ts` を拡張利用可能
  - Zod スキーマによるバリデーションパターンは確立済み

## Research Log

### 既存実装パターンの分析
- **Context**: 新しい API エンドポイントを追加するにあたり、既存のコードパターンを理解する必要があった
- **Sources Consulted**:
  - `app/src/app/api/agent/query/route.ts` - 既存 API エンドポイント
  - `app/src/agents/fpInstructor.ts`, `jsonEditor.ts` - エージェント統合ロジック
  - `app/src/libs/google/` - GCP サービス連携ユーティリティ
- **Findings**:
  - Next.js API Routes（App Router）で `POST` ハンドラを定義
  - `runtime = "nodejs"` で Node.js ランタイムを使用
  - アクセストークン取得 → セッション管理 → エージェント呼び出し → レスポンス返却の流れ
  - エラーハンドリングは try-catch で JSON パースエラーを 502 で返却
  - `@/*` パスエイリアスで絶対インポートを使用
- **Implications**:
  - 新しいエンドポイントも同じパターンに従うことで一貫性を保つ
  - エラーハンドリングを強化し、より詳細なエラーコードを返す

### セッション管理の仕組み
- **Context**: 10日間のセッション有効期限とセッション ID 管理の実装方法を確認
- **Sources Consulted**:
  - `app/src/libs/google/createSessionId.ts`
  - `app/src/libs/google/generateURI.ts`
- **Findings**:
  - Vertex AI Agent Engine の `async_create_session` メソッドを使用
  - `user_id` を引数に渡してセッションを作成
  - セッション ID は Agent Engine から返却される（UUID 形式）
  - TTL は Agent Engine 側で管理（設定は Python エージェント側）
- **Implications**:
  - セッション作成ロジックは再利用可能
  - セッション検証ロジックを新規追加する必要あり
  - 追加質問カウントはセッション状態として Agent Engine 側で管理

### Gemini API 構造化出力
- **Context**: 解釈データ API で AI が構造化 JSON を返却する機能の実現方法
- **Sources Consulted**:
  - `app/src/libs/google/queryGemini.ts`
  - `@google/genai` ライブラリのドキュメント
- **Findings**:
  - `GoogleGenAI` クライアントで `vertexai: true` を設定し Vertex AI 経由で Gemini を使用
  - `responseSchema` パラメータで JSON Schema を渡すと構造化出力が得られる
  - `responseMimeType: "application/json"` で JSON 形式を強制
  - Zod スキーマを `z.toJSONSchema()` で JSON Schema に変換可能
- **Implications**:
  - 解釈データ API ではリクエストで受け取った `outputSchema` を Gemini に渡す
  - デフォルトスキーマも用意しておく
  - バリデーションエラー時のリトライロジックが必要

### リトライパターン
- **Context**: LLM 呼び出し失敗時の自動リトライ（最大2回）の実装
- **Sources Consulted**:
  - `docs/hearing-sequence.puml` の仕様
  - 業界標準のリトライパターン
- **Findings**:
  - 指数バックオフ（exponential backoff）が推奨
  - 初回失敗後 1秒、2回目失敗後 2秒の待機時間
  - 3回目（最終試行）も失敗したら 503 エラーを返却
- **Implications**:
  - 共通のリトライユーティリティを作成
  - リトライ回数と待機時間をログに記録

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| 既存パターン拡張 | 現在の API Routes + Agents パターンを踏襲 | 学習コスト低、一貫性維持 | エラーハンドリングが不十分 | 採用：既存パターンを強化する形で実装 |
| サービスレイヤー分離 | API Routes と Business Logic を完全分離 | テスタビリティ向上 | 追加の抽象化レイヤーが必要 | 見送り：現時点ではオーバーエンジニアリング |
| イベント駆動 | 非同期メッセージングで処理 | スケーラビリティ | 複雑性増加、デバッグ困難 | 見送り：ハッカソンの時間制約 |

## Design Decisions

### Decision: API エンドポイント構成
- **Context**: 3つの API をどのように構成するか
- **Alternatives Considered**:
  1. 単一エンドポイント（`/api/hearing`）でアクションパラメータで分岐
  2. 機能別エンドポイント（`/api/hearing/direct-data` など）
  3. RESTful リソース設計（`/api/sessions/{id}/data`）
- **Selected Approach**: 機能別エンドポイント
- **Rationale**:
  - 各 API の責務が明確に分離される
  - エラーハンドリングとバリデーションを個別に最適化可能
  - 将来の拡張性を確保
- **Trade-offs**:
  - エンドポイント数は増えるが、保守性は向上
- **Follow-up**: 共通処理（認証、セッション検証）は middleware またはユーティリティで共通化

### Decision: エラーレスポンス形式
- **Context**: 統一されたエラーレスポンス形式の設計
- **Alternatives Considered**:
  1. 単純な文字列エラーメッセージ
  2. 構造化エラーオブジェクト with UUID
  3. RFC 7807 Problem Details 形式
- **Selected Approach**: 構造化エラーオブジェクト with UUID
- **Rationale**:
  - トラブルシューティングのためエラー ID（UUID）が必要
  - ユーザー向けメッセージと詳細情報を分離
  - RFC 7807 は過剰だが、エッセンスは取り入れる
- **Trade-offs**:
  - 実装コストは若干増えるが、運用時のメリットが大きい
- **Follow-up**: ログ連携でエラー ID を使って追跡可能にする

### Decision: バリデーション戦略
- **Context**: リクエストボディのバリデーション方法
- **Alternatives Considered**:
  1. 手動バリデーション（if 文の羅列）
  2. Zod スキーマ（既存パターン）
  3. class-validator + class-transformer
- **Selected Approach**: Zod スキーマ
- **Rationale**:
  - プロジェクトで既に採用済み（`hearingJsonSchema.ts`）
  - TypeScript 型推論との相性が良い
  - JSON Schema への変換機能で LLM 連携にも使える
- **Trade-offs**: なし（既存パターンの踏襲）
- **Follow-up**: 各 API 用のスキーマファイルを追加

## Risks & Mitigations

- **Risk**: Agent Engine の応答遅延によるタイムアウト
  - **Mitigation**: 30秒タイムアウト設定、進捗表示（ストリーミングレスポンス検討）

- **Risk**: LLM の構造化出力が仕様外の形式を返す
  - **Mitigation**: Zod でランタイムバリデーション、失敗時はリトライ

- **Risk**: セッション状態の不整合（追加質問カウントなど）
  - **Mitigation**: Agent Engine Sessions で一元管理、ロック機構は不要（単一ユーザー操作）

- **Risk**: 認証トークンの期限切れ
  - **Mitigation**: 既存の `getAccessToken()` は都度取得しているため問題なし

## References
- [Vertex AI Agent Engine Documentation](https://cloud.google.com/vertex-ai/docs/generative-ai/agent-builder/overview) — Agent Sessions の仕様
- [Google GenAI SDK](https://github.com/google/genai-js) — Gemini API 構造化出力
- [Zod Documentation](https://zod.dev/) — スキーマバリデーション
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) — App Router の Route Handlers
