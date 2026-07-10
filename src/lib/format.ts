import type {
  Condition,
  ListingStatus,
  RequestStatus,
} from "@/generated/prisma/enums";

export const CONDITION_LABEL: Record<Condition, string> = {
  NEW: "全新",
  USED: "二手",
  USED_WORN: "二手（有使用痕跡）",
};

export const STATUS_LABEL: Record<ListingStatus, string> = {
  ACTIVE: "上架中",
  NEGOTIATING: "洽談中",
  SOLD: "已售出",
  DELISTED: "下架",
};

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  PENDING: "待處理",
  ACCEPTED: "已成交",
  REJECTED: "已婉拒",
  WITHDRAWN: "已撤回",
};

/** 開價 / 成交價顯示（整數台幣）。 */
export function formatPrice(price: number): string {
  return `NT$${price.toLocaleString("zh-TW")}`;
}

/** 相對/絕對日期顯示。 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
