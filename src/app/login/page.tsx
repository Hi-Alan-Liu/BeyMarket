"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);
    if (res?.error) {
      setError("Email 或密碼錯誤");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="mb-2 text-2xl font-bold">登入 BeyMarket</h1>
      <p className="mb-6 text-sm text-gray-500">戰鬥陀螺零件交易賣場</p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">密碼</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-black py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "登入中…" : "登入"}
        </button>
      </form>

      {/* 之後接第三方登入的位置 */}
      <div className="my-6 flex items-center gap-3 text-xs text-gray-400">
        <span className="h-px flex-1 bg-gray-200" />
        第三方登入（即將開放）
        <span className="h-px flex-1 bg-gray-200" />
      </div>
      <div className="flex gap-3">
        <button
          disabled
          className="flex-1 rounded-md border border-gray-200 py-2 text-sm text-gray-400"
        >
          Discord
        </button>
        <button
          disabled
          className="flex-1 rounded-md border border-gray-200 py-2 text-sm text-gray-400"
        >
          LINE
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-gray-500">
        還沒有帳號？{" "}
        <Link href="/register" className="font-medium text-black underline">
          註冊
        </Link>
      </p>
    </main>
  );
}
