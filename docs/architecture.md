# 系統架構

## 技術選型

| 層 | 技術 | 版本 | 選用理由 |
|----|------|------|----------|
| 前端 / 後端 | Next.js（App Router） | 16 | 前後端一體，Server Actions / Route Handlers 直接處理後端，SEO 佳 |
| 語言 | TypeScript | 5 | 全端型別安全，單人／小團隊易維護 |
| 樣式 | Tailwind CSS | 4 | 快速刻列表、篩選、表單 |
| 資料庫 | PostgreSQL | 16 | 關聯式完美吻合「分類階層 + 行情聚合」 |
| ORM | Prisma | 7 | 型別安全、Migration 完善 |
| 資料庫驅動 | `@prisma/adapter-pg` | 7 | Prisma 7 新架構需 driver adapter |
| 認證 | Auth.js（NextAuth v5） | beta | 內建 Discord，LINE 可透過 OIDC；支援 Credentials |
| 密碼雜湊 | bcryptjs | 3 | 純 JS，跨平台無編譯問題 |
| 驗證 | zod | 4 | 前後端共用 schema |

> 為什麼不串金流：平台定位為「媒合 + 資訊透明」，交易與付款由玩家私下（LINE）完成。省去金流／發票／PCI 合規，大幅降低系統複雜度，把力氣集中在**分類設計**與**行情彙整**。

## 請求流程

```
瀏覽器
  │
  ├─ 頁面（React Server Components）──► Next.js（Node runtime）──► Prisma ──► PostgreSQL
  │
  ├─ 表單 / 操作（Server Actions "use server"）──► requireUser 驗證 ──► Prisma ──► revalidatePath
  │
  ├─ /api/register（Route Handler）──► bcrypt 雜湊 ──► Prisma ──► PostgreSQL
  │
  ├─ /api/catalog/suggest（品項自動建議）、/api/cron/aggregate（行情彙整）
  │
  └─ /api/auth/*（Auth.js）──► Credentials authorize ──► bcrypt.compare ──► JWT session
                              └─ proxy（edge）以 authConfig 保護受限路徑
```

## 應用結構

寫入與變更以 **Server Actions** 為主（非 REST API），就近綁定在對應功能資料夾：

| 目錄 / 檔案 | 職責 |
|------------|------|
| `src/lib/` | 純邏輯與資料存取：`session`（登入守衛）、`catalog`（分類 / 字典）、`listings`（列表查詢 / 篩選）、`market`（行情統計 + 彙整）、`trust`（信任分數）、`format`（顯示格式） |
| `src/components/` | 共用 UI：`nav`、`ui`（徽章 / 星等 / 空狀態）、`listing-card`、`listing-filters`、`market-widget`、各互動表單 |
| `src/app/listings/actions.ts` | 上架 / 編輯 / 下架 |
| `src/app/trade/actions.ts` | 購買需求 / 成交標記 / 評價（成交於 DB transaction 內同時寫入 `Transaction` + `PriceHistory` 並重算 `SellerStats`） |
| `src/app/account/actions.ts` | 個人檔案更新 |

功能路由與流程詳見 [features.md](./features.md)。

## 行情彙整

- 每筆成交（`markSold`）即時寫入 `PriceHistory`（若商品綁定 `PartCatalog`）。
- `src/lib/market.ts` 的 `getMarketStats()` 即時計算「品項 × 狀況」的 min/max/avg 與近期成交點，供商品頁與行情頁顯示（資料量小時即時算足夠，並以冷啟動門檻改顯示「近 N 筆」）。
- `aggregateMarketSummaries()` 由 Cron（`GET /api/cron/aggregate`）定時全量重算 `PriceDailySummary` / `PriceWeeklySummary`（冪等 upsert），供未來大量資料時的日／週線查詢。

## 認證架構（雙設定切分）

Auth.js 拆成兩份設定，以相容 edge middleware：

- **`src/auth.config.ts`** — edge-safe 基礎設定（pages、callbacks、OAuth providers）。middleware 使用，**不含** bcrypt / Prisma。
- **`src/auth.ts`** — 完整設定，`...authConfig` 之上再加 Credentials provider 與 Prisma adapter（跑在 Node runtime）。

Session 策略採 **JWT**（Credentials provider 的必要條件）。`user.id` 透過 `jwt` / `session` callback 帶入。

詳見 [authentication.md](./authentication.md)。

## 部署拓撲（規劃）

```
        使用者
          │
     ┌────▼─────┐
     │  Zeabur  │  Next.js（Node runtime）
     └────┬─────┘
          │
   ┌──────┴───────┐
   │  PostgreSQL  │  Zeabur / Neon / Supabase
   └──────────────┘
          │
   ┌──────┴───────┐
   │  物件儲存     │  Cloudflare R2（商品圖片，之後導入）
   └──────────────┘
```

- **部署平台**：Zeabur（台灣在地、對 LINE 生態友善、支援自訂網域與 Cron）。
- **圖片**：初期可存 DB URL；量大後改上 Cloudflare R2（幾乎無流量費）。
- **行情彙整**：以 Cron（Zeabur Cron / pg_cron）每日將 `PriceHistory` 聚合進 `PriceDailySummary` / `PriceWeeklySummary`。

## 為什麼是這套

1. 不需金流 → 選最省事的全端方案。
2. TypeScript 一條龍，維護成本低。
3. PostgreSQL 關聯式吻合分類階層與行情聚合。
4. Auth.js 直接支援 Discord，LINE 走 OIDC，符合半實名。
5. 託管服務（Zeabur + 雲端 Postgres）幾乎零維運，起步成本近乎為零。
