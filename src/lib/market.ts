import { prisma } from "@/lib/prisma";
import type { Condition } from "@/generated/prisma/enums";

/**
 * 行情工具。行情以「品項（catalogId）× 狀況（condition）」為維度分開統計，
 * 因為全新與二手價差大，混算會失真（企劃書 §4.6 已定案）。
 */

export type ConditionStat = {
  condition: Condition;
  count: number;
  min: number;
  max: number;
  avg: number;
  recent: { price: number; soldAt: Date }[]; // 由新到舊，供冷啟動「近 N 筆」與走勢圖
};

/** 冷啟動門檻：成交筆數低於此值時，前端以「近 N 筆」呈現而非畫日線。 */
export const COLD_START_THRESHOLD = 8;

/**
 * 取得某品項各狀況的行情統計（即時計算，資料量小時足夠）。
 * 回傳依狀況分組的 min / max / avg / count 與近期成交點。
 */
export async function getMarketStats(
  catalogId: string,
  recentLimit = 30,
): Promise<ConditionStat[]> {
  const history = await prisma.priceHistory.findMany({
    where: { catalogId },
    orderBy: { soldAt: "desc" },
    select: { condition: true, price: true, soldAt: true },
  });

  const byCondition = new Map<Condition, { price: number; soldAt: Date }[]>();
  for (const h of history) {
    const arr = byCondition.get(h.condition) ?? [];
    arr.push({ price: h.price, soldAt: h.soldAt });
    byCondition.set(h.condition, arr);
  }

  const stats: ConditionStat[] = [];
  for (const [condition, points] of byCondition) {
    const prices = points.map((p) => p.price);
    stats.push({
      condition,
      count: prices.length,
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      recent: points.slice(0, recentLimit),
    });
  }
  return stats;
}

/** 寫入一筆行情明細（成交時呼叫）。 */
export function recordPriceHistory(input: {
  catalogId: string;
  condition: Condition;
  price: number;
  soldAt: Date;
}) {
  return prisma.priceHistory.create({ data: input });
}

// ---- ISO 週工具（每週彙整用） ----

/** 取得日期所屬的 ISO 年與週數。 */
export function isoWeek(date: Date): { year: number; week: number } {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  // ISO：週四決定年份
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

/** 截斷到當日（UTC 00:00）。 */
function truncateToDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
}

type Bucket = { min: number; max: number; sum: number; count: number };

function addToBucket(map: Map<string, Bucket>, key: string, price: number) {
  const b = map.get(key);
  if (b) {
    b.min = Math.min(b.min, price);
    b.max = Math.max(b.max, price);
    b.sum += price;
    b.count += 1;
  } else {
    map.set(key, { min: price, max: price, sum: price, count: 1 });
  }
}

/**
 * 將 PriceHistory 彙整進每日 / 每週彙整表（Cron 定時呼叫）。
 * 採全量重算 + upsert：資料量小時最單純可靠，且可重複執行（冪等）。
 * 回傳寫入的列數，方便 Cron 記錄。
 */
export async function aggregateMarketSummaries() {
  const history = await prisma.priceHistory.findMany({
    select: { catalogId: true, condition: true, price: true, soldAt: true },
  });

  // key: catalogId|condition|dayISO / catalogId|condition|year|week
  const daily = new Map<string, Bucket>();
  const weekly = new Map<string, Bucket>();
  const dayMeta = new Map<string, { catalogId: string; condition: Condition; date: Date }>();
  const weekMeta = new Map<
    string,
    { catalogId: string; condition: Condition; year: number; week: number }
  >();

  for (const h of history) {
    const day = truncateToDay(h.soldAt);
    const dayKey = `${h.catalogId}|${h.condition}|${day.toISOString()}`;
    addToBucket(daily, dayKey, h.price);
    dayMeta.set(dayKey, { catalogId: h.catalogId, condition: h.condition, date: day });

    const { year, week } = isoWeek(h.soldAt);
    const weekKey = `${h.catalogId}|${h.condition}|${year}|${week}`;
    addToBucket(weekly, weekKey, h.price);
    weekMeta.set(weekKey, { catalogId: h.catalogId, condition: h.condition, year, week });
  }

  let written = 0;

  for (const [key, b] of daily) {
    const meta = dayMeta.get(key)!;
    await prisma.priceDailySummary.upsert({
      where: {
        catalogId_condition_date: {
          catalogId: meta.catalogId,
          condition: meta.condition,
          date: meta.date,
        },
      },
      create: {
        catalogId: meta.catalogId,
        condition: meta.condition,
        date: meta.date,
        minPrice: b.min,
        maxPrice: b.max,
        avgPrice: b.sum / b.count,
        count: b.count,
      },
      update: {
        minPrice: b.min,
        maxPrice: b.max,
        avgPrice: b.sum / b.count,
        count: b.count,
      },
    });
    written += 1;
  }

  for (const [key, b] of weekly) {
    const meta = weekMeta.get(key)!;
    await prisma.priceWeeklySummary.upsert({
      where: {
        catalogId_condition_year_week: {
          catalogId: meta.catalogId,
          condition: meta.condition,
          year: meta.year,
          week: meta.week,
        },
      },
      create: {
        catalogId: meta.catalogId,
        condition: meta.condition,
        year: meta.year,
        week: meta.week,
        minPrice: b.min,
        maxPrice: b.max,
        avgPrice: b.sum / b.count,
        count: b.count,
      },
      update: {
        minPrice: b.min,
        maxPrice: b.max,
        avgPrice: b.sum / b.count,
        count: b.count,
      },
    });
    written += 1;
  }

  return { dailyRows: daily.size, weeklyRows: weekly.size, written };
}
