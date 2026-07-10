"use client";

import { useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  { value: "new", label: "最新" },
  { value: "price_asc", label: "價格低→高" },
  { value: "price_desc", label: "價格高→低" },
];

export function SortSelect({ current }: { current: string }) {
  const router = useRouter();
  const params = useSearchParams();

  return (
    <select
      value={current}
      onChange={(e) => {
        const next = new URLSearchParams(params.toString());
        next.set("sort", e.target.value);
        next.delete("page");
        router.push(`/listings?${next.toString()}`);
      }}
      className="rounded-md border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-500"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
