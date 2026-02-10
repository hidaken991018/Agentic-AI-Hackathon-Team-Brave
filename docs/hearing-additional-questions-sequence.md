# hearing/additional-questions AI Agent Interaction Sequence Diagram

`hearing/additional-questions/page.tsx` におけるフロントエンド・バックエンド・AIエージェント間のインタラクションを示すシーケンス図。

## シーケンス図

```mermaid
sequenceDiagram
    actor User
    participant Front as フロントエンド<br/>(additional-questions/page.tsx)
    participant Back as バックエンド<br/>(API Routes)
    participant Agent as AIエージェント<br/>(Vertex AI Agent Engine + Gemini)

    Note over Front: ページ読み込み時
    Front->>Front: useSessionIdGuard()<br/>sessionId検証

    rect rgb(230, 240, 255)
        Note over Front,Agent: 初回質問取得フロー
        Front->>Back: POST /api/hearing/additional-questions<br/>{sessionId, questionCount: 0}
        Back->>Back: Bearer Token認証<br/>userId抽出
        Back->>Agent: queryAIAgent() [Vertex AI Agent Engine]<br/>データ整合性チェック・不足情報分析<br/>(SSE Stream)
        Agent-->>Back: 整合性分析結果テキスト
        Back->>Agent: queryGemini() [Gemini API]<br/>分析結果をもとに追加質問を生成<br/>(JSON Schema付き構造化出力)
        Agent-->>Back: {questions: [{text, answerMethod, ...}]}
        Back-->>Front: {status: "additional_questions_required",<br/>questions: Question[], questionCount: 1}
    end

    Front->>User: 質問フォーム表示
    User->>Front: 回答入力・送信

    rect rgb(255, 240, 230)
        Note over Front,Agent: 回答送信フロー (useAnswerSubmission)

        Note over Front,Agent: Step 1: AI解釈 (並列実行)
        par requiresAiInterpretation=true の質問ごと
            Front->>Back: POST /api/hearing/interpreted-data<br/>{sessionId, content: "質問: 回答",<br/>estimationTargets, outputSchema}
            Back->>Back: Bearer Token認証
            Back->>Agent: queryAIAgent() [Vertex AI Agent Engine]<br/>回答の推論・解釈<br/>(SSE Stream)
            Agent-->>Back: 解釈・推論テキスト
            Back->>Agent: queryGemini() [Gemini API]<br/>推論結果をJSON構造化<br/>(outputSchemaに従う)
            Agent-->>Back: {structuredData, estimations}
            Back->>Back: appendSessionData()<br/>セッションにデータ保存
            Back-->>Front: {success, structuredData,<br/>estimations, processedAt}
        end

        Note over Front,Back: Step 2: ヒアリングJSON保存
        Front->>Front: 解釈結果からhearingJsonUpdate構築
        Front->>Back: POST /api/hearing/direct-data<br/>{sessionId, data: {hearingJsonUpdate,<br/>estimations, updatedAt}}
        Back->>Back: Bearer Token認証<br/>データサニタイズ
        Back->>Back: appendSessionData()<br/>セッションにデータ保存
        Back-->>Front: {success, sessionId, storedAt}

        Note over Front,Agent: Step 3: 次の質問取得
        Front->>Back: POST /api/hearing/additional-questions<br/>{sessionId, questionCount: N}
        Back->>Agent: queryAIAgent() [Vertex AI Agent Engine]<br/>更新データの整合性チェック
        Agent-->>Back: 分析結果
        Back->>Agent: queryGemini() [Gemini API]<br/>追加質問生成
        Agent-->>Back: {questions: [...]} or 空配列
    end

    alt 追加質問あり (questionCount < 3)
        Back-->>Front: {status: "additional_questions_required",<br/>questions, questionCount: N+1}
        Front->>User: 新しい質問フォーム表示
        Note over Front: 回答送信フローを繰り返し
    else ヒアリング完了 (質問なし or questionCount >= 3)
        Back-->>Front: {status: "hearing_completed",<br/>questionCount: N}
        Front->>Front: /life-compass?sessionId=xxx へ遷移
    end
```

## フロー概要

| ステップ | フロント | バックエンド | エージェント |
|---|---|---|---|
| **初回質問取得** | `useAdditionalQuestions()` で POST | 認証後ハンドラ呼び出し | Agent Engine: 整合性チェック → Gemini: 質問生成 |
| **AI解釈** (並列) | `processAiInterpretations()` で質問ごとにPOST | 認証後ハンドラ呼び出し | Agent Engine: 推論・解釈 → Gemini: JSON構造化 |
| **データ保存** | `processAndSaveAnswers()` でPOST | サニタイズ後セッション保存 | (なし) |
| **次の質問取得** | `fetchAdditionalQuestions()` で再POST | 同上 | Agent Engine + Gemini (同上) |
| **ループ終了** | `/life-compass` へ遷移 | `hearing_completed` 返却 | - |

## 主要ポイント

- **2段階エージェントパイプライン**: すべてのAI処理で Vertex AI Agent Engine（推論・文脈理解）→ Gemini API（JSON構造化）の順に呼び出し
- **Agent EngineはSSEストリーム**でレスポンスを返す
- **Gemini APIはJSON Schema付き構造化出力**で型安全なレスポンスを生成
- **最大3ラウンド**で追加質問ループが終了

## 関連ファイル

| ファイル | 役割 |
|---|---|
| `app/src/app/hearing/additional-questions/page.tsx` | ページコンポーネント |
| `app/src/app/hearing/additional-questions/hooks/useAdditionalQuestions.ts` | 追加質問取得フック |
| `app/src/app/hearing/additional-questions/hooks/useAnswerSubmission.ts` | 回答送信フック |
| `app/src/app/api/hearing/additional-questions/route.ts` | 追加質問APIルート |
| `app/src/app/api/hearing/interpreted-data/route.ts` | AI解釈APIルート |
| `app/src/app/api/hearing/direct-data/route.ts` | 直接データ保存APIルート |
| `app/src/libs/google/queryAIAgent.ts` | Vertex AI Agent Engine呼び出し |
| `app/src/libs/google/queryGemini.ts` | Gemini API呼び出し |
| `app/src/libs/google/sessionManager.ts` | セッション管理 |
