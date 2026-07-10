import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getTaxonomy } from "@/lib/catalog";
import { ListingForm } from "@/components/listing-form";
import { updateListing } from "@/app/listings/actions";

export const metadata = { title: "編輯商品 — BeyMarket" };

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(`/listings/${id}/edit`);

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      catalog: { select: { name: true } },
    },
  });
  if (!listing) notFound();
  if (listing.sellerId !== user.id) redirect(`/listings/${id}`);
  if (listing.status === "SOLD") redirect(`/listings/${id}`);

  const { series, partTypes, subTypes } = await getTaxonomy();
  const boundUpdate = updateListing.bind(null, id);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold">編輯商品</h1>
      <ListingForm
        series={series}
        partTypes={partTypes}
        subTypes={subTypes}
        submitLabel="儲存變更"
        action={boundUpdate}
        initial={{
          title: listing.title,
          description: listing.description ?? "",
          seriesId: listing.seriesId,
          partTypeId: listing.partTypeId,
          subTypeId: listing.subTypeId ?? "",
          catalogName: listing.catalog?.name ?? "",
          condition: listing.condition,
          price: listing.price,
          quantity: listing.quantity,
          lineContact: listing.lineContact ?? "",
          imageUrls: listing.images.length
            ? listing.images.map((i) => i.url)
            : [""],
        }}
      />
    </main>
  );
}
