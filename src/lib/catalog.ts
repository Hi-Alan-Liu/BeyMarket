import { prisma } from "@/lib/prisma";

/**
 * 分類體系查詢工具。
 * 系列 / 主分類 / 子分類皆為可設定的資料表（非寫死 enum）。
 */

/** 取得所有系列（依 sortOrder）。 */
export function getSeries() {
  return prisma.series.findMany({ orderBy: { sortOrder: "asc" } });
}

/** 取得所有主分類（依 sortOrder）。 */
export function getPartTypes() {
  return prisma.partType.findMany({ orderBy: { sortOrder: "asc" } });
}

/**
 * 取得子分類，可依系列 / 主分類過濾。
 * 子分類帶 seriesId + partTypeId 限定其出現範圍（目前僅 CX + 上蓋）。
 */
export function getSubTypes(filter?: { seriesId?: string; partTypeId?: string }) {
  return prisma.subType.findMany({
    where: {
      seriesId: filter?.seriesId,
      partTypeId: filter?.partTypeId,
    },
    orderBy: { sortOrder: "asc" },
  });
}

/**
 * 一次載入上架表單所需的完整分類樹（含子分類綁定關係），
 * 讓前端可在 client 端做「系列 → 主分類 → 子分類」的連動選擇。
 */
export async function getTaxonomy() {
  const [series, partTypes, subTypes] = await Promise.all([
    getSeries(),
    getPartTypes(),
    getSubTypes(),
  ]);
  return { series, partTypes, subTypes };
}

/**
 * 依名稱 + 分類找出或建立零件字典項目（PartCatalog）。
 * 字典項目提供行情彙整的穩定聚合鍵，避免使用者自填標題造成拼寫分歧。
 */
export async function findOrCreateCatalog(input: {
  name: string;
  seriesId: string;
  partTypeId: string;
  subTypeId: string | null;
}) {
  const name = input.name.trim();
  if (!name) return null;

  const existing = await prisma.partCatalog.findFirst({
    where: {
      name,
      seriesId: input.seriesId,
      partTypeId: input.partTypeId,
      subTypeId: input.subTypeId,
    },
  });
  if (existing) return existing;

  return prisma.partCatalog.create({
    data: {
      name,
      seriesId: input.seriesId,
      partTypeId: input.partTypeId,
      subTypeId: input.subTypeId,
    },
  });
}

/** 品項自動建議：依前綴搜尋字典（供上架時挑選正規化品項）。 */
export function suggestCatalog(query: string, limit = 8) {
  const q = query.trim();
  if (!q) return Promise.resolve([]);
  return prisma.partCatalog.findMany({
    where: { name: { contains: q, mode: "insensitive" } },
    orderBy: { name: "asc" },
    take: limit,
    include: { series: true, partType: true, subType: true },
  });
}
