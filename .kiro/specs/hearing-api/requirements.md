# Requirements Document

## Introduction

本ドキュメントは、Life Compass ヒアリングフェーズにおける3つのAPIエンドポイント（直接データ受信、解釈データ受信、追加質問判定）の要件を定義します。これらのAPIは、Next.js バックエンドと Vertex AI Agent Engine 間のインターフェースとして機能し、ユーザーのヒアリングデータを段階的に収集・構造化します。

**スコープ**: `docs/hearing-sequence.puml` で定義されている以下の3つのAPIケースに限定
1. 直接データ受信 API（Direct Data API）
2. 解釈データ受信 API（Interpreted Data API）
3. 追加質問判定 API（Additional Questions API）

**技術スタック**: Next.js 16.1.1 API Routes、Vertex AI Agent Engine、Agent Sessions、Gemini API

**認証方式**: Firebase Authentication 匿名認証（Anonymous Auth）
- ログインしていないユーザーも利用可能
- DB アクセスは不要（セッションデータは Agent Engine Sessions に保存）
- ユーザー ID とセッション ID は紐付けない

**命名規則**:
| 日本語 | 英語（API名） | 説明 |
|--------|---------------|------|
| 直接データ（旧: 定量データ） | direct-data | AI解釈不要。年収、貯蓄額、年齢など、そのまま保存するデータ |
| 解釈データ（旧: 定性データ） | interpreted-data | AI解釈必要。自由記述、価値観、感情など、AIが構造化して返すデータ |

## Requirements

### Requirement 1: 直接データ受信 API（Direct Data API）

**Objective**: システム利用者として、ユーザーが入力した直接データ（年収、貯蓄額、家族構成など）をセッションにそのまま保存できるようにすることで、後続の処理で活用可能な状態にしたい。

#### Acceptance Criteria

1. When バックエンドが直接データを含むリクエストを受信した場合、the Hearing API shall セッション ID とデータペイロードを検証する
2. When セッション ID が有効である場合、the Hearing API shall Agent Engine の Sessions に直接データを保存する
3. If セッション ID が無効または期限切れの場合、then the Hearing API shall HTTP 400 エラーを返却する
4. When データ保存が成功した場合、the Hearing API shall 受信確認レスポンス（HTTP 200）を返却する
5. If Agent Engine との通信が失敗した場合、then the Hearing API shall 最大2回まで自動リトライを実行する
6. If 2回のリトライ後も失敗する場合、then the Hearing API shall HTTP 503 エラーを返却する
7. The Hearing API shall 直接データのスキーマバリデーションを実行し、不正な形式の場合は HTTP 400 エラーを返却する

#### Technical Notes
- セッション TTL: 10日間（シーケンス図仕様）
- データ形式: JSON（Zodスキーマによる検証）
- エンドポイント: `POST /api/hearing/direct-data`
- **AI処理なし**: データはそのままセッションに保存される

---

### Requirement 2: 解釈データ受信 API（Interpreted Data API）

**Objective**: システム利用者として、ユーザーが入力した自由記述データ（価値観、感情、将来の希望など）を AI エージェントで解釈・構造化し、指定した項目の推定値を取得できるようにすることで、ヒアリング JSON に反映したい。

#### Acceptance Criteria

1. When バックエンドが解釈データを含むリクエストを受信した場合、the Hearing API shall セッション ID、コンテンツ、推定対象項目、アウトプットスキーマを検証する
2. When セッション ID が有効である場合、the Hearing API shall Agent Engine に解釈データ処理をリクエストする
3. When Agent Engine が解釈データを受信した場合、the Agent shall リクエストで指定された推定対象項目（物価上昇率、収入成長率など）の推定値を算出する
4. When 推定値の算出が完了した場合、the Agent shall Gemini API に構造化出力生成をリクエストする（アウトプットスキーマに準拠）
5. When Gemini API が構造化 JSON を返却した場合、the Agent shall セッションに構造化データを保存する
6. When 構造化処理が成功した場合、the Hearing API shall 構造化された推定結果を含む JSON レスポンス（HTTP 200）を返却する
7. If Gemini API の構造化出力が失敗した場合、then the Agent shall 最大2回まで自動リトライを実行する
8. If 2回のリトライ後も失敗する場合、then the Hearing API shall HTTP 503 エラーとエラー詳細を返却する
9. The Hearing API shall 解釈データの文字数制限（例: 最大5000文字）を検証し、超過する場合は HTTP 400 エラーを返却する
10. The Hearing API shall 推定対象項目が未指定の場合、デフォルトの推定項目セットを使用する

#### Request Schema
```typescript
{
  sessionId: string,              // UUID v4（必須）
  content: string,                // 自由記述テキスト（最大5000文字）
  estimationTargets?: string[],   // 推定対象項目（省略時はデフォルト）
  outputSchema: {                 // アウトプットスキーマ（必須、JSON Schema形式）
    type: "object",
    properties: {
      [key: string]: {
        type: string,
        description?: string
      }
    },
    required?: string[]
  }
}
```

