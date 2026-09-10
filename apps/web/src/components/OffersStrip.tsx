import type { OfferView } from "@khalsa-ev/types";

// Purely informational banners (Offer has no product/category link to send
// customers to) - a slim strip between the hero and the catalog sections,
// not a competing carousel. Renders nothing if there are no active offers.
export function OffersStrip({ offers }: { offers: OfferView[] }) {
  if (offers.length === 0) return null;

  return (
    <div className="px-4 pt-7 sm:px-7">
      <div className="flex gap-3.5 overflow-x-auto pb-1">
        {offers.map((offer) => (
          <div
            key={offer.id}
            className="relative flex h-[110px] w-[280px] shrink-0 items-end overflow-hidden rounded-[10px] border border-brand-line bg-gradient-to-br from-brand-surface to-white"
          >
            {offer.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded, non-Next-optimized asset
              <img src={offer.imageUrl} alt={offer.title} className="absolute inset-0 h-full w-full object-cover" />
            ) : null}
            <div
              className={`relative z-10 w-full p-3.5 ${offer.imageUrl ? "bg-gradient-to-t from-black/75 to-transparent text-white" : ""}`}
            >
              <p className="text-[13px] font-bold leading-tight">{offer.title}</p>
              {offer.description ? (
                <p className={`mt-0.5 text-[11px] leading-tight ${offer.imageUrl ? "text-white/85" : "text-brand-sub"}`}>
                  {offer.description}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
