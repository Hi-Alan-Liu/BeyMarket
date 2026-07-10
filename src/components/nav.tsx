import Link from "next/link";
import { auth, signOut } from "@/auth";

export async function Navbar() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Bey<span className="text-indigo-600">Market</span>
        </Link>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <Link href="/listings" className="hover:text-black">
            商品
          </Link>
          <Link href="/market" className="hover:text-black">
            行情
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-3 text-sm">
          {user ? (
            <>
              <Link
                href="/listings/new"
                className="rounded-md bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-700"
              >
                上架
              </Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-black">
                我的
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button className="text-gray-400 hover:text-black">登出</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-600 hover:text-black">
                登入
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-black px-3 py-1.5 font-medium text-white"
              >
                註冊
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