#### Response Schema
```typescript
{
  success: true,
  sessionId: string,
  structuredData: {
    // アウトプットスキーマに準拠した構造化データ
    [key: string]: any
  },
  estimations: {
    // 推定対象項目ごとの推定結果
    [target: string]: {
      value: number | string,
      reasoning?: string         // 推定根拠（オプション）
    }
  },
  processedAt: string            // ISO 8601 タイムスタンプ
}
```

#### Default Estimation Targets
推定対象項目が未指定の場合、以下をデフォルトとして使用：
- `inflationRate` - 想定物価上昇率
- `incomeGrowthRate` - 想定収入成長率
- `riskTolerance` - リスク許容度
- `planningHorizon` - 計画期間志向

#### Technical Notes
- Agent Engine の解釈ロジック: 自由記述データから数値的な特性を抽出
- Gemini API モデル: Gemini 2.5 Flash（シーケンス図仕様）
- エンドポイント: `POST /api/hearing/interpreted-data`
- **AI処理あり**: AIが解釈・構造化した結果をレスポンスとして返却

---

### Requirement 3: 追加質問判定 API（Additional Questions API）

**Objective**: システム利用者として、収集済みデータの整合性と充足性をチェックし、必要に応じて追加質問を生成できるようにすることで、高品質なヒアリングデータを確保したい。

#### Acceptance Criteria

1. When バックエンドが追加質問要求を受信した場合、the Hearing API shall セッション ID を検証する
2. When セッション ID が有効である場合、the Hearing API shall Agent Engine に整合性・不足情報チェックをリクエストする
3. When Agent が整合性・不足情報チェックを実行した場合、the Agent shall セッション内の直接データ・解釈データを分析する
4. If 整合性エラーまたは不足情報が検出された場合、then the Agent shall Gemini API に追加質問生成を指示する
5. When Gemini API が追加質問リストを返却した場合、the Agent shall セッション状態を更新し質問回数をインクリメントする
6. When 追加質問が生成された場合、the Hearing API shall 追加質問リストを含む JSON レスポンス（HTTP 200）を返却する
7. If 整合性チェックが OK で不足情報がない場合、then the Hearing API shall ヒアリング完了通知を含む JSON レスポンス（HTTP 200）を返却する
8. The Hearing API shall 追加質問の実行回数を検証し、最大3回を超える場合は強制的にヒアリング完了とする
9. If Gemini API の追加質問生成が失敗した場合、then the Agent shall 最大2回まで自動リトライを実行する
10. If 2回のリトライ後も失敗する場合、then the Hearing API shall HTTP 503 エラーを返却する

#### Response Schema
```typescript
// 回答数
type AnswerCount = "single" | "multiple";

// 回答形式
type AnswerFormat = "radio" | "pulldown" | "numeric" | "short_text" | "long_text";

// 回答方法
interface AnswerMethod {
  answerCount: AnswerCount;           // 単一 or 複数
  answerFormat: AnswerFormat;         // 回答形式
  requiresAiInterpretation: boolean;  // AI解釈要否（true: interpreted-data API、false: direct-data API）
  options?: string[];                 // 選択肢（radio/pulldown の場合）
}

// 質問
interface Question {
  id: string;                         // 質問ID（UUID v4）
  text: string;                       // 質問文
  answerMethod: AnswerMethod;         // 回答方法
}

// 追加質問あり
{
  status: "additional_questions_required",
  questions: Question[],
  questionCount: number  // 現在の質問ラウンド（1-3）
}

// ヒアリング完了
{
  status: "hearing_completed",
  questionCount: number
}
```

#### 回答形式と回答先APIの対応
| 回答数 | 回答形式 | AI解釈 | 回答先API |
|--------|----------|--------|-----------|
| single | radio | false | direct-data |
| multiple | pulldown | false | direct-data |
| single | numeric | false | direct-data |
| single | short_text | true | interpreted-data |
| single | long_text | true | interpreted-data |

#### Technical Notes
- 最大追加質問回数: 3回（シーケンス図仕様）
- チェック対象: データの整合性（矛盾）、必須情報の欠落
- エンドポイント: `POST /api/hearing/additional-questions`

---

## Cross-Cutting Requirements

### Requirement 4: セッション管理

**Objective**: システム利用者として、ユーザーごとの会話コンテキストを維持することで、連続したヒアリング体験を提供したい。

#### Acceptance Criteria

