# 1. 依存関係のインストール
FROM node:24-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# 2. ビルドの実行
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Next.js のビルドを実行
RUN npm run build

# 3. 実行用イメージの作成
FROM base AS runner
WORKDIR /app

# 警告対応: = を使った形式に変更
ENV NODE_ENV=production

# セキュリティのため専用ユーザーを作成
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 必要なファイルだけをコピー
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
# 警告対応: = を使った形式に変更
ENV PORT=3000
# サーバーの起動
CMD ["node", "server.js"]