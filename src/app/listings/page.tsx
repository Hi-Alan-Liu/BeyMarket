import Link from "next/link";
import { getTaxonomy } from "@/lib/catalog";
import { queryListings, type ListingFilters } from "@/lib/listings";
import type { Condition } from "@/generated/prisma/enums";
import { ListingCard } from "@/components/listing-card";
import { ListingFilters as FilterPanel } from "@/components/listing-filters";
import { SortSelect } from "@/components/sort-select";
import { EmptyState } from "@/components/ui";

export const metadata = { title: "商品 — BeyMarket" };
export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function num(v: string | string[] | undefined): number | undefined {
  const s = str(v);
  if (s == null || s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const { series, partTypes, subTypes } = await getTaxonomy();

  const sort = (str(sp.sort) as ListingFilters["sort"]) ?? "new";
  const page = num(sp.page) ?? 1;

  const filters: ListingFilters = {
    q: str(sp.q),
    seriesId: str(sp.seriesId),
    partTypeId: str(sp.partTypeId),
    subTypeId: str(sp.subTypeId),
    condition: str(sp.condition) as Condition | undefined,
    minPrice: num(sp.minPrice),
    maxPrice: num(sp.maxPrice),
    sort,
  };

  const { items, total, totalPages } = await queryListings(filters, page);

  // 分頁連結需保留現有查詢字串
  const baseParams = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    const s = str(v);
    if (s && k !== "page") baseParams.set(k, s);
  }
  const pageHref = (p: number) => {
    const q = new URLSearchParams(baseParams);
    q.set("page", String(p));
    return `/listings?${q.toString()}`;
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <aside className="md:sticky md:top-20 md:self-start">
          <h2 className="mb-3 text-sm font-semibold">篩選</h2>
          <FilterPanel
            series={series}
            partTypes={partTypes}
            subTypes={subTypes}
            initial={{
              q: filters.q ?? "",
              seriesId: filters.seriesId ?? "",
              partTypeId: filters.partTypeId ?? "",
              subTypeId: filters.subTypeId ?? "",
              condition: filters.condition ?? "",
              minPrice: filters.minPrice != null ? String(filters.minPrice) : "",
              maxPrice: filters.maxPrice != null ? String(filters.maxPrice) : "",
            }}
          />
        </aside>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">共 {total} 件商品</p>
            <SortSelect current={sort ?? "new"} />
          </div>

          {items.length === 0 ? (
            <EmptyState
              title="找不到符合條件的商品"
              hint="試著放寬篩選條件"
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {items.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-2 text-sm">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={pageHref(p)}
                  className={`rounded-md px-3 py-1.5 ${
                    p === page
                      ? "bg-indigo-600 text-white"
                      : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </Link>
              ))}
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}
