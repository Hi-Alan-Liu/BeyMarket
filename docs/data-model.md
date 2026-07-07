# 資料模型

Schema 位置：[`prisma/schema.prisma`](../prisma/schema.prisma)。以下說明設計意圖與取捨。

## 實體關係總覽

```
User ──< Listing ──< ListingImage
 │         │   │
 │         │   └──< PurchaseRequest >── User(buyer)
 │         │
 │         └──1:1── Transaction ──< Review >── User
 │                      │
Series ─┐               └──► PartCatalog ──< PriceHistory
PartType┼─< SubType         PartCatalog ──< PriceDailySummary
        └─< PartCatalog     PartCatalog ──< PriceWeeklySummary
```

## 分類體系（核心設計）

戰鬥陀螺分類會不斷擴充，因此**不寫死 enum**，改用三張可設定的分類表：

| 表 | 角色 | 範例 |
|----|------|------|
| `Series` | 系列 | CX / UX / BX（未來可加 DX） |
| `PartType` | 主分類 | 上蓋 / 固鎖 / 軸心 / 發射器 / 拉條 / 握把 / 其他 |
| `SubType` | 子分類 | 紋章 / 戰刃 / 輔助戰刃 |

### 子分類的限定機制

`SubType` 帶 `seriesId` 與 `partTypeId`，用來限定它只在特定系列與主分類下出現。目前三種擴充子分類（紋章／戰刃／輔助戰刃）皆綁定 **CX 系列 + 上蓋（BLADE）**。`PartType.allowSubType` 旗標讓前端知道該主分類是否要顯示子分類選單。

> 未來若 UX 也出現子分類，只需新增 `SubType` 資料列，程式不需改動。

## 零件字典（PartCatalog）— 行情的基礎

`PartCatalog` 是**正規化的品項**（例：`DranBuster 3-60F`）。上架商品可選對應的字典項目（`Listing.catalogId`）。

**為什麼需要**：行情彙整必須把「同一零件」的成交價聚在一起。若直接用使用者自填的標題，拼寫差異會讓行情無法統計。字典項目提供穩定的聚合鍵。

## 交易流程相關表

| 表 | 說明 |
|----|------|
| `Listing` | 上架商品。含系列/主分類/子分類、狀況、開價、數量、狀態、LINE 聯絡 |
| `ListingImage` | 商品多圖 |
| `PurchaseRequest` | 買家送出的購買需求。`@@unique([listingId, buyerId])` 限一買家一商品一筆 |
| `Transaction` | 成交紀錄。`listingId @unique`（一商品一成交）。`buyerId` 可為 null（站外買家用 `buyerName`） |

### 成交流程

賣家手動「標記已售出」→ 從送過需求的買家中選成交對象（或手填站外買家）→ 填實際成交價 → 建立 `Transaction` → 寫入 `PriceHistory`。

## 行情（依 品項 × 狀況 分開統計）

| 表 | 說明 |
|----|------|
| `PriceHistory` | 每筆成交一列（`catalogId` + `condition` + `price` + `soldAt`） |
| `PriceDailySummary` | 每日彙整：min / max / avg / count |
| `PriceWeeklySummary` | 每週彙整：min / max / avg / count |

**狀況分開**：`Condition` enum（`NEW` / `USED` / `USED_WORN`）。全新與二手價差大，行情以 `catalogId × condition` 為維度分別統計，避免失真。

**彙整方式**：Cron 定時把 `PriceHistory` 依日 / ISO 週聚合。彙整表用 `@@unique` 保證同一（品項×狀況×時段）只有一列，可 upsert。

**冷啟動**：成交量少時前端顯示「近 N 筆成交」而非強行畫日線。

## 認證相關表（Auth.js 標準）

| 表 | 說明 |
|----|------|
| `User` | 使用者。`passwordHash`（Credentials 用，第三方登入者為 null）、`displayName`、`lineContact`、`role` |
| `Account` | OAuth 帳號綁定（Discord / LINE），預留 |
| `Session` | 資料庫 session（目前用 JWT，保留給未來） |
| `VerificationToken` | Email 驗證 token（保留） |

## 評價 / 信任分數

| 表 | 說明 |
|----|------|
| `Review` | 交易評價。`@@unique([transactionId, authorId])` 防刷（一交易一撰寫者一次） |
| `SellerStats` | 賣家統計快取：成交數、平均星等、`trustScore`（成交數 + 平均評價 + 帳齡加權） |

`SellerStats` 是彙整快取，方便列表直接顯示星等徽章而不需即時算。

## 索引策略

- `Listing`：`[seriesId, partTypeId, subTypeId]`（分類篩選）、`status`、`condition`、`sellerId`。
- `PriceHistory` / 彙整表：`[catalogId, condition, ...]`（行情查詢主路徑）。
- `Transaction`：`sellerId`、`buyerId`、`[catalogId, condition]`。

## 遷移與種子

- Migration：`npm run db:migrate`
- 種子（系列 / 主分類 / CX 子分類）：`npm run db:seed`（[`prisma/seed.ts`](../prisma/seed.ts)，採 upsert 可重複執行）
