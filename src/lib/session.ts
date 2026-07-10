import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * 在 Server Component / Server Action 中取得目前登入者。
 * 未登入則導向登入頁（帶 callbackUrl）。
 */
export async function requireUser(callbackUrl?: string) {
  const session = await auth();
  if (!session?.user?.id) {
    const target = callbackUrl
      ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : "/login";
    redirect(target);
  }
  return session.user;
}

/** 取得目前登入者（可為 null），不強制導向。 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}
