# 開發路線圖與未來規劃

## 現況（已完成）

- ✅ 專案骨架：Next.js 16 + TypeScript + Tailwind 4
- ✅ 資料模型：Prisma schema 全數落地，已 migrate
- ✅ 分類種子：CX/UX/BX 系列、主分類、CX 子分類
- ✅ 帳號密碼註冊 / 登入（Auth.js + Credentials）
- ✅ **M1 商品上架**：上架 / 編輯 / 下架、品項自動建議、圖片網址、我的商品
- ✅ **M2 搜尋與列表**：篩選（系列 / 分類 / 狀況 / 價格 / 關鍵字）、排序、分頁、詳情頁
- ✅ **M3 購買需求與成交**：需求送出 / 撤回、指定買家標記已售出、寫入行情
- ✅ **M4 市場行情**：即時統計（品項 × 狀況）、走勢圖、冷啟動、每日 / 每週 Cron 彙整
- ✅ **M5 評價與信任分數**：雙向評價、信任分數 v1、賣家頁 / 徽章
- ✅ 本機開發環境：Docker Postgres + npm scripts
- ✅ 技術文件 docs/（含 [features.md](./features.md)）

> MVP 核心迴圈（上架 → 搜尋 → 需求 → 成交 → 行情 → 評價）已可端到端運作，`npm run build` 通過，`scripts/smoke-flow.ts` 全鏈路驗證通過。

---

## 里程碑（剩餘）

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
- ✅ **信任分數公式**：已定案 v1（`0.55×評價 + 0.30×成交 + 0.15×帳齡`，Bayesian 平滑）。見 [data-model.md](./data-model.md#信任分數公式v1-定案)。
- **通知推播**：站內 vs LINE 的優先順序（購買需求 / 成交 / 收到評價目前無主動通知）
- **圖片儲存**：何時從 DB URL 切換到 Cloudflare R2
- **純帳密註冊去留**：接上 Discord/LINE 後是否關閉

## 技術債 / 待強化
- [ ] 商品圖片正式化（目前為圖片網址 → 物件儲存 + 直傳 + 縮圖）
- [ ] 搜尋升級（目前 Postgres `ILIKE` → Meilisearch，中文分詞）
- [ ] 列表無限捲動（目前為分頁）
- [ ] 通知機制（購買需求 / 成交 / 收到評價）
- [ ] Rate limiting（註冊 / 需求送出防濫用）
- [ ] 商品圖片以 `next/image` 最佳化（目前用 `<img>` 以支援任意外部網址）
- [ ] E2E 測試（Playwright）與 CI
- [ ] 站上明示「平台不介入交易糾紛」之免責與檢舉機制
