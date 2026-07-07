"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    displayName: "",
    lineContact: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "註冊失敗");
      setLoading(false);
      return;
    }

    // 註冊成功後自動登入
    await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <h1 className="mb-2 text-2xl font-bold">註冊 BeyMarket</h1>
      <p className="mb-6 text-sm text-gray-500">建立帳號開始交易戰鬥陀螺零件</p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={update("email")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">暱稱</label>
          <input
            type="text"
            required
            value={form.displayName}
            onChange={update("displayName")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            LINE 聯絡方式 <span className="text-gray-400">（選填）</span>
          </label>
          <input
            type="text"
            value={form.lineContact}
            onChange={update("lineContact")}
            placeholder="LINE ID 或聯絡連結"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">密碼</label>
          <input
            type="password"
            required
            value={form.password}
            onChange={update("password")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">確認密碼</label>
          <input
            type="password"
            required
            value={form.confirmPassword}
            onChange={update("confirmPassword")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-black py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "註冊中…" : "註冊"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        已經有帳號了？{" "}
        <Link href="/login" className="font-medium text-black underline">
          登入
        </Link>
      </p>
    </main>
  );
}
