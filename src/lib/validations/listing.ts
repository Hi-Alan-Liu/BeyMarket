import { z } from "zod";
import { Condition } from "@/generated/prisma/enums";

const conditionEnum = z.enum([
  Condition.NEW,
  Condition.USED,
  Condition.USED_WORN,
]);

/** 上架 / 編輯商品表單。 */
export const listingSchema = z.object({
  title: z.string().min(2, "標題至少 2 個字").max(80, "標題過長"),
  description: z.string().max(2000, "描述過長").optional().or(z.literal("")),
  seriesId: z.string().min(1, "請選擇系列"),
  partTypeId: z.string().min(1, "請選擇主分類"),
  subTypeId: z.string().optional().or(z.literal("")),
  catalogName: z.string().max(120).optional().or(z.literal("")),
  condition: conditionEnum,
  price: z.coerce.number().int("價格需為整數").min(0, "價格不可為負").max(10_000_000, "價格過高"),
  quantity: z.coerce.number().int().min(1, "數量至少 1").max(999, "數量過多"),
  lineContact: z.string().max(100).optional().or(z.literal("")),
  imageUrls: z.array(z.string().url("圖片需為有效網址")).max(8, "最多 8 張圖片").optional(),
});

export type ListingInput = z.infer<typeof listingSchema>;

/** 購買需求。 */
export const purchaseRequestSchema = z.object({
  listingId: z.string().min(1),
  message: z.string().max(500, "留言過長").optional().or(z.literal("")),
  quantity: z.coerce.number().int().min(1, "數量至少 1").max(999),
});

/** 成交標記（賣家指定買家 + 成交價）。 */
export const markSoldSchema = z
  .object({
    listingId: z.string().min(1),
    buyerId: z.string().optional().or(z.literal("")), // 站內買家
    buyerName: z.string().max(60).optional().or(z.literal("")), // 站外買家
    price: z.coerce.number().int("成交價需為整數").min(0).max(10_000_000),
  })
  .refine((d) => !!d.buyerId || !!d.buyerName, {
    message: "請指定站內買家或填入站外買家名稱",
    path: ["buyerId"],
  });

/** 評價。 */
export const reviewSchema = z.object({
  transactionId: z.string().min(1),
  rating: z.coerce.number().int().min(1, "請給 1–5 星").max(5, "請給 1–5 星"),
  comment: z.string().max(500, "評語過長").optional().or(z.literal("")),
});

/** 個人檔案更新。 */
export const profileSchema = z.object({
  displayName: z.string().min(2, "暱稱至少 2 個字").max(30, "暱稱過長"),
  lineContact: z.string().max(100).optional().or(z.literal("")),
  image: z.string().url("頭像需為有效網址").optional().or(z.literal("")),
});
