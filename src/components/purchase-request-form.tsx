"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendPurchaseRequest, withdrawRequest } from "@/app/trade/actions";

export function PurchaseRequestForm({
  listingId,
  existing,
}: {
  listingId: string;
  existing: { message: string | null; quantity: number; status: string } | null;
}) {
  const router = useRouter();
  const [message, setMessage] = useState(existing?.message ?? "");
  const [quantity, setQuantity] = useState(existing?.quantity ?? 1);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(existing?.status === "PENDING");
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await sendPurchaseRequest({ listingId, message, quantity });
    setPending(false);
    if (!res.ok) return setError(res.error);
    setDone(true);
    router.refresh();
  }

  async function withdraw() {
    setPending(true);
    await withdrawRequest(listingId);
    setPending(false);
    setDone(false);
    router.refresh();
  }

  const inputCls =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500";

  if (done) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm">
        <p className="font-medium text-emerald-800">✓ 已送出購買需求</p>
        <p className="mt-1 text-emerald-700">
          賣家會看到你的需求，請透過 LINE 進一步洽談。
        </p>
        <button
          onClick={withdraw}
          disabled={pending}
          className="mt-3 text-xs text-emerald-700 underline hover:text-emerald-900"
        >
          撤回需求
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium">數量</label>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className={inputCls}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">
          留言 <span className="text-gray-400">（選填）</span>
        </label>
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="想詢問的細節、期望價格等"
          className={inputCls}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {pending ? "送出中…" : "送出購買需求"}
      </button>
    </form>
  );
}
