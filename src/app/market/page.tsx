import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { EmptyState } from "@/components/ui";

export const metadata = { title: "市場行情 — BeyMarket" };
export const dynamic = "force-dynamic";

export default async function MarketPage() {
  // 有成交紀錄的品項，依成交筆數排序
  const catalogs = await prisma.partCatalog.findMany({
    where: { priceHistory: { some: {} } },
    include: {
      series: { select: { name: true } },
      partType: { select: { name: true } },
      _count: { select: { priceHistory: true } },
    },
  });

  // 各品項最近一筆成交價（用於總覽顯示）
  const latest = await prisma.priceHistory.findMany({
    where: { catalogId: { in: catalogs.map((c) => c.id) } },
    orderBy: { soldAt: "desc" },
    distinct: ["catalogId"],
    select: { catalogId: true, price: true, soldAt: true },
  });
  const latestMap = new Map(latest.map((l) => [l.catalogId, l]));

  const rows = catalogs
    .map((c) => ({ ...c, last: latestMap.get(c.id) }))
    .sort((a, b) => b._count.priceHistory - a._count.priceHistory);

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-2xl font-bold">市場行情</h1>
      <p className="mt-1 text-sm text-gray-500">
        以成交紀錄為基礎，依「品項 × 狀況」統計價格波動。
      </p>

      <div className="mt-6">
        {rows.length === 0 ? (
          <EmptyState
            title="尚無成交行情"
            hint="商品成交並綁定品項後，行情就會出現在這裡"
          />
        ) : (
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            {rows.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/market/${c.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-gray-400">
                      {c.series.name} · {c.partType.name} ·{" "}
                      {c._count.priceHistory} 筆成交
                    </p>
                  </div>
                  {c.last && (
                    <div className="text-right">
                      <p className="text-sm font-semibold text-indigo-600">
                        {formatPrice(c.last.price)}
                      </p>
                      <p className="text-xs text-gray-400">最近成交</p>
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
