# Implementation Plan

## Task Overview

| Category | Tasks | Parallel |
|----------|-------|----------|
| 共通基盤 | 1.1-1.3 | 一部 |
| スキーマ定義 | 2.1-2.3 | すべて |
| 認証ミドルウェア | 3 | - |
| Direct Data API | 4.1-4.2 | - |
| Interpreted Data API | 5.1-5.2 | - |
| Additional Questions API | 6.1-6.2 | - |
| テスト | 7.1-7.2 | 一部 |

---

## Tasks

- [x] 1. 共通基盤の構築
- [x] 1.1 エラーハンドリング基盤を構築する
  - 統一エラーレスポンス形式（エラーID、コード、メッセージ、詳細）を生成するユーティリティを作成する
  - エラーコードと HTTP ステータスコードのマッピングを定義する（400系/500系の区別）
  - エラー発生時にサーバーログへ記録する仕組みを組み込む
  - エラーID（UUID）を自動生成し、トラブルシューティングに活用できるようにする
  - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - _Contracts: ErrorSchema_

- [x] 1.2 (P) リトライユーティリティを実装する
  - 外部サービス呼び出し失敗時の自動リトライ機能を作成する
  - 指数バックオフ（初回1秒、2回目2秒）でリトライ間隔を制御する
  - 最大2回のリトライ（計3回試行）で打ち切り、エラーを返却する
  - リトライ回数と待機時間をログに記録する
  - _Requirements: 1.5, 1.6, 2.7, 2.8, 3.9, 3.10, 5.4_
  - _Contracts: RetryUtility Service_

- [x] 1.3 (P) セッション管理サービスを拡張する
  - 既存の `createSessionId.ts` を拡張し、セッション検証機能を追加する
  - セッション作成時に TTL 10日間を設定する（Agent Engine 側で管理）
  - セッションID の存在確認と有効期限チェックを行う検証機能を実装する
  - セッションデータ更新機能（直接データ・解釈データの保存）を追加する
  - UUID v4 形式でセッション ID を生成・検証する
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - _Contracts: SessionManager Service_

- [x] 2. Zod スキーマ定義
- [x] 2.1 (P) 直接データ API のスキーマを定義する
  - リクエストスキーマ（sessionId 任意、data オブジェクト必須）を Zod で定義する
  - レスポンススキーマ（success、sessionId、storedAt）を定義する
  - sessionId の UUID v4 形式バリデーションを追加する
  - data 内の値に対する基本的なサニタイズ処理を組み込む
  - _Requirements: 1.1, 1.7, 6.1, 6.3, 6.5_
  - _Contracts: DirectDataRoute API_

- [x] 2.2 (P) 解釈データ API のスキーマを定義する
  - リクエストスキーマ（sessionId 必須、content 必須、estimationTargets 任意、outputSchema 必須）を Zod で定義する
  - content の文字数制限（最大5000文字）バリデーションを追加する
  - outputSchema の JSON Schema 形式検証を実装する
  - レスポンススキーマ（structuredData、estimations、processedAt）を定義する
  - デフォルト推定対象項目（inflationRate, incomeGrowthRate, riskTolerance, planningHorizon）を定義する
  - _Requirements: 2.1, 2.9, 2.10, 6.1, 6.3, 6.5_
  - _Contracts: InterpretedDataRoute API_

- [x] 2.3 (P) 追加質問 API のスキーマを定義する
  - リクエストスキーマ（sessionId 必須）を Zod で定義する
  - Question 型（id、text、answerMethod）のスキーマを定義する
  - AnswerMethod 型（answerCount、answerFormat、requiresAiInterpretation、options）を定義する
  - 2種類のレスポンススキーマ（追加質問あり / ヒアリング完了）を定義する
  - questionCount の範囲検証（1-3）を追加する
  - _Requirements: 3.1, 3.8, 6.1, 6.3_
  - _Contracts: AdditionalQuestionsRoute API_

- [x] 3. Firebase 匿名認証ミドルウェアを実装する
  - Firebase Authentication の匿名認証トークンを検証するミドルウェアを作成する
  - トークンが無効または期限切れの場合に HTTP 401 エラーを返却する
  - CORS 設定で許可されたオリジンのみからのリクエストを受け付ける
  - 認証失敗時のログ記録を実装する
  - _Requirements: 8.1, 8.2, 8.4_
  - _Contracts: AuthMiddleware Service_

- [x] 4. Direct Data API の実装
- [x] 4.1 直接データ受信のビジネスロジックを実装する
  - リクエストボディの Zod バリデーションを実行する
  - セッション ID が未提供の場合は新規セッションを作成する
  - セッション ID が提供された場合は検証を行い、無効なら 400 エラーを返す
  - Agent Engine Sessions に直接データを保存する
  - 保存失敗時はリトライユーティリティで最大2回リトライする
  - 2回リトライ後も失敗した場合は 503 エラーを返却する
  - 成功時に sessionId と storedAt を含むレスポンスを返す
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_
  - _Contracts: DirectDataRoute API, SessionManager Service, RetryUtility Service_

