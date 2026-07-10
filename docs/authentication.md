# 認證（Auth.js / NextAuth v5）

目前提供**帳號密碼登入**，結構已預留 Discord / LINE 第三方登入。

## 檔案分工

| 檔案 | 角色 |
|------|------|
| `src/auth.config.ts` | edge-safe 基礎設定：`pages`、`callbacks`、OAuth providers。proxy 使用，**不含** bcrypt / Prisma |
| `src/auth.ts` | 完整設定：`...authConfig` + Credentials provider + Prisma adapter（Node runtime） |
| `src/proxy.ts` | 用 `authConfig` 保護受限路徑（Next 16 的 `middleware` 慣例，見下方說明） |
| `src/app/api/auth/[...nextauth]/route.ts` | Auth.js 的 GET / POST handler |
| `src/app/api/register/route.ts` | 註冊 API（bcrypt 雜湊 + 建立 User） |
| `src/lib/validations/auth.ts` | zod：`loginSchema` / `registerSchema` |
| `src/types/next-auth.d.ts` | 型別擴充：`session.user.id` |

## 為什麼切成兩份設定

proxy（路由攔截層）跑在 **edge runtime**，不能用 bcrypt 與 Prisma。因此把「edge 安全」的部分（callbacks、pages、OAuth）放 `auth.config.ts`，proxy 直接用；需要 Node 的 Credentials + Prisma adapter 只放在 `auth.ts`。這是 Auth.js 官方建議的 split pattern。

> **Next 16：`middleware` → `proxy`**
> Next 16 將根層的 `middleware.ts` 慣例更名為 `proxy.ts`，且要求匯出**單一函式**（named `proxy` 或 default export），不再支援 `export const { auth: middleware }` 的解構寫法。本專案 `src/proxy.ts` 以 `const { auth } = NextAuth(authConfig); export default auth;` 承接，功能與舊 middleware 完全相同。

## Session 策略

採 **JWT**（`session.strategy = "jwt"`）—— Credentials provider 的必要條件。流程：

1. `authorize()` 驗證帳密 → 回傳 user。
2. `jwt` callback 把 `user.id` 寫進 token。
3. `session` callback 把 `token.id` 帶進 `session.user.id`。

## 註冊流程

```
POST /api/register
  → zod registerSchema 驗證（Email、暱稱、密碼、兩次一致）
  → 檢查 Email 是否已存在（409）
  → bcrypt.hash(password, 10)
  → prisma.user.create（同時建立 SellerStats）
  → 201
前端註冊成功後自動 signIn("credentials")
```

## 登入流程

```
signIn("credentials", { email, password })
  → authorize()：findUnique(email) → bcrypt.compare
  → 成功回傳 user；失敗回 null → /login?error=CredentialsSignin
```

## 受保護路徑

`auth.config.ts` 的 `authorized` callback 目前保護：`/dashboard`、`/listings/new`、`/account`。未登入存取會被導到 `/login`。新增受保護路徑時修改該清單。

> 個別頁面（如 `/listings/[id]/edit`）與所有 Server Actions 另以 `requireUser()`（`src/lib/session.ts`）在伺服器端強制登入與權限檢查，proxy 為第一道防線、`requireUser()` 為第二道，兩者互補。

## 環境變數

| 變數 | 說明 |
|------|------|
| `AUTH_SECRET` | JWT / cookie 加密金鑰。產生：`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `AUTH_TRUST_HOST` | 部署時設 `true` |

## 第三方登入（Discord / LINE）

結構已就緒，接上只需兩步：

### 1. 填入環境變數（`.env`）

```
AUTH_DISCORD_ID="..."
AUTH_DISCORD_SECRET="..."
AUTH_LINE_ID="..."
AUTH_LINE_SECRET="..."
```

### 2. 在 `src/auth.config.ts` 的 `providers` 加入 provider

```ts
import Discord from "next-auth/providers/discord";

providers: [
  Discord, // 讀 AUTH_DISCORD_ID / AUTH_DISCORD_SECRET
  // LINE：next-auth 內建 line provider，或用 OIDC 自訂
],
```

> 放在 `auth.config.ts`（非 `auth.ts`）是因為 OAuth provider 為 edge-safe，可供 middleware 使用。Prisma adapter 已設定，OAuth 使用者會自動寫入 `User` / `Account`。

### 注意事項

- **LINE Login** 需在 LINE Developers 建立 channel、設定 callback URL 並通過網域驗證，需預留審核時間。
- OAuth 使用者的 `passwordHash` 為 null；若要讓其也能設密碼，另做「綁定密碼」流程。
- **半實名**：僅開放 Discord / LINE 後，可考慮移除或限制純帳密註冊，以維持實名強度。
