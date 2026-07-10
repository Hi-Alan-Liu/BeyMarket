import type { ConditionStat } from "@/lib/market";
import { COLD_START_THRESHOLD } from "@/lib/market";
import { CONDITION_LABEL, formatPrice } from "@/lib/format";

/** 極簡 SVG 走勢線（無外部套件）。points 由新到舊，繪製時反轉為時間順序。 */
function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const series = [...points].reverse();
  const w = 220;
  const h = 44;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const step = w / (series.length - 1);
  const d = series
    .map((p, i) => {
      const x = i * step;
      const y = h - ((p - min) / span) * (h - 6) - 3;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="text-indigo-500">
      <path d={d} fill="none" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

/**
 * 行情摘要：依狀況分別顯示 min/max/avg 與走勢。
 * 成交量低於冷啟動門檻時，標示為「近 N 筆」而非強行畫日線。
 */
export function MarketWidget({ stats }: { stats: ConditionStat[] }) {
  if (stats.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        尚無成交紀錄，成交後即開始累積行情。
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {stats.map((s) => {
        const cold = s.count < COLD_START_THRESHOLD;
        return (
          <div
            key={s.condition}
            className="rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {CONDITION_LABEL[s.condition]}
              </span>
              <span className="text-xs text-gray-400">
                {cold ? `近 ${s.count} 筆成交` : `${s.count} 筆成交`}
              </span>
            </div>
            <div className="mt-2 flex items-end justify-between gap-4">
              <dl className="grid grid-cols-3 gap-x-4 text-sm">
                <div>
                  <dt className="text-xs text-gray-400">最低</dt>
                  <dd className="font-medium">{formatPrice(s.min)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">平均</dt>
                  <dd className="font-medium text-indigo-600">
                    {formatPrice(s.avg)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">最高</dt>
                  <dd className="font-medium">{formatPrice(s.max)}</dd>
                </div>
              </dl>
              <Sparkline points={s.recent.map((r) => r.price)} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