- [x] 4.2 直接データ API エンドポイントを作成する
  - Next.js App Router の route.ts を作成し、POST ハンドラを定義する
  - 認証ミドルウェアを適用する
  - ビジネスロジックを呼び出し、レスポンスを返却する
  - タイムアウト30秒を設定する
  - レスポンスタイムを計測しログに記録する
  - _Requirements: 1.4, 7.1, 7.4, 5.5_

- [x] 5. Interpreted Data API の実装
- [x] 5.1 解釈データ受信のビジネスロジックを実装する
  - リクエストボディの Zod バリデーションを実行する（文字数制限含む）
  - セッション検証を行い、無効なら 400 エラーを返す
  - 推定対象項目が未指定の場合はデフォルト値を適用する
  - Agent Engine に解釈データ処理をリクエストし、推定値を算出させる
  - Gemini API に outputSchema を渡して構造化 JSON を生成する
  - 構造化出力失敗時はリトライユーティリティで最大2回リトライする
  - セッションに構造化データを保存する
  - 成功時に structuredData と estimations を含むレスポンスを返す
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_
  - _Contracts: InterpretedDataRoute API, SessionManager Service, GeminiClient Service, RetryUtility Service_

- [x] 5.2 解釈データ API エンドポイントを作成する
  - Next.js App Router の route.ts を作成し、POST ハンドラを定義する
  - 認証ミドルウェアを適用する
  - ビジネスロジックを呼び出し、レスポンスを返却する
  - タイムアウト30秒を設定する
  - レスポンスタイムを計測しログに記録する
  - _Requirements: 2.6, 7.2, 7.4, 5.5_

- [x] 6. Additional Questions API の実装
- [x] 6.1 追加質問判定のビジネスロジックを実装する
  - セッション検証を行い、無効なら 400 エラーを返す
  - Agent Engine にセッション内データの整合性・充足性チェックをリクエストする
  - 整合性エラーまたは不足情報が検出された場合、Gemini API で追加質問を生成する
  - 質問生成失敗時はリトライユーティリティで最大2回リトライする
  - 生成された質問に answerMethod（回答数、回答形式、AI解釈要否）を付与する
  - 質問回数が最大3回を超える場合は強制的にヒアリング完了とする
  - 追加質問がある場合は questions と questionCount を返却する
  - データが充足している場合は hearing_completed ステータスを返却する
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_
  - _Contracts: AdditionalQuestionsRoute API, SessionManager Service, AgentEngineClient Service, RetryUtility Service_

- [x] 6.2 追加質問 API エンドポイントを作成する
  - Next.js App Router の route.ts を作成し、POST ハンドラを定義する
  - 認証ミドルウェアを適用する
  - ビジネスロジックを呼び出し、レスポンスを返却する
  - タイムアウト30秒を設定する
  - レスポンスタイムを計測しログに記録する
  - _Requirements: 3.6, 3.7, 7.3, 7.4, 5.5_

- [ ] 7. テスト（保留：テストフレームワーク未設定）
- [ ] 7.1 (P) ユニットテストを作成する
  - Zod スキーマのバリデーションロジックをテストする（正常系・異常系）
  - リトライユーティリティの指数バックオフロジックをテストする
  - エラーレスポンス生成ロジックをテストする
  - デフォルト推定対象項目の適用ロジックをテストする
  - セッション検証ロジックをテストする
  - _Requirements: 6.1, 6.2, 1.5, 2.7, 3.9_

- [ ] 7.2 インテグレーションテストを作成する
  - Direct Data API の正常系フロー（新規セッション作成、データ保存）をテストする
  - Direct Data API の異常系フロー（バリデーションエラー、セッション無効）をテストする
  - Interpreted Data API の Gemini 連携フローをテストする（モック使用可）
  - Additional Questions API の質問生成フローをテストする（モック使用可）
  - セッション作成・検証・更新の連携動作をテストする
  - 認証ミドルウェアの動作をテストする
  - _Requirements: 1.1-1.7, 2.1-2.10, 3.1-3.10, 4.1-4.5, 8.1, 8.2_

---

## Requirements Coverage

| Requirement | Tasks |
|-------------|-------|
| 1.1-1.7 | 2.1, 4.1, 4.2, 7.1, 7.2 |
| 2.1-2.10 | 2.2, 5.1, 5.2, 7.2 |
| 3.1-3.10 | 2.3, 6.1, 6.2, 7.2 |
| 4.1-4.5 | 1.3, 7.2 |
| 5.1-5.5 | 1.1, 4.2, 5.2, 6.2 |
| 6.1-6.5 | 2.1, 2.2, 2.3, 7.1 |
| 7.1-7.4 | 4.2, 5.2, 6.2 |
| 8.1-8.4 | 3, 7.2 |

すべての要件がタスクにマッピングされています。
