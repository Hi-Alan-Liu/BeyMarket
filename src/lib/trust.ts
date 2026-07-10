import { prisma } from "@/lib/prisma";

/**
 * 信任分數 v1 定案公式（企劃書 §8 待決策項，於此定案）。
 *
 * trustScore（0–100）= 加權合成：
 *   - 評價分數（55%）：以 Bayesian 平滑後的平均星等，避免「一筆五星＝滿分」的失真。
 *   - 成交分數（30%）：累積成交數，於 SALES_CAP 筆封頂。
 *   - 帳齡分數（15%）：註冊時長，於 AGE_CAP_DAYS 天封頂。
 *
 * 權重可依營運回饋調整；係數集中於此，方便日後微調。
 */
const RATING_WEIGHT = 0.55;
const SALES_WEIGHT = 0.3;
const AGE_WEIGHT = 0.15;

// Bayesian 先驗：假設一位新賣家先天帶有 PRIOR_COUNT 筆、平均 PRIOR_MEAN 星的評價。
const PRIOR_COUNT = 3;
const PRIOR_MEAN = 3.5;

const SALES_CAP = 20;
const AGE_CAP_DAYS = 180;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function computeTrustScore(input: {
  ratingSum: number;
  ratingCount: number;
  totalSales: number;
  accountCreatedAt: Date;
  now?: Date;
}): number {
  const { ratingSum, ratingCount, totalSales, accountCreatedAt } = input;
  const now = input.now ?? new Date();

  const bayesianAvg =
    (ratingSum + PRIOR_COUNT * PRIOR_MEAN) / (ratingCount + PRIOR_COUNT);
  const ratingScore = (bayesianAvg / 5) * 100;

  const salesScore = (Math.min(totalSales, SALES_CAP) / SALES_CAP) * 100;

  const ageDays = Math.max(
    0,
    (now.getTime() - accountCreatedAt.getTime()) / MS_PER_DAY,
  );
  const ageScore = (Math.min(ageDays, AGE_CAP_DAYS) / AGE_CAP_DAYS) * 100;

  const score =
    RATING_WEIGHT * ratingScore +
    SALES_WEIGHT * salesScore +
    AGE_WEIGHT * ageScore;

  return Math.round(score);
}

/**
 * 從 transactions / reviews 重新彙整某使用者的賣家統計並寫回 SellerStats。
 * 成交、收到評價後呼叫，維持列表可直接讀取的快取。
 */
export async function recomputeSellerStats(userId: string) {
  const [user, totalSales, ratingAgg] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    }),
    prisma.transaction.count({ where: { sellerId: userId } }),
    prisma.review.aggregate({
      where: { targetId: userId, role: "BUYER" }, // 買家給賣家的評價
      _sum: { rating: true },
      _count: { rating: true },
    }),
  ]);

  if (!user) return null;

  const ratingSum = ratingAgg._sum.rating ?? 0;
  const ratingCount = ratingAgg._count.rating ?? 0;
  const avgRating = ratingCount > 0 ? ratingSum / ratingCount : 0;

  const trustScore = computeTrustScore({
    ratingSum,
    ratingCount,
    totalSales,
    accountCreatedAt: user.createdAt,
  });

  return prisma.sellerStats.upsert({
    where: { userId },
    create: {
      userId,
      totalSales,
      ratingSum,
      ratingCount,
      avgRating,
      trustScore,
    },
    update: { totalSales, ratingSum, ratingCount, avgRating, trustScore },
  });
}
