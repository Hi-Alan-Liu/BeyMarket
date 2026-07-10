import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate, REQUEST_STATUS_LABEL } from "@/lib/format";
import { ConditionBadge, StatusBadge, EmptyState } from "@/components/ui";

export const metadata = { title: "我的 — BeyMarket" };

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");

  const [listings, requests, sellerStats] = await Promise.all([
    prisma.listing.findMany({
      where: { sellerId: user.id },
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        _count: { select: { requests: { where: { status: "PENDING" } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.purchaseRequest.findMany({
      where: { buyerId: user.id },
      include: {
        listing: {
          select: { id: true, title: true, price: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.sellerStats.findUnique({ where: { userId: user.id } }),
  ]);

  // 待評價：我參與且尚未評價的成交
  const myTransactions = await prisma.transaction.findMany({
    where: { OR: [{ sellerId: user.id }, { buyerId: user.id }] },
    include: {
      listing: { select: { id: true, title: true } },
      reviews: { select: { authorId: true } },
    },
    orderBy: { soldAt: "desc" },
  });
  const pendingReviews = myTransactions.filter(
    (t) => !t.reviews.some((r) => r.authorId === user.id),
  );

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">我的</h1>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/account" className="text-gray-500 hover:text-black">
            帳號設定
          </Link>
          <Link
            href="/listings/new"
            className="rounded-md bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-700"
          >
            上架
          </Link>
        </div>
      </div>

      {sellerStats && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Stat label="累積成交" value={String(sellerStats.totalSales)} />
          <Stat
            label="平均星等"
            value={
              sellerStats.ratingCount > 0
                ? sellerStats.avgRating.toFixed(1)
                : "—"
            }
          />
          <Stat label="信任分數" value={String(sellerStats.trustScore)} />
        </div>
      )}

      {/* 待評價 */}
      {pendingReviews.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold">待評價交易</h2>
          <ul className="space-y-2">
            {pendingReviews.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm"
              >
                <span>
                  {t.listing.title}
                  <span className="ml-2 text-xs text-gray-400">
                    {formatDate(t.soldAt)} 成交
                  </span>
                </span>
                <Link
                  href={`/listings/${t.listing.id}`}
                  className="font-medium text-amber-700 hover:underline"
                >
                  去評價 →
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 我的商品 */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold">我的商品（{listings.length}）</h2>
        {listings.length === 0 ? (
          <EmptyState
            title="還沒有上架任何商品"
            action={{ href: "/listings/new", label: "上架零件" }}
          />
        ) : (
          <ul className="space-y-2">
            {listings.map((l) => (
              <li
                key={l.id}
                className="flex items-center gap-4 rounded-lg border border-gray-200 p-3"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-gray-50">
                  {l.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={l.images[0].url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/listings/${l.id}`}
                    className="block truncate text-sm font-medium hover:text-indigo-600"
                  >
                    {l.title}
                  </Link>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {formatPrice(l.price)}
                    </span>
                    <ConditionBadge condition={l.condition} />
                    <StatusBadge status={l.status} />
                    {l._count.requests > 0 && (
                      <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-xs font-medium text-indigo-700">
                        {l._count.requests} 筆需求
                      </span>
                    )}
                  </div>
                </div>
                {l.status !== "SOLD" && (
                  <Link
                    href={`/listings/${l.id}/edit`}
                    className="text-xs text-gray-400 hover:text-black"
                  >
                    編輯
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 我的購買需求 */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold">
          我的購買需求（{requests.length}）
        </h2>
        {requests.length === 0 ? (
          <EmptyState title="尚未送出任何購買需求" />
        ) : (
          <ul className="space-y-2">
            {requests.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-sm"
              >
                <Link
                  href={`/listings/${r.listing.id}`}
                  className="truncate font-medium hover:text-indigo-600"
                >
                  {r.listing.title}
                </Link>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500">
                    {formatPrice(r.listing.price)}
                  </span>
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                    {REQUEST_STATUS_LABEL[r.status]}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 text-center">
      <p className="text-2xl font-bold text-indigo-600">{value}</p>
      <p className="mt-1 text-xs text-gray-400">{label}</p>
    </div>
  );
}
