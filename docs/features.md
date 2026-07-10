# 功能與流程

BeyMarket MVP 已實作的功能、對應路由與資料流。對照企劃書 [`專案企劃書.md`](../專案企劃書.md) §4 功能規格。

## 路由總覽

| 路由 | 類型 | 登入 | 說明 |
|------|------|:----:|------|
| `/` | 頁面 | — | 首頁：Hero + 最新上架 8 件 |
| `/listings` | 頁面 | — | 商品列表：篩選 / 排序 / 分頁 |
| `/listings/[id]` | 頁面 | — | 商品詳情：圖片、賣家、行情、購買需求、賣家管理 |
| `/listings/new` | 頁面 | ✓ | 上架表單 |
| `/listings/[id]/edit` | 頁面 | ✓（賣家本人） | 編輯商品 |
| `/market` | 頁面 | — | 行情總覽：有成交紀錄的品項 |
| `/market/[catalogId]` | 頁面 | — | 品項行情：狀況區間 + 近期成交 |
| `/sellers/[id]` | 頁面 | — | 賣家公開頁：統計、在售商品、買家評價 |
| `/dashboard` | 頁面 | ✓ | 我的：統計、待評價、我的商品、我的需求 |
| `/account` | 頁面 | ✓ | 個人檔案（暱稱 / LINE / 頭像） |
| `/login`、`/register` | 頁面 | — | 帳密登入 / 註冊 |
| `/api/register` | Route Handler | — | 註冊 API |
| `/api/catalog/suggest` | Route Handler | — | 品項自動建議 |
| `/api/cron/aggregate` | Route Handler | Bearer | 行情彙整 Cron |
| `/api/auth/*` | Auth.js | — | 登入 / session |

## M1 — 商品上架

- **上架**（`/listings/new` → `createListing`）：系列 → 主分類 →（`allowSubType` 為真時顯示子分類）→ 品項、狀況、開價、數量、描述、LINE、圖片網址。
- **品項自動建議**：輸入品項名稱時打 `/api/catalog/suggest`，以 `datalist` 呈現既有 `PartCatalog`。填入的品項若不存在則於上架時 `findOrCreateCatalog` 建立 —— 成交價才能匯入該品項行情。
- **子分類越界防護**：`createListing` 驗證所選子分類確實綁定於該系列 + 主分類。
- **編輯 / 下架**：`/listings/[id]/edit`（`updateListing`）、詳情頁的下架 / 重新上架（`toggleDelist`）。皆限賣家本人、已售出者鎖定。
- 圖片初版以**網址**儲存（`ListingImage`），未來接 Cloudflare R2 直傳。

## M2 — 搜尋與列表

- **篩選**（`src/lib/listings.ts` `buildListingWhere`）：關鍵字（標題 / 描述 `ILIKE`）、系列、主分類、子分類、狀況、價格區間。子分類選單依所選系列 + 主分類連動。
- **排序**：最新 / 價格低→高 / 價格高→低。**分頁**：每頁 24 件。
- 列表只顯示可交易商品（`ACTIVE` / `NEGOTIATING`），排除已售出與下架。
- **詳情頁**：多圖、狀況 / 狀態徽章、賣家卡（星等 + 信任分數 + LINE，LINE 需登入才顯示）、行情摘要（若綁定品項）。

## M3 — 購買需求與成交

- **購買需求**（`sendPurchaseRequest`）：買家於詳情頁送出留言 + 數量。`@@unique([listingId, buyerId])` 確保一買家一商品一筆，重送為 upsert。可撤回（`withdrawRequest`）。
- **成交標記**（`markSold`，於 DB transaction 內）：
  1. 商品狀態改 `SOLD`；
  2. 建立 `Transaction`（可指定站內買家或手填站外買家名稱）；
  3. 被選中的需求標記 `ACCEPTED`，其餘 `PENDING` 標記 `REJECTED`；
  4. 若綁定品項，寫入 `PriceHistory`；
  5. 交易外呼叫 `recomputeSellerStats` 更新賣家統計。

## M4 — 市場行情

- 行情以「品項（`catalogId`）× 狀況（`condition`）」為維度分開統計（全新 / 二手價差大）。
- `getMarketStats()` 即時計算各狀況 min / max / avg / count 與近期成交點；`MarketWidget` 以極簡 SVG 走勢線呈現（零外部套件）。
- **冷啟動**：成交筆數 < `COLD_START_THRESHOLD`（8）時標示「近 N 筆成交」而非日線。
- **每日 / 每週彙整**：`aggregateMarketSummaries()` 全量重算並 upsert 進 `PriceDailySummary` / `PriceWeeklySummary`，由 `GET /api/cron/aggregate` 定時觸發。

## M5 — 評價與信任分數

- **雙向評價**（`submitReview`）：成交後買賣雙方互評（1–5 星 + 短評）。`@@unique([transactionId, authorId])` 防刷（一交易一撰寫者一次）；僅該交易當事人可評。
- **信任分數**（`src/lib/trust.ts`，定案 v1）：`0.55×評價 + 0.30×成交數 + 0.15×帳齡`，評價採 Bayesian 平滑（先驗 3 筆 × 3.5 星）避免單筆失真；成交數於 20 筆、帳齡於 180 天封頂。詳見 [data-model.md](./data-model.md#評價--信任分數)。
- **顯示**：賣家卡 / 賣家頁顯示星等徽章 + 信任分數；`SellerStats` 為彙整快取，成交 / 收到評價時重算。

## 尚未實作（見 [roadmap.md](./roadmap.md)）

- 第三方登入（Discord / LINE）— 結構已預留。
- 圖片直傳（Cloudflare R2）、搜尋升級（Meilisearch）。
- 通知（站內 → LINE）、Rate limiting、檢舉 / 免責機制、E2E 測試。
