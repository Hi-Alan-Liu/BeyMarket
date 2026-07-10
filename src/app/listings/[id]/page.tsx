import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getMarketStats } from "@/lib/market";
import { formatPrice, formatDate } from "@/lib/format";
import { ConditionBadge, StatusBadge, Stars, TrustBadge } from "@/components/ui";
import { MarketWidget } from "@/components/market-widget";
import { PurchaseRequestForm } from "@/components/purchase-request-form";
import { MarkSoldPanel } from "@/components/mark-sold-panel";
import { ReviewForm } from "@/components/review-form";
import { toggleDelist } from "@/app/listings/actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { title: true },
  });
  return { title: listing ? `${listing.title} — BeyMarket` : "商品 — BeyMarket" };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      series: true,
      partType: true,
      subType: true,
      catalog: true,
      seller: { include: { stats: true } },
      transaction: { include: { reviews: true } },
      requests: {
        where: { status: "PENDING" },
        include: {
          buyer: { select: { id: true, displayName: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!listing) notFound();

  const isOwner = user?.id === listing.sellerId;
  const canRequest =
    !!user &&
    !isOwner &&
    (listing.status === "ACTIVE" || listing.status === "NEGOTIATING");

  const myRequest =
    user && !isOwner
      ? await prisma.purchaseRequest.findUnique({
          where: { listingId_buyerId: { listingId: id, buyerId: user.id } },
          select: { message: true, quantity: true, status: true },
        })
      : null;

  const marketStats = listing.catalogId
    ? await getMarketStats(listing.catalogId)
    : [];

  const sellerName =
    listing.seller.displayName ?? listing.seller.name ?? "賣家";
  const lineContact = listing.lineContact ?? listing.seller.lineContact;

  const tx = listing.transaction;
  // 評價資格：交易存在，且目前使用者為買賣雙方之一、且尚未評價
  let canReview = false;
  let reviewTargetLabel = "";
  if (tx && user) {
    const alreadyReviewed = tx.reviews.some((r) => r.authorId === user.id);
    if (!alreadyReviewed) {
      if (user.id === tx.buyerId) {
        canReview = true;
        reviewTargetLabel = "賣家";
      } else if (user.id === tx.sellerId && tx.buyerId) {
        canReview = true;
        reviewTargetLabel = "買家";
      }
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <Link href="/listings" className="text-sm text-gray-400 hover:text-black">
        ← 回商品列表
      </Link>

      <div className="mt-4 grid gap-8 md:grid-cols-[1fr_360px]">
        {/* 左：圖片 + 描述 + 行情 */}
        <div>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
            {listing.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={listing.images[0].url}
                alt={listing.title}
                className="max-h-[420px] w-full object-contain"
              />
            ) : (
              <div className="flex h-72 items-center justify-center text-sm text-gray-300">
                無圖片
              </div>
            )}
          </div>
          {listing.images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {listing.images.slice(1).map((img) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={img.id}
                  src={img.url}
                  alt=""
                  className="aspect-square w-full rounded-md border border-gray-200 object-cover"
                />
              ))}
            </div>
          )}

          {listing.description && (
            <section className="mt-6">
              <h2 className="mb-2 text-sm font-semibold">商品描述</h2>
              <p className="whitespace-pre-wrap text-sm text-gray-700">
                {listing.description}
              </p>
            </section>
          )}

          {listing.catalog && (
            <section className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">
                  市場行情 · {listing.catalog.name}
                </h2>
                <Link
                  href={`/market/${listing.catalogId}`}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  詳細行情 →
                </Link>
              </div>
              <MarketWidget stats={marketStats} />
            </section>
          )}
        </div>

        {/* 右：資訊卡 + 操作 */}
        <aside className="space-y-5">
          <div className="rounded-xl border border-gray-200 p-5">
            <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
              <span>{listing.series.name}</span>
              <span>·</span>
              <span>{listing.partType.name}</span>
              {listing.subType && (
                <>
                  <span>·</span>
                  <span>{listing.subType.name}</span>
                </>
              )}
            </div>
            <h1 className="text-xl font-bold">{listing.title}</h1>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-2xl font-bold text-indigo-600">
                {formatPrice(listing.price)}
              </span>
              <ConditionBadge condition={listing.condition} />
              <StatusBadge status={listing.status} />
            </div>
            <p className="mt-1 text-xs text-gray-400">
              數量 {listing.quantity}　·　{formatDate(listing.createdAt)} 上架
            </p>

            {listing.status === "SOLD" && (
              <p className="mt-3 rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-600">
                此商品已於 {tx && formatDate(tx.soldAt)} 售出
                {tx?.price != null && `，成交價 ${formatPrice(tx.price)}`}。
              </p>
            )}
          </div>

          {/* 賣家資訊 */}
          <div className="rounded-xl border border-gray-200 p-5">
            <h2 className="mb-3 text-sm font-semibold">賣家</h2>
            <Link
              href={`/sellers/${listing.seller.id}`}
              className="flex items-center gap-3 hover:opacity-80"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                {sellerName.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium">{sellerName}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <Stars
                    rating={listing.seller.stats?.avgRating ?? 0}
                    count={listing.seller.stats?.ratingCount ?? 0}
                  />
                  <TrustBadge score={listing.seller.stats?.trustScore ?? 0} />
                </div>
              </div>
            </Link>

            {lineContact ? (
              <div className="mt-4 rounded-md bg-green-50 p-3 text-sm">
                <p className="text-xs text-gray-500">LINE 聯絡方式</p>
                {user ? (
                  <p className="mt-0.5 font-medium text-green-700 break-all">
                    {lineContact}
                  </p>
                ) : (
                  <p className="mt-0.5 text-gray-500">
                    <Link href={`/login?callbackUrl=/listings/${id}`} className="text-indigo-600 underline">
                      登入
                    </Link>{" "}
                    後可查看
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-4 text-xs text-gray-400">
                賣家未提供 LINE，請送出購買需求聯繫。
              </p>
            )}
          </div>

          {/* 操作區 */}
          {isOwner ? (
            <OwnerControls listing={listing} />
          ) : canRequest ? (
            <div className="rounded-xl border border-gray-200 p-5">
              <h2 className="mb-3 text-sm font-semibold">購買需求</h2>
              {user ? (
                <PurchaseRequestForm listingId={id} existing={myRequest} />
              ) : null}
            </div>
          ) : !user ? (
            <div className="rounded-xl border border-gray-200 p-5 text-sm">
              <Link
                href={`/login?callbackUrl=/listings/${id}`}
                className="font-medium text-indigo-600 underline"
              >
                登入
              </Link>{" "}
              後即可送出購買需求
            </div>
          ) : null}

          {/* 評價 */}
          {canReview && tx && (
            <ReviewForm
              transactionId={tx.id}
              targetLabel={reviewTargetLabel}
            />
          )}
        </aside>
      </div>
    </main>
  );
}

/** 賣家的商品操作：編輯 / 下架 / 標記已售出（含需求清單）。 */
function OwnerControls({
  listing,
}: {
  listing: {
    id: string;
    price: number;
    status: string;
    catalogId: string | null;
    requests: {
      buyerId: string;
      message: string | null;
      quantity: number;
      buyer: { displayName: string | null; name: string | null };
    }[];
  };
}) {
  const requesters = listing.requests.map((r) => ({
    buyerId: r.buyerId,
    name: r.buyer.displayName ?? r.buyer.name ?? "買家",
    message: r.message,
    quantity: r.quantity,
  }));

  async function toggle() {
    "use server";
    await toggleDelist(listing.id);
  }

  return (
    <div className="space-y-4 rounded-xl border border-indigo-200 bg-indigo-50/40 p-5">
      <h2 className="text-sm font-semibold">賣家管理</h2>

      {listing.status !== "SOLD" && (
        <>
          <div className="flex gap-2">
            <Link
              href={`/listings/${listing.id}/edit`}
              className="flex-1 rounded-md border border-gray-300 bg-white py-2 text-center text-sm hover:bg-gray-50"
            >
              編輯
            </Link>
            <form action={toggle} className="flex-1">
              <button className="w-full rounded-md border border-gray-300 bg-white py-2 text-sm hover:bg-gray-50">
                {listing.status === "DELISTED" ? "重新上架" : "下架"}
              </button>
            </form>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-gray-500">
              購買需求（{requesters.length}）
            </p>
            {requesters.length === 0 ? (
              <p className="text-xs text-gray-400">尚無買家送出需求。</p>
            ) : (
              <ul className="mb-3 space-y-2">
                {requesters.map((r) => (
                  <li
                    key={r.buyerId}
                    className="rounded-md bg-white p-2 text-sm ring-1 ring-gray-200"
                  >
                    <span className="font-medium">{r.name}</span>
                    <span className="text-gray-400">　需求 {r.quantity}</span>
                    {r.message && (
                      <p className="mt-0.5 text-xs text-gray-500">{r.message}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <MarkSoldPanel
              listingId={listing.id}
              askingPrice={listing.price}
              requesters={requesters}
              hasCatalog={!!listing.catalogId}
            />
          </div>
        </>
      )}

      {listing.status === "SOLD" && (
        <p className="text-sm text-gray-500">此商品已售出。</p>
      )}
    </div>
  );
}
