"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { findOrCreateCatalog } from "@/lib/catalog";
import { listingSchema, type ListingInput } from "@/lib/validations/listing";

export type ActionResult = { ok: false; error: string } | { ok: true };

async function resolveCatalogId(input: ListingInput): Promise<string | null> {
  if (!input.catalogName?.trim()) return null;
  const catalog = await findOrCreateCatalog({
    name: input.catalogName,
    seriesId: input.seriesId,
    partTypeId: input.partTypeId,
    subTypeId: input.subTypeId || null,
  });
  return catalog?.id ?? null;
}

/** 建立商品。成功後導向該商品頁。 */
export async function createListing(raw: ListingInput): Promise<ActionResult> {
  const user = await requireUser("/listings/new");

  const parsed = listingSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "資料格式錯誤" };
  }
  const input = parsed.data;

  // 若指定子分類，驗證其確實綁定於所選系列 + 主分類（避免越界）
  if (input.subTypeId) {
    const sub = await prisma.subType.findUnique({ where: { id: input.subTypeId } });
    if (
      !sub ||
      (sub.seriesId && sub.seriesId !== input.seriesId) ||
      (sub.partTypeId && sub.partTypeId !== input.partTypeId)
    ) {
      return { ok: false, error: "子分類與所選系列 / 主分類不符" };
    }
  }

  const catalogId = await resolveCatalogId(input);
  const urls = (input.imageUrls ?? []).filter(Boolean);

  const listing = await prisma.listing.create({
    data: {
      sellerId: user.id,
      title: input.title,
      description: input.description || null,
      seriesId: input.seriesId,
      partTypeId: input.partTypeId,
      subTypeId: input.subTypeId || null,
      catalogId,
      condition: input.condition,
      price: input.price,
      quantity: input.quantity,
      lineContact: input.lineContact || null,
      images: {
        create: urls.map((url, i) => ({ url, sortOrder: i })),
      },
    },
    select: { id: true },
  });

  revalidatePath("/listings");
  revalidatePath("/");
  redirect(`/listings/${listing.id}`);
}

/** 編輯商品（僅賣家本人）。 */
export async function updateListing(
  listingId: string,
  raw: ListingInput,
): Promise<ActionResult> {
  const user = await requireUser();
  const existing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { sellerId: true, status: true },
  });
  if (!existing || existing.sellerId !== user.id) {
    return { ok: false, error: "找不到商品或無權限" };
  }
  if (existing.status === "SOLD") {
    return { ok: false, error: "已售出的商品無法編輯" };
  }

  const parsed = listingSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "資料格式錯誤" };
  }
  const input = parsed.data;
  const catalogId = await resolveCatalogId(input);
  const urls = (input.imageUrls ?? []).filter(Boolean);

  await prisma.$transaction([
    prisma.listingImage.deleteMany({ where: { listingId } }),
    prisma.listing.update({
      where: { id: listingId },
      data: {
        title: input.title,
        description: input.description || null,
        seriesId: input.seriesId,
        partTypeId: input.partTypeId,
        subTypeId: input.subTypeId || null,
        catalogId,
        condition: input.condition,
        price: input.price,
        quantity: input.quantity,
        lineContact: input.lineContact || null,
        images: { create: urls.map((url, i) => ({ url, sortOrder: i })) },
      },
    }),
  ]);

  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/dashboard");
  redirect(`/listings/${listingId}`);
}

/** 下架 / 重新上架切換（僅賣家本人，且未售出）。 */
export async function toggleDelist(listingId: string): Promise<ActionResult> {
  const user = await requireUser();
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { sellerId: true, status: true },
  });
  if (!listing || listing.sellerId !== user.id) {
    return { ok: false, error: "找不到商品或無權限" };
  }
  if (listing.status === "SOLD") {
    return { ok: false, error: "已售出的商品無法變更" };
  }

  const next = listing.status === "DELISTED" ? "ACTIVE" : "DELISTED";
  await prisma.listing.update({
    where: { id: listingId },
    data: { status: next },
  });

  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/dashboard");
  revalidatePath("/listings");
  return { ok: true };
}
