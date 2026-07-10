import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { listingCardInclude, toCardData } from "@/lib/listings";
import { ListingCard } from "@/components/listing-card";
import { EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Home() {
  const recent = await prisma.listing.findMany({
    where: { status: { in: ["ACTIVE", "NEGOTIATING"] } },
    include: listingCardInclude,
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <section className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 px-8 py-14 text-white">
        <h1 className="text-3xl font-bold sm:text-4xl">
          戰鬥陀螺零件，找得到、賣得掉、看得懂行情
        </h1>
        <p className="mt-3 max-w-xl text-indigo-100">
          玩家對玩家的零件交易平台。依系列與零件類型上架搜尋，成交後自動累積市場行情。
          平台不經手金流，交易透過 LINE 私下完成。
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/listings"
            className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
          >
            逛商品
          </Link>
          <Link
            href="/listings/new"
            className="rounded-md border border-white/40 px-5 py-2.5 text-sm font-semibold hover:bg-white/10"
          >
            我要上架
          </Link>
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">最新上架</h2>
          <Link
            href="/listings"
            className="text-sm text-indigo-600 hover:underline"
          >
            看全部 →
          </Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState
            title="還沒有任何商品"
            hint="成為第一個上架的賣家吧"
            action={{ href: "/listings/new", label: "上架零件" }}
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {recent.map((l) => (
              <ListingCard key={l.id} listing={toCardData(l)} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
