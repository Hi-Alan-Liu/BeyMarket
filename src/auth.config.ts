import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe 基礎設定。
 * 這裡「不」放 Credentials（需 bcrypt）與 Prisma adapter，
 * 因為 middleware 跑在 edge runtime。第三方 OAuth（Discord / LINE）
 * 之後可直接加進 providers 陣列。
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [
    // 之後接第三方登入時，在這裡加入 Discord / LINE provider
  ],
  callbacks: {
    /** 保護需要登入的路徑（middleware 使用） */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const protectedPaths = ["/dashboard", "/listings/new", "/account"];
      const isProtected = protectedPaths.some((p) =>
        nextUrl.pathname.startsWith(p),
      );
      if (isProtected) return isLoggedIn;
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
