import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { computeTrustScore } from "../src/lib/trust";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const seller = await prisma.user.findUniqueOrThrow({
    where: { email: "seller@test.com" },
  });
  const buyer = await prisma.user.upsert({
    where: { email: "buyer@test.com" },
    update: {},
    create: { email: "buyer@test.com", displayName: "測試買家", name: "測試買家" },
  });

  const cx = await prisma.series.findUniqueOrThrow({ where: { code: "CX" } });
  const blade = await prisma.partType.findUniqueOrThrow({ where: { code: "BLADE" } });

  const catalog =
    (await prisma.partCatalog.findFirst({
      where: { name: "DranBuster 3-60F", seriesId: cx.id, partTypeId: blade.id },
    })) ??
    (await prisma.partCatalog.create({
      data: { name: "DranBuster 3-60F", seriesId: cx.id, partTypeId: blade.id },
    }));

  // 建立商品
  const listing = await prisma.listing.create({
    data: {
      sellerId: seller.id,
      title: "CX 上蓋 DranBuster 全新",
      seriesId: cx.id,
      partTypeId: blade.id,
      catalogId: catalog.id,
      condition: "NEW",
      price: 500,
      quantity: 1,
    },
  });

  // 買家送需求
  await prisma.purchaseRequest.upsert({
    where: { listingId_buyerId: { listingId: listing.id, buyerId: buyer.id } },
    update: { status: "PENDING" },
    create: { listingId: listing.id, buyerId: buyer.id, quantity: 1, status: "PENDING" },
  });

  // 成交（模擬 markSold 核心寫入）
  const soldAt = new Date();
  const tx = await prisma.$transaction(async (t) => {
    await t.listing.update({ where: { id: listing.id }, data: { status: "SOLD" } });
    const transaction = await t.transaction.create({
      data: {
        listingId: listing.id,
        sellerId: seller.id,
        buyerId: buyer.id,
        catalogId: catalog.id,
        condition: "NEW",
        price: 480,
        soldAt,
      },
    });
    await t.purchaseRequest.updateMany({
      where: { listingId: listing.id, buyerId: buyer.id },
      data: { status: "ACCEPTED" },
    });
    await t.priceHistory.create({
      data: { catalogId: catalog.id, condition: "NEW", price: 480, soldAt },
    });
    return transaction;
  });

  // 買家評價賣家
  await prisma.review.upsert({
    where: { transactionId_authorId: { transactionId: tx.id, authorId: buyer.id } },
    update: { rating: 5 },
    create: {
      transactionId: tx.id,
      authorId: buyer.id,
      targetId: seller.id,
      role: "BUYER",
      rating: 5,
      comment: "交易順利，推！",
    },
  });

  // 重算賣家統計
  const { recomputeSellerStats } = await import("../src/lib/trust");
  const stats = await recomputeSellerStats(seller.id);

  // 行情彙整 + 查詢
  const { aggregateMarketSummaries, getMarketStats } = await import("../src/lib/market");
  const agg = await aggregateMarketSummaries();
  const market = await getMarketStats(catalog.id);

  console.log("\n=== 驗證結果 ===");
  console.log("SellerStats:", {
    totalSales: stats?.totalSales,
    avgRating: stats?.avgRating,
    trustScore: stats?.trustScore,
  });
  console.log(
    "computeTrustScore 直接算(對照):",
    computeTrustScore({
      ratingSum: 5,
      ratingCount: 1,
      totalSales: 1,
      accountCreatedAt: seller.createdAt,
    }),
  );
  console.log("行情彙整:", agg);
  console.log("getMarketStats(NEW):", market.find((m) => m.condition === "NEW"));

  const dailyCount = await prisma.priceDailySummary.count();
  const weeklyCount = await prisma.priceWeeklySummary.count();
  console.log("每日彙整列數:", dailyCount, "／每週彙整列數:", weeklyCount);
  console.log("\n✅ 交易流程 + 行情 + 信任分數 全鏈路驗證完成");
}

main()
  .catch((e) => {
    console.error("❌", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