1. The Hearing API shall 全エンドポイントで Agent Engine Sessions を利用してセッション管理を行う
2. The Hearing API shall セッション有効期限を10日間に設定する
3. When セッション ID が未提供の場合、the Hearing API shall 新規セッション作成を Agent Engine に要求する
4. When 新規セッションが作成された場合、the Hearing API shall セッション ID をレスポンスに含めて返却する
5. The Hearing API shall セッション ID を UUID v4 形式で生成する

---

### Requirement 5: エラーハンドリングと可観測性

**Objective**: 運用担当者として、API のエラーを適切にハンドリングし、トラブルシューティングを容易にすることで、システムの信頼性を向上させたい。

#### Acceptance Criteria

1. The Hearing API shall 全エラーレスポンスに一意なエラー ID（UUID）を含める
2. When API エラーが発生した場合、the Hearing API shall エラー詳細をサーバーログに記録する
3. The Hearing API shall 4xx エラー（クライアントエラー）と 5xx エラー（サーバーエラー）を明確に区別する
4. When リトライ可能なエラーが発生した場合、the Hearing API shall リトライ回数と待機時間をログに記録する
5. The Hearing API shall レスポンスタイムを計測し、パフォーマンスメトリクスとして記録する

#### Error Response Schema
```typescript
{
  error: {
    id: string,           // UUID
    code: string,         // ERROR_CODE (例: INVALID_SESSION, AGENT_TIMEOUT)
    message: string,      // ユーザー向けエラーメッセージ
    details?: object      // 詳細情報（開発用、本番では省略可）
  }
}
```

---

### Requirement 6: データバリデーション

**Objective**: 開発者として、不正なデータがシステムに流入することを防ぐことで、データ整合性とセキュリティを確保したい。

#### Acceptance Criteria

1. The Hearing API shall 全エンドポイントで Zod スキーマを使用してリクエストボディを検証する
2. If バリデーションエラーが発生した場合、then the Hearing API shall HTTP 400 エラーとバリデーション詳細を返却する
3. The Hearing API shall セッション ID の形式（UUID v4）を検証する
4. The Hearing API shall 直接データの数値範囲（例: 年収は0以上）を検証する
5. The Hearing API shall SQL インジェクションや XSS 攻撃を防ぐため、入力データをサニタイズする

---

## Non-Functional Requirements

### Requirement 7: パフォーマンス

**Objective**: システム利用者として、API レスポンスが迅速であることで、スムーズなヒアリング体験を得たい。

#### Acceptance Criteria

1. The Hearing API shall 直接データ受信 API のレスポンスタイムを 95%ile で 500ms 以内にする
2. The Hearing API shall 解釈データ受信 API のレスポンスタイムを 95%ile で 3秒以内にする（LLM 処理を含む）
3. The Hearing API shall 追加質問判定 API のレスポンスタイムを 95%ile で 5秒以内にする（LLM 処理を含む）
4. The Hearing API shall タイムアウト設定（30秒）を全エンドポイントに適用する

---

### Requirement 8: セキュリティ

**Objective**: セキュリティ担当者として、API が適切に保護されることで、不正アクセスやデータ漏洩を防ぎたい。

#### Acceptance Criteria

1. The Hearing API shall Firebase Authentication 匿名認証（Anonymous Auth）トークンによる認証を必須とする
2. When 認証トークンが無効または期限切れの場合、the Hearing API shall HTTP 401 エラーを返却する
3. The Hearing API shall HTTPS 通信のみを許可し、HTTP リクエストは拒否する
4. The Hearing API shall CORS 設定で許可されたオリジンのみからのリクエストを受け付ける

**Note**: ユーザー ID とセッション ID の紐付け検証は行わない（匿名認証のため）

---

## API Endpoint Summary

| API名 | エンドポイント | メソッド | AI処理 | 説明 |
|-------|---------------|----------|--------|------|
| 直接データ受信 | `/api/hearing/direct-data` | POST | なし | 年収、貯蓄額などをそのまま保存 |
| 解釈データ受信 | `/api/hearing/interpreted-data` | POST | あり | 自由記述をAIで解釈し、構造化JSONを返却 |
| 追加質問判定 | `/api/hearing/additional-questions` | POST | あり | データ整合性チェックと追加質問生成 |

---

## Dependencies and Constraints

### Technical Dependencies
- Next.js 16.1.1 API Routes
- Vertex AI Agent Engine (Agent Sessions, ADK Agent)
- Gemini API 2.5 Flash
- Firebase Authentication
- Zod 4.x (スキーマバリデーション)

### Constraints
- セッション有効期限: 10日間（固定）
- 追加質問最大回数: 3回（固定）
- LLM 自動リトライ: 最大2回（固定）
- リージョン: asia-northeast1（東京）

### External References
- シーケンス図: `docs/hearing-sequence.puml`
- 既存実装: `app/src/app/api/agent/query/route.ts`
- エージェントロジック: `app/src/agents/fpInstructor.ts`, `app/src/agents/jsonEditor.ts`
