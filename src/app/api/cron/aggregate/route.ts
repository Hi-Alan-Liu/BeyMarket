import { NextResponse } from "next/server";
import { aggregateMarketSummaries } from "@/lib/market";

/**
 * 行情彙整 Cron 端點。
 * 將 PriceHistory 彙整進每日 / 每週彙整表（依 品項 × 狀況）。
 *
 * 保護：需帶 `Authorization: Bearer <CRON_SECRET>`。
 * Zeabur / Vercel Cron 設定每日呼叫 GET /api/cron/aggregate。
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const result = await aggregateMarketSummaries();
  return NextResponse.json({ ok: true, ...result });
}
