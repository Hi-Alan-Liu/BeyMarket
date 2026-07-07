import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// 使用 edge-safe 的 authConfig 保護路徑（不含 Credentials / Prisma）
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // 略過靜態資源與 auth API
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
