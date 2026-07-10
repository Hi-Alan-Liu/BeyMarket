import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { listingCardInclude, toCardData } from "@/lib/listings";
import { formatDate } from "@/lib/format";
import { Stars, TrustBadge, EmptyState } from "@/components/ui";
import { ListingCard } from "@/components/listing-card";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const u = await prisma.user.findUnique({
    where: { id },
    select: { displayName: true, name: true },
  });
  const name = u?.displayName ?? u?.name ?? "賣家";
  return { title: `${name} — BeyMarket` };
}

export default async function SellerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const seller = await prisma.user.findUnique({
    where: { id },
    include: { stats: true },
  });
  if (!seller) notFound();

  const [listings, reviews] = await Promise.all([
    prisma.listing.findMany({
      where: { sellerId: id, status: { in: ["ACTIVE", "NEGOTIATING"] } },
      include: listingCardInclude,
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.review.findMany({
      where: { targetId: id, role: "BUYER" }, // 買家給此賣家的評價
      include: {
        author: { select: { displayName: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const name = seller.displayName ?? seller.name ?? "賣家";
  const stats = seller.stats;

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-700">
          {name.charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Stars
              rating={stats?.avgRating ?? 0}
              count={stats?.ratingCount ?? 0}
            />
            <TrustBadge score={stats?.trustScore ?? 0} />
          </div>
          <p className="mt-1 text-xs text-gray-400">
            累積成交 {stats?.totalSales ?? 0} 筆　·　{formatDate(seller.createdAt)} 加入
          </p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold">在售商品</h2>
        {listings.length === 0 ? (
          <EmptyState title="目前沒有在售商品" />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={toCardData(l)} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold">
          買家評價（{reviews.length}）
        </h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-gray-400">尚無評價。</p>
        ) : (
          <ul className="space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <Stars rating={r.rating} />
                  <span className="text-xs text-gray-400">
                    {formatDate(r.createdAt)}
                  </span>
                </div>
                {r.comment && (
                  <p className="mt-2 text-sm text-gray-700">{r.comment}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  by {r.author.displayName ?? r.author.name ?? "買家"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
