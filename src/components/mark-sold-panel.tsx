"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markSold } from "@/app/trade/actions";
import { formatPrice } from "@/lib/format";

type Requester = {
  buyerId: string;
  name: string;
  message: string | null;
  quantity: number;
};

export function MarkSoldPanel({
  listingId,
  askingPrice,
  requesters,
  hasCatalog,
}: {
  listingId: string;
  askingPrice: number;
  requesters: Requester[];
  hasCatalog: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // 選擇的買家：站內 buyerId，或 "__external__" 代表站外
  const [selected, setSelected] = useState<string>(
    requesters[0]?.buyerId ?? "__external__",
  );
  const [buyerName, setBuyerName] = useState("");
  const [price, setPrice] = useState(askingPrice);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const isExternal = selected === "__external__";

  async function confirm() {
    setError(null);
    setPending(true);
    const res = await markSold({
      listingId,
      buyerId: isExternal ? undefined : selected,
      buyerName: isExternal ? buyerName : undefined,
      price,
    });
    setPending(false);
    if (!res.ok) return setError(res.error);
    router.refresh();
  }

  const inputCls =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500";

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-md bg-gray-900 py-2 text-sm font-medium text-white hover:bg-black"
      >
        標記已售出
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-gray-300 p-4">
      <p className="text-sm font-medium">標記已售出</p>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">
          成交對象
        </label>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className={inputCls}
        >
          {requesters.map((r) => (
            <option key={r.buyerId} value={r.buyerId}>
              {r.name}（需求 {r.quantity}）
            </option>
          ))}
          <option value="__external__">站外買家（手動輸入）</option>
        </select>
      </div>

      {isExternal && (
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            站外買家名稱
          </label>
          <input
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            placeholder="例：LINE 暱稱"
            className={inputCls}
          />
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">
          實際成交價（NT$）
        </label>
        <input
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className={inputCls}
        />
        <p className="mt-1 text-xs text-gray-400">
          {hasCatalog
            ? "成交價將匯入該品項的市場行情。"
            : "此商品未綁定品項，成交價不會計入行情。"}
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={confirm}
          disabled={pending}
          className="flex-1 rounded-md bg-gray-900 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-50"
        >
          {pending ? "處理中…" : `確認售出 ${formatPrice(price)}`}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600"
        >
          取消
        </button>
      </div>
    </div>
  );
}
