# BeyMarket 技術文件

戰鬥陀螺零件交易賣場的工程技術文件。產品面的商業企劃請見根目錄 [`專案企劃書.md`](../專案企劃書.md)。

## 文件索引

| 文件 | 內容 |
|------|------|
| [architecture.md](./architecture.md) | 系統架構、技術選型與理由、部署拓撲 |
| [data-model.md](./data-model.md) | 資料模型、分類體系設計、行情彙整策略 |
| [authentication.md](./authentication.md) | Auth.js 設定、帳號密碼流程、第三方登入接法 |
| [development.md](./development.md) | 本機開發環境、常用指令、除錯 |
| [roadmap.md](./roadmap.md) | 開發里程碑與未來規劃 |

## 快速導覽

- **想跑起來** → [development.md](./development.md)
- **想改資料結構** → [data-model.md](./data-model.md)
- **想接 Discord / LINE 登入** → [authentication.md](./authentication.md#第三方登入discord--line)
- **想知道接下來做什麼** → [roadmap.md](./roadmap.md)

## 目前狀態

| 模組 | 狀態 |
|------|------|
| 資料模型（Prisma schema） | ✅ 完成並已 migrate |
| 分類種子資料（CX/UX/BX） | ✅ 完成 |
| 帳號密碼註冊 / 登入 | ✅ 完成並端到端驗證 |
| 第三方登入（Discord / LINE） | ⏳ 結構已預留，未串接 |
| 商品上架 | ⬜ 未開始 |
| 搜尋 / 列表 | ⬜ 未開始 |
| 購買需求 / 成交 | ⬜ 未開始 |
| 行情彙整 / 圖表 | ⬜ 未開始 |
| 評價 / 信任分數 | ⬜ 未開始（schema 已備） |
