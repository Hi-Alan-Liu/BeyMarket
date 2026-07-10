import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Next 16：middleware 慣例已更名為 proxy。
// 使用 edge-safe 的 authConfig（不含 Credentials / Prisma）保護需登入的路徑。
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  // 略過靜態資源與 auth API
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
