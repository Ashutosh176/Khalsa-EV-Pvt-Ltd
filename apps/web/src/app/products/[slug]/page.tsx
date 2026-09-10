import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogProductCard } from "@khalsa-ev/ui";
import { formatIndianRupees } from "@khalsa-ev/utils";
import { Header } from "../../../components/Header";
import { Footer } from "../../../components/Footer";
import { ProductCardActions } from "../../../components/ProductCardActions";
import { ProductGallery } from "../../../components/ProductGallery";
import { ProductBuyBox } from "../../../components/ProductBuyBox";
import { ProductTabs } from "../../../components/ProductTabs";
import { ProductReviews } from "../../../components/ProductReviews";
import { getCatalogProduct, getCatalogProducts, getProductReviews } from "../../../lib/api";

// Spare parts live at /spare-parts/products/[slug] instead (Section 60) - a
// spare part's slug must 404 here rather than render through the scooter
// template, so the two sections stay genuinely separate rather than just
// visually different.
async function loadScooter(slug: string) {
  try {
    const product = await getCatalogProduct(slug);
    return product.productType === "SCOOTER" ? product : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const scooter = await loadScooter(slug);
  if (!scooter) return { title: "Scooter not found | Khalsa EV" };
  return {
    title: `${scooter.name} | Khalsa EV Electric Scooters`,
    description: scooter.description ?? `${scooter.name} electric scooter specs and pricing, from Khalsa EV.`,
  };
}

// battery/motor/chassis specs shown as a flat key-value grid up top, since
// that's what actually differentiates one scooter from another - unlike the
// spare-parts detail page's free-form `specifications` JSON, these are all
// fixed, always-present fields on ScooterSpecification.
function buildSpecRows(spec: NonNullable<Awaited<ReturnType<typeof loadScooter>>>["scooterSpec"]) {
  if (!spec) return [];
  return [
    ["Battery", spec.batteryCapacityWh ? `${spec.batteryCapacityWh} Wh (${spec.batteryType})` : spec.batteryType],
    ["Motor Power", `${spec.motorPowerW} W`],
    ["Top Speed", `${spec.topSpeedKmh} km/h`],
    ["Range", `${spec.rangeKm} km`],
    ["Charging Time", `${spec.chargingTimeHours} hours`],
    ["Braking", spec.brakingType],
    ["Tyres", spec.tyreType && spec.tyreSize ? `${spec.tyreType}, ${spec.tyreSize}` : spec.tyreType],
    ["Suspension", spec.suspension],
    ["Kerb Weight", spec.kerbWeightKg ? `${spec.kerbWeightKg} kg` : null],
    ["Load Capacity", spec.loadCapacityKg ? `${spec.loadCapacityKg} kg` : null],
    ["Seat Height", spec.seatHeightMm ? `${spec.seatHeightMm} mm` : null],
    ["Ground Clearance", spec.groundClearanceMm ? `${spec.groundClearanceMm} mm` : null],
  ].filter((row): row is [string, string] => Boolean(row[1]));
}

export default async function ScooterDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const scooter = await loadScooter(slug);
  if (!scooter) notFound();

  const discountPercent = scooter.mrp > scooter.price ? Math.round((1 - scooter.price / scooter.mrp) * 100) : 0;
  const specRows = buildSpecRows(scooter.scooterSpec);
  const highlights = scooter.scooterSpec?.highlightFeatures ?? [];

  const related = (
    await getCatalogProducts({ productType: "SCOOTER", brandId: scooter.brand?.id, pageSize: 5 })
  ).items.filter((p) => p.id !== scooter.id);

  const reviews = await getProductReviews(scooter.id);

  const tabs: { label: string; content: ReactNode }[] = [
    ...(specRows.length > 0
      ? [
          {
            label: "Specifications",
            content: (
              <div className="grid gap-x-10 gap-y-2 text-[12.5px] sm:grid-cols-2">
                {specRows.map(([key, value]) => (
                  <div key={key} className="flex justify-between border-b border-dashed border-brand-line py-1.5">
                    <span className="text-brand-sub">{key}</span>
                    <span className="font-bold">{value}</span>
                  </div>
                ))}
              </div>
            ),
          },
        ]
      : []),
    ...(scooter.description
      ? [{ label: "Overview", content: <p className="max-w-3xl text-[13px] leading-relaxed text-brand-ink">{scooter.description}</p> }]
      : []),
    ...(scooter.scooterSpec?.warrantyTerms
      ? [
          {
            label: "Warranty",
            content: <p className="text-[13px] text-brand-ink">{scooter.scooterSpec.warrantyTerms}</p>,
          },
        ]
      : []),
    { label: `Reviews (${reviews.totalCount})`, content: <ProductReviews productId={scooter.id} initial={reviews} /> },
  ];

  return (
    <main className="theme-scooters min-h-screen bg-white text-brand-ink">
      <Header />

      <div className="mx-auto max-w-[1440px] px-4 pt-3.5 text-xs text-brand-sub sm:px-7">
        <Link href="/" className="hover:text-brand-blue-dark">
          Electric Scooters
        </Link>
        {" › "}
        <Link href="/products" className="hover:text-brand-blue-dark">
          All Scooters
        </Link>
        {" › "}
        <span className="text-brand-ink">{scooter.name}</span>
      </div>

      <div className="mx-auto flex max-w-[1440px] flex-col gap-7 px-4 py-7 sm:px-7 lg:flex-row">
        <div className="lg:w-[340px] lg:shrink-0">
          <ProductGallery images={scooter.images} name={scooter.name} fallbackIcon="🛵" />
        </div>

        <div className="flex-1">
          {scooter.brand ? (
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-blue">{scooter.brand.name}</p>
          ) : null}
          <h1 className="mt-1.5 text-[21px] font-bold">{scooter.name}</h1>

          {reviews.totalCount > 0 ? (
            <p className="mt-1.5 text-[12px] text-brand-sub">
              <span className="text-amber-500">★</span> {reviews.averageRating.toFixed(1)} ({reviews.totalCount}{" "}
              {reviews.totalCount === 1 ? "review" : "reviews"})
            </p>
          ) : null}

          <div className="mt-3.5 flex items-baseline gap-2.5">
            <span className="text-[26px] font-extrabold">{formatIndianRupees(scooter.price)}</span>
            {discountPercent > 0 ? (
              <>
                <span className="text-[13px] text-brand-sub line-through">{formatIndianRupees(scooter.mrp)}</span>
                <span className="text-[13px] font-bold text-brand-red">{discountPercent}% OFF</span>
              </>
            ) : null}
          </div>

          <div className="mt-3 text-[12px] font-bold text-brand-blue-dark">
            {scooter.inStock ? `● In Stock — ${scooter.availableStock} available` : "● Out of stock"}
          </div>

          {scooter.scooterSpec ? (
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[
                ["🔋", `${scooter.scooterSpec.rangeKm} km`, "Range"],
                ["⚡", `${scooter.scooterSpec.topSpeedKmh} km/h`, "Top Speed"],
                ["🔌", `${scooter.scooterSpec.chargingTimeHours} hrs`, "Charging"],
                ["⚙️", `${scooter.scooterSpec.motorPowerW} W`, "Motor"],
              ].map(([icon, value, label]) => (
                <div key={label} className="rounded-[10px] border border-brand-line p-3 text-center">
                  <div className="text-lg">{icon}</div>
                  <div className="mt-1 text-[13px] font-extrabold">{value}</div>
                  <div className="text-[10.5px] text-brand-sub">{label}</div>
                </div>
              ))}
            </div>
          ) : null}

          {highlights.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {highlights.map((feature) => (
                <span
                  key={feature}
                  className="rounded-full border border-brand-line px-3 py-1 text-[11px] font-semibold text-brand-ink"
                >
                  ✓ {feature}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="lg:w-[280px] lg:shrink-0">
          <ProductBuyBox productId={scooter.id} price={scooter.price} mrp={scooter.mrp} inStock={scooter.inStock} />
        </div>
      </div>

      {tabs.length > 0 ? (
        <div className="mx-auto max-w-[1440px] px-4 pb-7 sm:px-7">
          <ProductTabs tabs={tabs} />
        </div>
      ) : null}

      {related.length > 0 ? (
        <div className="mx-auto max-w-[1440px] px-4 pb-9 sm:px-7">
          <h3 className="mb-3.5 text-[15px] font-bold">More Electric Scooters</h3>
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
            {related.slice(0, 4).map((p) => (
              <CatalogProductCard
                key={p.id}
                slug={p.slug}
                name={p.name}
                sub={p.brand?.name}
                price={p.price}
                mrp={p.mrp}
                inStock={p.inStock}
                imageUrl={p.images[0]?.url}
                href={`/products/${p.slug}`}
                fallbackIcon="🛵"
                actions={<ProductCardActions productId={p.id} inStock={p.inStock} />}
              />
            ))}
          </div>
        </div>
      ) : null}

      <Footer />
    </main>
  );
}
