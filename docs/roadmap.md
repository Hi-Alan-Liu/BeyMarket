# 開發路線圖與未來規劃

## 現況（已完成）

- ✅ 專案骨架：Next.js 16 + TypeScript + Tailwind 4
- ✅ 資料模型：Prisma schema 全數落地，已 migrate
- ✅ 分類種子：CX/UX/BX 系列、主分類、CX 子分類
- ✅ 帳號密碼註冊 / 登入（Auth.js + Credentials，端到端驗證通過）
- ✅ 本機開發環境：Docker Postgres + npm scripts
- ✅ 技術文件 docs/

---

## 里程碑

### M1 — 商品上架（下一步）
- [ ] 上架表單：系列 → 主分類 →（CX 顯示子分類）→ 品項、狀況、開價、數量
- [ ] 品項自動建議（連 `PartCatalog`，可新增字典項目）
- [ ] 圖片上傳（初期存 URL；之後接 Cloudflare R2）
- [ ] 賣家「我的商品」管理頁（編輯 / 下架）
- 依賴：`Listing`、`ListingImage`、`PartCatalog`（已備）

### M2 — 搜尋與列表
- [ ] 全站商品列表 + 分頁 / 無限捲動
- [ ] 篩選器：系列、主分類、子分類、狀況、價格區間、關鍵字
- [ ] 排序：最新 / 價格 / 熱門
- [ ] 商品詳情頁（多圖、賣家資訊、LINE 導流）
- 搜尋初期用 Postgres `ILIKE` / 全文檢索；量大再導入 Meilisearch

### M3 — 購買需求與成交
- [ ] 買家送出購買需求（留言、數量）
- [ ] 賣家後台：查看某商品的需求者清單
- [ ] 「標記已售出」→ 從需求者中指定買家（或手填站外買家）→ 填成交價
- [ ] 建立 `Transaction` 並寫入 `PriceHistory`
- 依賴：`PurchaseRequest`、`Transaction`、`PriceHistory`（已備）

### M4 — 市場行情
- [ ] Cron 每日彙整 `PriceHistory` → `PriceDailySummary` / `PriceWeeklySummary`（依 品項 × 狀況）
- [ ] 商品頁 / 行情頁：折線圖 + 區間（Recharts）
- [ ] 冷啟動呈現「近 N 筆成交」
- [ ] 全新 / 二手切換或並列

### M5 — 評價與信任分數
- [ ] 成交後買賣雙向評價（星等 + 短評，一交易一次）
- [ ] `SellerStats` 彙整：成交數、平均星等、`trustScore`
- [ ] 列表 / 賣家頁顯示星等徽章
- 依賴：`Review`、`SellerStats`（已備）

### M6 — 第三方登入（半實名）
- [ ] Discord OAuth
- [ ] LINE Login（channel 申請 + 網域驗證）
- [ ] 決定是否限制 / 移除純帳密註冊以維持實名強度
- 接法見 [authentication.md](./authentication.md#第三方登入discord--line)

### M7 — 上線
- [ ] 部署至 Zeabur + 雲端 Postgres（Neon / Supabase）
- [ ] 設定 Cron（行情彙整）
- [ ] 自訂網域 + `AUTH_TRUST_HOST`
- [ ] 基本監控 / 錯誤追蹤

---

## 通知機制（跨里程碑）
- 第一版：站內通知（購買需求、成交、收到評價）
- 之後：接 **LINE Notify / Messaging API** 主動推播（玩家主要用 LINE）

## 待決策
- **信任分數公式**：成交數 / 平均星等 / 帳齡的實際權重（M5 前定案）
- **通知推播**：站內 vs LINE 的優先順序
- **圖片儲存**：何時從 DB URL 切換到 Cloudflare R2
- **純帳密註冊去留**：接上 Discord/LINE 後是否關閉

## 技術債 / 待強化
- [ ] 商品圖片正式化（物件儲存 + 縮圖）
- [ ] 搜尋升級（Meilisearch，中文分詞）
- [ ] Rate limiting（註冊 / 需求送出防濫用）
- [ ] E2E 測試（Playwright）與 CI
- [ ] 站上明示「平台不介入交易糾紛」之免責與檢舉機制
