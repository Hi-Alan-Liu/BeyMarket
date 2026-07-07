import Link from "next/link";
import { auth, signOut } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold">BeyMarket</h1>
      <p className="mt-2 text-gray-500">戰鬥陀螺零件交易賣場</p>

      <div className="mt-10 rounded-lg border border-gray-200 p-6">
        {session?.user ? (
          <div className="space-y-4">
            <p className="text-sm">
              已登入為{" "}
              <span className="font-semibold">
                {session.user.name ?? session.user.email}
              </span>
            </p>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button className="rounded-md border border-gray-300 px-4 py-2 text-sm">
                登出
              </button>
            </form>
          </div>
        ) : (
          <div className="flex gap-3">
            <Link
              href="/login"
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
            >
              登入
            </Link>
            <Link
              href="/register"
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium"
            >
              註冊
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
