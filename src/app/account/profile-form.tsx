"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/account/actions";

export function ProfileForm({
  initial,
}: {
  initial: { displayName: string; lineContact: string; image: string };
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setPending(true);
    const res = await updateProfile(form);
    setPending(false);
    if (!res.ok) return setError(res.error);
    setSaved(true);
    router.refresh();
  }

  const inputCls =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500";

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">暱稱</label>
        <input
          required
          value={form.displayName}
          onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          className={inputCls}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">
          LINE 聯絡方式 <span className="text-gray-400">（買家洽談用）</span>
        </label>
        <input
          value={form.lineContact}
          onChange={(e) => setForm({ ...form, lineContact: e.target.value })}
          placeholder="LINE ID 或聯絡連結"
          className={inputCls}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">
          頭像網址 <span className="text-gray-400">（選填）</span>
        </label>
        <input
          value={form.image}
          onChange={(e) => setForm({ ...form, image: e.target.value })}
          placeholder="https://…"
          className={inputCls}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-emerald-600">✓ 已儲存</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {pending ? "儲存中…" : "儲存"}
      </button>
    </form>
  );
}
