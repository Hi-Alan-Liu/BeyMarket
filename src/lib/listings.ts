import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { Condition } from "@/generated/prisma/enums";
import type { ListingCardData } from "@/components/listing-card";

/** 商品列表卡片所需的最小 include。 */
export const listingCardInclude = {
  series: { select: { name: true } },
  partType: { select: { name: true } },
  images: { orderBy: { sortOrder: "asc" }, take: 1 },
  seller: { select: { displayName: true, name: true } },
} satisfies Prisma.ListingInclude;

type ListingWithCard = Prisma.ListingGetPayload<{
  include: typeof listingCardInclude;
}>;

export function toCardData(l: ListingWithCard): ListingCardData {
  return {
    id: l.id,
    title: l.title,
    price: l.price,
    condition: l.condition,
    status: l.status,
    seriesName: l.series.name,
    partTypeName: l.partType.name,
    imageUrl: l.images[0]?.url ?? null,
    sellerName: l.seller.displayName ?? l.seller.name ?? "賣家",
  };
}

export type ListingFilters = {
  q?: string;
  seriesId?: string;
  partTypeId?: string;
  subTypeId?: string;
  condition?: Condition;
  minPrice?: number;
  maxPrice?: number;
  sort?: "new" | "price_asc" | "price_desc";
};

/** 由 filters 組出 Prisma where（列表 / 搜尋共用）。 */
export function buildListingWhere(
  filters: ListingFilters,
): Prisma.ListingWhereInput {
  const where: Prisma.ListingWhereInput = {
    // 列表只顯示可交易的商品（上架中 / 洽談中），排除下架與已售出
    status: { in: ["ACTIVE", "NEGOTIATING"] },
  };

  if (filters.seriesId) where.seriesId = filters.seriesId;
  if (filters.partTypeId) where.partTypeId = filters.partTypeId;
  if (filters.subTypeId) where.subTypeId = filters.subTypeId;
  if (filters.condition) where.condition = filters.condition;

  if (filters.minPrice != null || filters.maxPrice != null) {
    where.price = {};
    if (filters.minPrice != null) where.price.gte = filters.minPrice;
    if (filters.maxPrice != null) where.price.lte = filters.maxPrice;
  }

  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  return where;
}

export function listingOrderBy(
  sort: ListingFilters["sort"],
): Prisma.ListingOrderByWithRelationInput {
  switch (sort) {
    case "price_asc":
      return { price: "asc" };
    case "price_desc":
      return { price: "desc" };
    default:
      return { createdAt: "desc" };
  }
}

const PAGE_SIZE = 24;

/** 查詢商品列表（含分頁）。 */
export async function queryListings(filters: ListingFilters, page = 1) {
  const where = buildListingWhere(filters);
  const [items, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: listingCardInclude,
      orderBy: listingOrderBy(filters.sort),
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.listing.count({ where }),
  ]);

  return {
    items: items.map(toCardData),
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}
