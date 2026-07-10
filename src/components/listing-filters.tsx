"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { Condition } from "@/generated/prisma/enums";
import { CONDITION_LABEL } from "@/lib/format";

type Option = { id: string; name: string; code?: string };
type SubTypeOption = Option & {
  seriesId: string | null;
  partTypeId: string | null;
};

const CONDITIONS: Condition[] = ["NEW", "USED", "USED_WORN"];

export function ListingFilters({
  series,
  partTypes,
  subTypes,
  initial,
}: {
  series: Option[];
  partTypes: Option[];
  subTypes: SubTypeOption[];
  initial: Record<string, string>;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const [q, setQ] = useState(initial.q ?? "");
  const [seriesId, setSeriesId] = useState(initial.seriesId ?? "");
  const [partTypeId, setPartTypeId] = useState(initial.partTypeId ?? "");
  const [subTypeId, setSubTypeId] = useState(initial.subTypeId ?? "");
  const [condition, setCondition] = useState(initial.condition ?? "");
  const [minPrice, setMinPrice] = useState(initial.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(initial.maxPrice ?? "");

  // 子分類依所選系列 + 主分類連動（子分類綁定 seriesId / partTypeId）
  const availableSubTypes = subTypes.filter(
    (s) =>
      (!s.seriesId || s.seriesId === seriesId) &&
      (!s.partTypeId || s.partTypeId === partTypeId),
  );
  const showSubTypes = availableSubTypes.length > 0;

  function apply() {
    const next = new URLSearchParams();
    const sort = params.get("sort");
    if (q) next.set("q", q);
    if (seriesId) next.set("seriesId", seriesId);
    if (partTypeId) next.set("partTypeId", partTypeId);
    if (subTypeId && showSubTypes) next.set("subTypeId", subTypeId);
    if (condition) next.set("condition", condition);
    if (minPrice) next.set("minPrice", minPrice);
    if (maxPrice) next.set("maxPrice", maxPrice);
    if (sort) next.set("sort", sort);
    router.push(`/listings?${next.toString()}`);
  }

  function reset() {
    router.push("/listings");
  }

  const inputCls =
    "w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-500";
  const labelCls = "mb-1 block text-xs font-medium text-gray-500";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      className="space-y-4"
    >
      <div>
        <label className={labelCls}>關鍵字</label>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="標題 / 描述"
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>系列</label>
        <select
          value={seriesId}
          onChange={(e) => {
            setSeriesId(e.target.value);
            setSubTypeId("");
          }}
          className={inputCls}
        >
          <option value="">全部</option>
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
          value={partTypeId}
          onChange={(e) => {
            setPartTypeId(e.target.value);
            setSubTypeId("");
          }}
          className={inputCls}
        >
          <option value="">全部</option>
          {partTypes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {showSubTypes && (
        <div>
          <label className={labelCls}>子分類</label>
          <select
            value={subTypeId}
            onChange={(e) => setSubTypeId(e.target.value)}
            className={inputCls}
          >
            <option value="">全部</option>
            {availableSubTypes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className={labelCls}>狀況</label>
        <select
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          className={inputCls}
        >
          <option value="">全部</option>
          {CONDITIONS.map((c) => (
            <option key={c} value={c}>
              {CONDITION_LABEL[c]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelCls}>價格區間</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="最低"
            className={inputCls}
          />
          <span className="text-gray-400">–</span>
          <input
            type="number"
            min={0}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="最高"
            className={inputCls}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="flex-1 rounded-md bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          套用
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          清除
        </button>
      </div>
    </form>
  );
}
