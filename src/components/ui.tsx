import Link from "next/link";
import type { Condition, ListingStatus } from "@/generated/prisma/enums";
import { CONDITION_LABEL, STATUS_LABEL } from "@/lib/format";

/** 商品狀況徽章。 */
export function ConditionBadge({ condition }: { condition: Condition }) {
  const color =
    condition === "NEW"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : "bg-amber-50 text-amber-700 ring-amber-200";
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${color}`}
    >
      {CONDITION_LABEL[condition]}
    </span>
  );
}

/** 商品狀態徽章。 */
export function StatusBadge({ status }: { status: ListingStatus }) {
  const color: Record<ListingStatus, string> = {
    ACTIVE: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    NEGOTIATING: "bg-blue-50 text-blue-700 ring-blue-200",
    SOLD: "bg-gray-100 text-gray-600 ring-gray-200",
    DELISTED: "bg-gray-100 text-gray-400 ring-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${color[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

/** 星等顯示（唯讀）。 */
export function Stars({
  rating,
  count,
}: {
  rating: number;
  count?: number;
}) {
  const full = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <span className="text-amber-500" aria-hidden>
        {"★".repeat(full)}
        <span className="text-gray-300">{"★".repeat(5 - full)}</span>
      </span>
      <span className="text-gray-500">
        {rating > 0 ? rating.toFixed(1) : "—"}
        {count != null && ` (${count})`}
      </span>
    </span>
  );
}

/** 信任分數徽章。 */
export function TrustBadge({ score }: { score: number }) {
  const tier =
    score >= 75
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : score >= 45
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-gray-100 text-gray-500 ring-gray-200";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tier}`}
      title="信任分數：評價、成交數、帳齡加權（0–100）"
    >
      信任 {score}
    </span>
  );
}

/** 空狀態提示。 */
export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 px-6 py-16 text-center">
      <p className="text-gray-600">{title}</p>
      {hint && <p className="mt-1 text-sm text-gray-400">{hint}</p>}
      {action && (
        <Link
          href={action.href}
          className="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
