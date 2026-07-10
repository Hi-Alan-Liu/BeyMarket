import Link from "next/link";
import type { Condition, ListingStatus } from "@/generated/prisma/enums";
import { ConditionBadge, StatusBadge } from "@/components/ui";
import { formatPrice } from "@/lib/format";

export type ListingCardData = {
  id: string;
  title: string;
  price: number;
  condition: Condition;
  status: ListingStatus;
  seriesName: string;
  partTypeName: string;
  imageUrl: string | null;
  sellerName: string;
};

export function ListingCard({ listing }: { listing: ListingCardData }) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 transition hover:border-indigo-300 hover:shadow-sm"
    >
      <div className="aspect-square w-full bg-gray-50">
        {listing.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-gray-300">
            無圖片
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span>{listing.seriesName}</span>
          <span>·</span>
          <span>{listing.partTypeName}</span>
        </div>
        <h3 className="line-clamp-2 text-sm font-medium group-hover:text-indigo-600">
          {listing.title}
        </h3>
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="font-semibold">{formatPrice(listing.price)}</span>
          <div className="flex items-center gap-1">
            <ConditionBadge condition={listing.condition} />
            {listing.status !== "ACTIVE" && (
              <StatusBadge status={listing.status} />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
