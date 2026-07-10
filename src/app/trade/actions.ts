"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { recomputeSellerStats } from "@/lib/trust";
import {
  purchaseRequestSchema,
  markSoldSchema,
  reviewSchema,
} from "@/lib/validations/listing";

export type ActionResult = { ok: false; error: string } | { ok: true };

/** 買家送出購買需求。 */
export async function sendPurchaseRequest(raw: {
  listingId: string;
  message?: string;
  quantity: number;
}): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = purchaseRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "格式錯誤" };
  }
  const { listingId, message, quantity } = parsed.data;

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { sellerId: true, status: true },
  });
  if (!listing) return { ok: false, error: "商品不存在" };
  if (listing.sellerId === user.id) {
    return { ok: false, error: "不能對自己的商品送出需求" };
  }
  if (listing.status === "SOLD" || listing.status === "DELISTED") {
    return { ok: false, error: "此商品目前無法送出需求" };
  }

  await prisma.purchaseRequest.upsert({
    where: { listingId_buyerId: { listingId, buyerId: user.id } },
    create: {
      listingId,
      buyerId: user.id,
      message: message || null,
      quantity,
      status: "PENDING",
    },
    update: { message: message || null, quantity, status: "PENDING" },
  });

  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/dashboard/requests");
  return { ok: true };
}

/** 買家撤回需求。 */
export async function withdrawRequest(listingId: string): Promise<ActionResult> {
  const user = await requireUser();
  await prisma.purchaseRequest.updateMany({
    where: { listingId, buyerId: user.id, status: "PENDING" },
    data: { status: "WITHDRAWN" },
  });
  revalidatePath(`/listings/${listingId}`);
  return { ok: true };
}

/**
 * 賣家標記已售出：建立 Transaction、指定買家、寫入行情、更新賣家統計。
 * 全程於 DB transaction 內確保一致性。
 */
export async function markSold(raw: {
  listingId: string;
  buyerId?: string;
  buyerName?: string;
  price: number;
}): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = markSoldSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "格式錯誤" };
  }
  const { listingId, buyerId, buyerName, price } = parsed.data;

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { sellerId: true, status: true, condition: true, catalogId: true },
  });
  if (!listing || listing.sellerId !== user.id) {
    return { ok: false, error: "找不到商品或無權限" };
  }
  if (listing.status === "SOLD") {
    return { ok: false, error: "此商品已標記為已售出" };
  }

  // 站內買家需存在且非賣家本人
  if (buyerId) {
    if (buyerId === user.id) {
      return { ok: false, error: "買家不可為賣家本人" };
    }
    const buyer = await prisma.user.findUnique({
      where: { id: buyerId },
      select: { id: true },
    });
    if (!buyer) return { ok: false, error: "指定的買家不存在" };
  }

  const soldAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.listing.update({
      where: { id: listingId },
      data: { status: "SOLD" },
    });

    const transaction = await tx.transaction.create({
      data: {
        listingId,
        sellerId: user.id,
        buyerId: buyerId || null,
        buyerName: buyerId ? null : buyerName || null,
        catalogId: listing.catalogId,
        condition: listing.condition,
        price,
        soldAt,
      },
      select: { id: true },
    });

    // 被指定的站內買家需求標記為已成交，其餘標記婉拒
    if (buyerId) {
      await tx.purchaseRequest.updateMany({
        where: { listingId, buyerId },
        data: { status: "ACCEPTED" },
      });
      await tx.purchaseRequest.updateMany({
        where: { listingId, buyerId: { not: buyerId }, status: "PENDING" },
        data: { status: "REJECTED" },
      });
    } else {
      await tx.purchaseRequest.updateMany({
        where: { listingId, status: "PENDING" },
        data: { status: "REJECTED" },
      });
    }

    // 有對應字典項目才寫入行情（行情依 品項 × 狀況 彙整）
    if (listing.catalogId) {
      await tx.priceHistory.create({
        data: {
          catalogId: listing.catalogId,
          condition: listing.condition,
          price,
          soldAt,
        },
      });
    }

    return transaction;
  });

  // 更新賣家統計（成交數 → 信任分數）
  await recomputeSellerStats(user.id);

  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/dashboard");
  revalidatePath("/market");
  return { ok: true };
}

/**
 * 成交雙方互相評價。防刷：僅該交易的買賣雙方、且一人一次。
 */
export async function submitReview(raw: {
  transactionId: string;
  rating: number;
  comment?: string;
}): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = reviewSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "格式錯誤" };
  }
  const { transactionId, rating, comment } = parsed.data;

  const tx = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: { sellerId: true, buyerId: true },
  });
  if (!tx) return { ok: false, error: "交易不存在" };

  // 判斷評價者身份與被評對象
  let role: "BUYER" | "SELLER";
  let targetId: string;
  if (user.id === tx.buyerId) {
    role = "BUYER"; // 買家評賣家
    targetId = tx.sellerId;
  } else if (user.id === tx.sellerId && tx.buyerId) {
    role = "SELLER"; // 賣家評買家
    targetId = tx.buyerId;
  } else {
    return { ok: false, error: "只有此交易的買賣雙方可評價" };
  }

  const existing = await prisma.review.findUnique({
    where: { transactionId_authorId: { transactionId, authorId: user.id } },
  });
  if (existing) return { ok: false, error: "你已評價過這筆交易" };

  await prisma.review.create({
    data: {
      transactionId,
      authorId: user.id,
      targetId,
      role,
      rating,
      comment: comment || null,
    },
  });

  // 被評者若為賣家，更新其統計快取
  await recomputeSellerStats(targetId);

  revalidatePath("/dashboard");
  revalidatePath(`/sellers/${targetId}`);
  return { ok: true };
}
