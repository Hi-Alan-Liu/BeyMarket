"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Condition } from "@/generated/prisma/enums";
import { CONDITION_LABEL } from "@/lib/format";
import type { ListingInput } from "@/lib/validations/listing";
import type { ActionResult } from "@/app/listings/actions";

type Option = { id: string; name: string };
type SubTypeOption = Option & {
  seriesId: string | null;
  partTypeId: string | null;
};

const CONDITIONS: Condition[] = ["NEW", "USED", "USED_WORN"];

export type ListingFormInitial = Partial<ListingInput> & { imageUrls?: string[] };

export function ListingForm({
  series,
  partTypes,
  subTypes,
  initial,
  submitLabel,
  action,
}: {
  series: Option[];
  partTypes: Option[];
  subTypes: SubTypeOption[];
  initial?: ListingFormInitial;
  submitLabel: string;
  action: (input: ListingInput) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [form, setForm] = useState<ListingInput>({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    seriesId: initial?.seriesId ?? "",
    partTypeId: initial?.partTypeId ?? "",
    subTypeId: initial?.subTypeId ?? "",
    catalogName: initial?.catalogName ?? "",
    condition: initial?.condition ?? "USED",
    price: initial?.price ?? 0,
    quantity: initial?.quantity ?? 1,
    lineContact: initial?.lineContact ?? "",
    imageUrls: initial?.imageUrls ?? [""],
  });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const availableSubTypes = subTypes.filter(
    (s) =>
      (!s.seriesId || s.seriesId === form.seriesId) &&
      (!s.partTypeId || s.partTypeId === form.partTypeId),
  );
  const showSubTypes = availableSubTypes.length > 0;

  // 品項自動建議（debounce）
  useEffect(() => {
    const q = form.catalogName?.trim() ?? "";
    const t = setTimeout(async () => {
      if (q.length < 1) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(`/api/catalog/suggest?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setSuggestions((data.items ?? []).map((i: { name: string }) => i.name));
      } catch {
        /* 忽略建議失敗 */
      }
    }, 250);
    return () => clearTimeout(t);
  }, [form.catalogName]);

  function set<K extends keyof ListingInput>(key: K, value: ListingInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setImage(i: number, url: string) {
    setForm((f) => {
      const urls = [...(f.imageUrls ?? [])];
      urls[i] = url;
      return { ...f, imageUrls: urls };
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const payload: ListingInput = {
      ...form,
      imageUrls: (form.imageUrls ?? []).map((u) => u.trim()).filter(Boolean),
      subTypeId: showSubTypes ? form.subTypeId : "",
    };
    const result = await action(payload);
    // 成功時 action 會 redirect（不會回傳）；只有失敗才會走到這
    if (result && !result.ok) {
      setError(result.error);
      setPending(false);
    } else {
      router.refresh();
    }
  }

  const inputCls =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500";
  const labelCls = "mb-1 block text-sm font-medium";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className={labelCls}>標題</label>
        <input
          required
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="例：CX 上蓋 DranBuster 全新未拆"
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>系列</label>
          <select
            required
            value={form.seriesId}
            onChange={(e) => {
              set("seriesId", e.target.value);
              set("subTypeId", "");
            }}
            className={inputCls}
          >
            <option value="">請選擇</option>
            {series.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>主分類</label>
          <select
            required
            value={form.partTypeId}
            onChange={(e) => {
              set("partTypeId", e.target.value);
              set("subTypeId", "");
            }}
            className={inputCls}
          >
            <option value="">請選擇</option>
            {partTypes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showSubTypes && (
        <div>
          <label className={labelCls}>子分類</label>
          <select
            value={form.subTypeId}
            onChange={(e) => set("subTypeId", e.target.value)}
            className={inputCls}
          >
            <option value="">（不指定）</option>
            {availableSubTypes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className={labelCls}>
          品項名稱 <span className="text-gray-400">（供行情彙整，選填）</span>
        </label>
        <input
          list="catalog-suggestions"
          value={form.catalogName}
          onChange={(e) => set("catalogName", e.target.value)}
          placeholder="例：DranBuster 3-60F"
          className={inputCls}
        />
        <datalist id="catalog-suggestions">
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <p className="mt-1 text-xs text-gray-400">
          填入正規化品項可讓成交價匯入該零件的市場行情。
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>狀況</label>
          <select
            value={form.condition}
            onChange={(e) => set("condition", e.target.value as Condition)}
            className={inputCls}
          >
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {CONDITION_LABEL[c]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>開價 (NT$)</label>
          <input
            type="number"
            min={0}
            required
            value={form.price}
            onChange={(e) => set("price", Number(e.target.value))}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>數量</label>
          <input
            type="number"
            min={1}
            required
            value={form.quantity}
            onChange={(e) => set("quantity", Number(e.target.value))}
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>描述</label>
        <textarea
          rows={4}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="零件狀態、購入時間、可面交地點等"
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>
          LINE 聯絡方式 <span className="text-gray-400">（選填，覆寫個人預設）</span>
        </label>
        <input
          value={form.lineContact}
          onChange={(e) => set("lineContact", e.target.value)}
          placeholder="LINE ID 或聯絡連結"
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>
          圖片網址 <span className="text-gray-400">（最多 8 張）</span>
        </label>
        <div className="space-y-2">
          {(form.imageUrls ?? []).map((url, i) => (
            <input
              key={i}
              value={url}
              onChange={(e) => setImage(i, e.target.value)}
              placeholder="https://…"
              className={inputCls}
            />
          ))}
        </div>
        {(form.imageUrls?.length ?? 0) < 8 && (
          <button
            type="button"
            onClick={() =>
              set("imageUrls", [...(form.imageUrls ?? []), ""])
            }
            className="mt-2 text-sm text-indigo-600 hover:underline"
          >
            + 新增一張
          </button>
        )}
        <p className="mt-1 text-xs text-gray-400">
          初版以圖片網址儲存；未來將支援直接上傳（Cloudflare R2）。
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {pending ? "處理中…" : submitLabel}
      </button>
    </form>
  );
}
