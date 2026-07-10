import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMarketStats } from "@/lib/market";
import { CONDITION_LABEL, formatPrice, formatDate } from "@/lib/format";
import { MarketWidget } from "@/components/market-widget";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ catalogId: string }>;
}) {
  const { catalogId } = await params;
  const c = await prisma.partCatalog.findUnique({
    where: { id: catalogId },
    select: { name: true },
  });
  return { title: c ? `${c.name} 行情 — BeyMarket` : "行情 — BeyMarket" };
}

export default async function MarketDetailPage({
  params,
}: {
  params: Promise<{ catalogId: string }>;
}) {
  const { catalogId } = await params;

  const catalog = await prisma.partCatalog.findUnique({
    where: { id: catalogId },
    include: {
      series: true,
      partType: true,
      subType: true,
    },
  });
  if (!catalog) notFound();

  const stats = await getMarketStats(catalogId, 60);

  // 近期成交明細（跨狀況合併，最新 20 筆）
  const recent = await prisma.priceHistory.findMany({
    where: { catalogId },
    orderBy: { soldAt: "desc" },
    take: 20,
    select: { id: true, condition: true, price: true, soldAt: true },
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <Link href="/market" className="text-sm text-gray-400 hover:text-black">
        ← 回行情總覽
      </Link>

      <div className="mt-4">
        <h1 className="text-2xl font-bold">{catalog.name}</h1>
        <p className="mt-1 text-sm text-gray-400">
          {catalog.series.name} · {catalog.partType.name}
          {catalog.subType && ` · ${catalog.subType.name}`}
        </p>
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold">價格區間（依狀況）</h2>
        <MarketWidget stats={stats} />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold">近期成交</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-gray-400">尚無成交紀錄。</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 text-sm">
            {recent.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between px-4 py-2.5"
              >
                <span className="text-gray-500">{formatDate(r.soldAt)}</span>
                <span className="text-xs text-gray-400">
                  {CONDITION_LABEL[r.condition]}
                </span>
                <span className="font-medium">{formatPrice(r.price)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
