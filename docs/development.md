# 本機開發

## 需求

- **Node.js** 20+
- **Docker**（本機 Postgres 用；或自備 PostgreSQL 連線字串）

> 註：Prisma 內建的 `prisma dev` 本機資料庫需要 Node 22+（依賴 `node:sqlite`）。本專案改用 Docker Postgres 以相容 Node 20。

## 首次啟動

```bash
# 1. 安裝相依套件（postinstall 會自動 prisma generate）
npm install

# 2. 建立 .env
cp .env.example .env
# 編輯 .env，填入 AUTH_SECRET（見下方指令產生）

# 3. 啟動本機 Postgres
npm run db:up

# 4. 建表 + 種子
npm run db:migrate
npm run db:seed

# 5. 啟動
npm run dev            # http://localhost:3000
```

產生 `AUTH_SECRET`：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 指令一覽

| 指令 | 說明 |
|------|------|
| `npm run dev` | 開發伺服器（Turbopack） |
| `npm run build` / `start` | 正式建置 / 啟動 |
| `npm run typecheck` | `tsc --noEmit` 型別檢查 |
| `npm run lint` | ESLint |
| `npm run db:up` / `db:down` | 啟動 / 停止本機 Postgres 容器 |
| `npm run db:migrate` | 建立並套用 migration（開發用） |
| `npm run db:seed` | 匯入分類種子（可重複執行，upsert） |
| `npm run db:studio` | Prisma Studio（資料庫 GUI） |
| `npm run db:generate` | 重新產生 Prisma Client |

## 資料庫

`docker-compose.yml` 定義一個 `postgres:16-alpine`，帳密 / DB 皆為 `beymarket`，對外埠 `5432`，資料存於具名 volume `beymarket-pgdata`（`db:down` 不會刪資料；要清空加 `docker compose down -v`）。

改資料結構後：

```bash
npm run db:migrate     # 產生新 migration 並套用
```

## 驗證認證流程（curl）

```bash
# 註冊
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"a@b.tw","displayName":"玩家","password":"secret123","confirmPassword":"secret123"}'

# 登入（需先取 CSRF token）
CSRF=$(curl -s -c jar http://localhost:3000/api/auth/csrf | node -pe "JSON.parse(require('fs').readFileSync(0)).csrfToken")
curl -b jar -c jar -X POST http://localhost:3000/api/auth/callback/credentials \
  --data-urlencode "csrfToken=$CSRF" \
  --data-urlencode "email=a@b.tw" --data-urlencode "password=secret123"

# 查 session
curl -b jar http://localhost:3000/api/auth/session
```

## 驗證業務流程

- **行情彙整 Cron**（手動觸發）：

  ```bash
  # 未設 CRON_SECRET 時可直接呼叫
  curl http://localhost:3000/api/cron/aggregate
  # 有設時
  curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/aggregate
  ```

- **全鏈路冒煙測試**：`scripts/smoke-flow.ts` 直接對資料庫模擬「上架 → 需求 → 成交 → 寫入行情 → 重算信任分數 → 每日/每週彙整」，並印出結果對照：

  ```bash
  npx tsx scripts/smoke-flow.ts
  ```

## 功能與路由

已實作的功能、路由與資料流見 [features.md](./features.md)。寫入操作以 Server Actions 為主（`src/app/**/actions.ts`），純邏輯集中在 `src/lib/`。

## 常見問題

- **`prisma generate` 找不到 client**：`src/generated/prisma` 已 gitignore，clone 後 `npm install`（postinstall）或 `npm run db:generate` 會產生。
- **連不上資料庫**：確認 `npm run db:up` 的容器 healthy（`docker ps`），且 `.env` 的 `DATABASE_URL` 埠為 `5432`。
- **Prisma 7 client 需 driver adapter**：本專案已用 `@prisma/adapter-pg`（見 `src/lib/prisma.ts`），不可用無參數的 `new PrismaClient()`。
- **Next 16 路由攔截是 `src/proxy.ts` 不是 `middleware.ts`**：Next 16 已將 `middleware` 慣例更名為 `proxy`，且要求匯出單一函式。詳見 [authentication.md](./authentication.md)。
- **公開資料頁需 `force-dynamic`**：讀取 DB 的公開頁（首頁 / 列表 / 詳情 / 行情 / 賣家）標了 `export const dynamic = "force-dynamic"`，避免 build 時嘗試靜態預渲染而連線資料庫。
