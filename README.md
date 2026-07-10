# BeyMarket — 戰鬥陀螺零件交易賣場

玩家對玩家(C2C)的戰鬥陀螺零件交易與行情平台。不串接金流／發票,專注於**上架、搜尋、媒合、行情**。

- 📄 商業企劃:[`專案企劃書.md`](./專案企劃書.md)
- 🛠 技術文件:[`docs/`](./docs/README.md)(架構、資料模型、功能、認證、開發、路線圖)

## 功能現況

MVP 核心迴圈已可端到端運作（`npm run build` 通過）:

**上架 → 搜尋/篩選 → 送購買需求 → 賣家指定買家標記成交 → 成交價寫入行情 → 雙向評價/信任分數**

已完成 M1–M5；第三方登入（Discord / LINE）結構已預留待接。功能與路由詳見 [`docs/features.md`](./docs/features.md)。

## 技術棧

- **Next.js 16**(App Router,Server Actions)+ TypeScript
- **Tailwind CSS v4**
- **PostgreSQL** + **Prisma 7**(pg driver adapter)
- **Auth.js(NextAuth v5)** — 目前為帳號密碼(Credentials),已預留 Discord / LINE

## 本機開發

需求:Node 20+、Docker(用於本機 Postgres)。

```bash
# 1. 安裝相依套件
npm install

# 2. 啟動本機 Postgres(docker-compose)
npm run db:up

# 3. 建立資料表 + 匯入分類種子資料
npm run db:migrate      # 套用 migration
npm run db:seed         # 匯入 系列 / 主分類 / CX 子分類

# 4. 啟動開發伺服器
npm run dev             # http://localhost:3000
```

首次進站可用 `/register` 註冊帳號 → 自動登入。

首次進站可先 `/register` 註冊 → 上架幾件商品 → 逛 `/listings`、`/market`。

### 常用指令

| 指令 | 說明 |
|------|------|
| `npm run dev` | 開發伺服器 |
| `npm run build` | 正式建置(驗證整包可編譯) |
| `npm run typecheck` | TypeScript 型別檢查 |
| `npm run lint` | ESLint |
| `npm run db:up` / `db:down` | 啟動 / 停止本機 Postgres |
| `npm run db:migrate` | 建立並套用 migration |
| `npm run db:seed` | 匯入分類種子資料 |
| `npm run db:studio` | Prisma Studio(資料庫 GUI) |
| `npx tsx scripts/smoke-flow.ts` | 全鏈路業務流程冒煙測試 |

## 環境變數(`.env`)

| 變數 | 說明 |
|------|------|
| `DATABASE_URL` | PostgreSQL 連線字串。正式環境改為 Zeabur / Neon / Supabase |
| `AUTH_SECRET` | Auth.js 加密金鑰(勿外流)。產生:`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `AUTH_TRUST_HOST` | 部署時設 `true` |
| `CRON_SECRET` | 保護行情彙整端點 `/api/cron/aggregate`(留空則不設防) |

> `.env` 已被 gitignore,含機密不會進版控。

## 專案結構(重點)

```
prisma/
  schema.prisma        # 資料模型(分類/商品/成交/行情/評價)
  seed.ts              # 系列 CX/UX/BX、主分類、CX 子分類 種子
scripts/
  smoke-flow.ts        # 全鏈路業務流程驗證腳本
src/
  auth.ts              # NextAuth 完整設定(Credentials + Prisma adapter)
  auth.config.ts       # edge-safe 基礎設定(proxy 用,預留 OAuth)
  proxy.ts             # 路徑保護(Next 16 的 middleware 慣例)
  lib/                 # session / catalog / listings / market / trust / format / prisma / validations
  components/          # 共用 UI(nav、卡片、篩選、行情、各表單)
  app/
    page.tsx                     # 首頁
    listings/                    # 列表 / 詳情 / 上架 / 編輯 (+ actions)
    market/                      # 行情總覽 / 品項行情
    sellers/[id]/                # 賣家公開頁
    dashboard/、account/          # 我的 / 帳號設定 (+ actions)
    trade/actions.ts             # 購買需求 / 成交 / 評價
    api/register、api/catalog/suggest、api/cron/aggregate、api/auth/*
```

功能與路由詳見 [`docs/features.md`](./docs/features.md)。

## 接下來(第三方登入)

`.env` 填入 `AUTH_DISCORD_ID/SECRET`、`AUTH_LINE_ID/SECRET`,並在 `src/auth.config.ts` 的 `providers` 陣列加入 Discord / LINE provider 即可,Credentials 與資料庫 adapter 已就緒。
