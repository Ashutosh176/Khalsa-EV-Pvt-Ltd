import Link from "next/link";
import { Button, CatalogProductCard } from "@khalsa-ev/ui";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { TrustStrip } from "../components/TrustStrip";
import { ProductCardActions } from "../components/ProductCardActions";
import { ScooterHeroCarousel } from "../components/ScooterHeroCarousel";
import { getBrands, getCatalogProducts } from "../lib/api";

// Mirrors the spare-parts homepage's revalidate strategy (Section 60) - this
// section reads the same live Product table, just filtered to SCOOTER.
export const revalidate = 60;

export const metadata = {
  title: "Electric Scooters | Khalsa EV",
  description: "Explore Khalsa EV's electric scooter lineup - compare battery, motor, range and price.",
};

const HERO_BENEFITS = [
  ["🔋", "Long Range"],
  ["🧠", "Smart Technology"],
  ["⚡", "Fast Charging"],
  ["🌱", "Eco Friendly"],
];

const WHY_ELECTRIC = [
  ["🔋", "Real-World Range", "Tested city + highway mileage"],
  ["⚡", "Fast Charging", "Back on the road in hours, not days"],
  ["🛠️", "2-3 Year Warranty", "On battery and motor"],
  ["🔧", "Genuine Parts Support", "Backed by our own spare-parts network"],
];

export default async function ElectricScootersHomePage() {
  const [brands, featuredResult] = await Promise.all([
    // Unfiltered on purpose: "Shop by Model" should list every model, not
    // just the ones with a product already assigned to them (getBrands with
    // a productType filter only returns brands that have a matching product).
    getBrands(),
    getCatalogProducts({ productType: "SCOOTER", featured: true, pageSize: 6 }),
  ]);

  const scooters =
    featuredResult.items.length > 0
      ? featuredResult.items
      : (await getCatalogProducts({ productType: "SCOOTER", sort: "newest", pageSize: 6 })).items;

  return (
    <main className="theme-scooters min-h-screen bg-white text-brand-ink">
      <Header />

      <div className="relative flex h-[440px] items-center overflow-hidden bg-[#05130B] sm:h-[480px] lg:h-[540px]">
        <ScooterHeroCarousel />
        <div className="absolute inset-0 z-[1] bg-gradient-to-r from-black/90 via-black/55 to-black/5 sm:from-black/85 sm:via-black/35 sm:to-transparent" />

        <div className="relative z-10 w-full px-4 sm:px-7">
          <div className="max-w-[480px] text-white">
            <h1 className="text-[28px] font-extrabold leading-tight sm:text-[34px] lg:text-[40px]">
              Ride Electric.
              <br />
              <span className="text-brand-blue">Live Better.</span>
            </h1>
            <p className="mt-3.5 max-w-[380px] text-[13px] text-[#D7DAD8] sm:text-sm">
              Experience the future of urban mobility with smart, reliable and powerful electric scooters.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/products">
                <Button>Explore Scooters</Button>
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-1.5 rounded-[7px] border border-white px-[18px] py-2.5 text-[13px] font-semibold text-white transition hover:bg-white/10"
              >
                Compare Models
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
              {HERO_BENEFITS.map(([icon, label]) => (
                <span key={label} className="flex items-center gap-1.5 text-[11.5px] font-semibold text-white/90">
                  <span className="text-[12px] leading-none">{icon}</span>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-brand-line">
        <TrustStrip />
      </div>

      {brands.length > 0 ? (
        <div className="px-4 pb-2.5 pt-7 sm:px-7">
          <h3 className="mb-3.5 text-base font-bold">Shop by Model</h3>
          <div className="flex flex-wrap gap-3.5">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/products?brandId=${brand.id}`}
                className="rounded-[10px] border border-brand-line px-[22px] py-3.5 text-sm font-extrabold text-brand-ink transition hover:border-brand-blue"
              >
                {brand.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="px-4 pb-3.5 pt-7 sm:px-7">
        <div className="mb-3.5 flex items-center justify-between">
          <h3 className="m-0 text-base font-bold">Featured Scooters</h3>
          <Link href="/products" className="text-xs font-medium text-brand-blue-dark hover:underline">
            View All ›
          </Link>
        </div>

        {scooters.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-brand-line p-12 text-center text-brand-sub">
            New scooters are being added to the lineup - check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
            {scooters.map((scooter) => (
              <CatalogProductCard
                key={scooter.id}
                slug={scooter.slug}
                name={scooter.name}
                sub={scooter.brand?.name}
                price={scooter.price}
                mrp={scooter.mrp}
                inStock={scooter.inStock}
                imageUrl={scooter.images[0]?.url}
                href={`/products/${scooter.slug}`}
                fallbackIcon="🛵"
                actions={<ProductCardActions productId={scooter.id} inStock={scooter.inStock} />}
              />
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-0 sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[10px] bg-[#0F2417] px-6 py-6 text-white sm:px-[30px]">
          <div>
            <div className="text-xl font-extrabold">Compare Range, Speed &amp; Price</div>
            <div className="mt-1 text-xs text-[#B7BBBE]">
              Every model lists real specs - battery, motor, range and charging time - right on its product page.
            </div>
          </div>
          <div className="text-[44px]">🛵</div>
          <Link href="/products">
            <Button>Browse All Scooters</Button>
          </Link>
        </div>
      </div>

      <div className="px-4 pb-9 pt-7 sm:px-7">
        <h3 className="mb-3.5 text-base font-bold">Why Go Electric With Khalsa EV?</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {WHY_ELECTRIC.map(([icon, title, sub]) => (
            <div key={title} className="rounded-[10px] border border-brand-line p-4 text-center">
              <div className="text-[22px]">{icon}</div>
              <div className="mb-0.5 mt-1.5 text-xs font-bold">{title}</div>
              <div className="text-[10.5px] text-brand-sub">{sub}</div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </main>
  );
}
