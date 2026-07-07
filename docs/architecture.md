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
  ├─ /api/register（Route Handler）──► bcrypt 雜湊 ──► Prisma ──► PostgreSQL
  │
  └─ /api/auth/*（Auth.js）──► Credentials authorize ──► bcrypt.compare ──► JWT session
                              └─ middleware（edge）以 authConfig 保護受限路徑
```

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
