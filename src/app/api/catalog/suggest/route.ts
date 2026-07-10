import { NextResponse } from "next/server";
import { suggestCatalog } from "@/lib/catalog";

/** 品項自動建議：GET /api/catalog/suggest?q=dran */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  if (q.trim().length < 1) return NextResponse.json({ items: [] });

  const items = await suggestCatalog(q);
  return NextResponse.json({
    items: items.map((c) => ({
      id: c.id,
      name: c.name,
      series: c.series.name,
      partType: c.partType.name,
      subType: c.subType?.name ?? null,
    })),
  });
}
