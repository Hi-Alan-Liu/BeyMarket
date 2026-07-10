import { requireUser } from "@/lib/session";
import { getTaxonomy } from "@/lib/catalog";
import { ListingForm } from "@/components/listing-form";
import { createListing } from "@/app/listings/actions";

export const metadata = { title: "上架零件 — BeyMarket" };

export default async function NewListingPage() {
  await requireUser("/listings/new");
  const { series, partTypes, subTypes } = await getTaxonomy();

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-bold">上架零件</h1>
      <p className="mb-6 text-sm text-gray-500">
        依系列與零件類型分類，成交後將依品項累積市場行情。
      </p>
      <ListingForm
        series={series}
        partTypes={partTypes}
        subTypes={subTypes}
        submitLabel="上架"
        action={createListing}
      />
    </main>
  );
}
