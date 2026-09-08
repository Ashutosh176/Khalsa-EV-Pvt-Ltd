import Link from "next/link";
import { CatalogProductCard } from "@khalsa-ev/ui";
import { Header } from "../../../components/Header";
import { Footer } from "../../../components/Footer";
import { ProductCardActions } from "../../../components/ProductCardActions";
import { getBrands, getCatalogProducts } from "../../../lib/api";

export const metadata = {
  title: "Electric Scooters | Khalsa EV",
  description: "Browse Khalsa EV's electric scooter lineup - compare battery, motor, range and price.",
};

function toStringParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ElectricScootersListingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = toStringParam(params.search);
  const brandId = toStringParam(params.brandId);
  const priceMin = toStringParam(params.priceMin);
  const priceMax = toStringParam(params.priceMax);
  const featured = toStringParam(params.featured) === "true";
  const page = Number(toStringParam(params.page) ?? "1") || 1;

  const [brands, catalog] = await Promise.all([
    getBrands({ productType: "SCOOTER" }),
    getCatalogProducts({
      productType: "SCOOTER",
      search,
      brandId,
      priceMin: priceMin ? Number(priceMin) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
      featured: featured || undefined,
      sort: "newest",
      page,
      pageSize: 12,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(catalog.total / catalog.pageSize));
  const selectedBrand = brands.find((b) => b.id === brandId);

  return (
    <main className="min-h-screen bg-white text-brand-ink">
      <Header />

      <div className="mx-auto max-w-[1440px] px-4 pt-3.5 text-xs text-brand-sub sm:px-7">
        <Link href="/electric-scooters" className="hover:text-brand-green-dark">
          Electric Scooters
        </Link>
        {" › "}
        <span className="text-brand-ink">{selectedBrand ? selectedBrand.name : "All Scooters"}</span>
      </div>

      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-7 sm:px-7 lg:flex-row lg:items-start">
        <div className="lg:w-[220px] lg:shrink-0">
          <form method="get" className="rounded-[10px] border border-brand-line p-4">
            <div className="mb-2.5 flex items-center justify-between text-[12.5px] font-bold">
              <span>FILTERS</span>
              <Link href="/electric-scooters/products" className="text-[11.5px] font-semibold text-brand-green-dark">
                Clear All
              </Link>
            </div>

            {brands.length > 0 ? (
              <div className="mb-4">
                <div className="mb-2 text-xs font-bold">Brand</div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[11.8px] text-[#3A3E42]">
                  <input type="radio" name="brandId" value="" defaultChecked={!brandId} />
                  All Brands
                </label>
                {brands.map((brand) => (
                  <label key={brand.id} className="mb-1.5 flex items-center gap-1.5 text-[11.8px] text-[#3A3E42]">
                    <input type="radio" name="brandId" value={brand.id} defaultChecked={brand.id === brandId} />
                    {brand.name}
                  </label>
                ))}
              </div>
            ) : null}

            <div className="mb-4">
              <div className="mb-2 text-xs font-bold">Price Range (₹)</div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="priceMin"
                  defaultValue={priceMin}
                  placeholder="Min"
                  className="w-full rounded-[6px] border border-brand-line px-2 py-1.5 text-[11.5px]"
                />
                <span className="text-brand-sub">–</span>
                <input
                  type="number"
                  name="priceMax"
                  defaultValue={priceMax}
                  placeholder="Max"
                  className="w-full rounded-[6px] border border-brand-line px-2 py-1.5 text-[11.5px]"
                />
              </div>
            </div>

            {featured ? <input type="hidden" name="featured" value="true" /> : null}
            {search ? <input type="hidden" name="search" value={search} /> : null}

            <button type="submit" className="w-full rounded-[7px] bg-brand-green py-2.5 text-[13px] font-semibold text-white hover:bg-brand-green-dark">
              Apply Filters
            </button>
          </form>
        </div>

        <div className="flex-1">
          <div className="mb-3.5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="m-0 text-[23px] font-bold">{selectedBrand ? selectedBrand.name : "All Scooters"}</h1>
              <p className="mt-1 text-[13px] text-brand-sub">
                {featured ? "Our featured electric scooter models." : "Compare battery, motor power, range and price."}
              </p>
            </div>
            <div className="text-xs text-brand-sub">
              {catalog.total} {catalog.total === 1 ? "result" : "results"}
            </div>
          </div>

          {catalog.items.length === 0 ? (
            <div className="rounded-[10px] border border-dashed border-brand-line p-12 text-center text-brand-sub">
              No scooters match your search yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {catalog.items.map((scooter) => (
                <CatalogProductCard
                  key={scooter.id}
                  slug={scooter.slug}
                  name={scooter.name}
                  sub={
                    scooter.scooterSpec
                      ? `${scooter.scooterSpec.rangeKm} km range · ${scooter.scooterSpec.topSpeedKmh} km/h`
                      : scooter.brand?.name
                  }
                  price={scooter.price}
                  mrp={scooter.mrp}
                  inStock={scooter.inStock}
                  imageUrl={scooter.images[0]?.url}
                  href={`/electric-scooters/products/${scooter.slug}`}
                  fallbackIcon="🛵"
                  actions={<ProductCardActions productId={scooter.id} inStock={scooter.inStock} />}
                />
              ))}
            </div>
          )}

          {totalPages > 1 ? (
            <div className="mt-7 flex items-center justify-center gap-2 text-[12.5px]">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => {
                const query = new URLSearchParams();
                if (search) query.set("search", search);
                if (brandId) query.set("brandId", brandId);
                if (priceMin) query.set("priceMin", priceMin);
                if (priceMax) query.set("priceMax", priceMax);
                if (featured) query.set("featured", "true");
                query.set("page", String(pageNumber));

                return (
                  <a
                    key={pageNumber}
                    href={`/electric-scooters/products?${query.toString()}`}
                    className={`rounded-[6px] px-3 py-1.5 font-semibold ${
                      pageNumber === page ? "bg-brand-green text-white" : "border border-brand-line text-brand-ink"
                    }`}
                  >
                    {pageNumber}
                  </a>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <Footer />
    </main>
  );
}
