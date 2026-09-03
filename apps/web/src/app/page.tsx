import Link from "next/link";
import { Button, CatalogProductCard } from "@khalsa-ev/ui";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { TrustStrip } from "../components/TrustStrip";
import { ProductCardActions } from "../components/ProductCardActions";
import { categoryIcon } from "../components/CategoryIcon";
import { getBrands, getCatalogProducts, getCategories } from "../lib/api";

// Categories, brands, and featured products are fetched server-side from
// the API - without this, Next would freeze the homepage as fully static
// at build time and never show catalog changes made afterward.
export const revalidate = 60;

const WHY_CHOOSE_US = [
  ["🛡️", "100% Genuine", "Original Parts"],
  ["🔀", "Wide Compatibility", "For All Vehicles"],
  ["💰", "Best Prices", "Affordable Rates"],
  ["🎧", "Expert Support", "24/7 Assistance"],
  ["🚚", "Fast Delivery", "Pan India"],
  ["↩️", "Easy Returns", "Hassle-free"],
];

export default async function HomePage() {
  const [categories, brands, featuredResult] = await Promise.all([
    getCategories(),
    getBrands(),
    getCatalogProducts({ featured: true, pageSize: 6 }),
  ]);

  // Falls back to the newest ACTIVE listings when nothing is marked
  // featured yet, so the homepage never renders an empty product grid.
  const products =
    featuredResult.items.length > 0 ? featuredResult.items : (await getCatalogProducts({ sort: "newest", pageSize: 6 })).items;

  return (
    <main className="min-h-screen bg-white text-brand-ink">
      <Header />

      <div className="flex items-center gap-8 bg-gradient-to-br from-[#0B0D0E] to-[#171B15] px-4 py-11 sm:px-7 lg:py-[46px]">
        <div className="flex-1 text-white">
          <h1 className="text-[28px] font-extrabold leading-tight sm:text-[34px]">
            Genuine Parts.
            <br />
            Reliable Performance.
            <br />
            <span className="text-brand-green">Every Ride.</span>
          </h1>
          <p className="mt-3.5 max-w-[380px] text-[13px] text-[#B7BBBE]">
            Wide range of 100% genuine EV spare parts for all leading brands.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/products">
              <Button>Shop Now</Button>
            </Link>
            <Link
              href="/find-parts"
              className="inline-flex items-center justify-center gap-1.5 rounded-[7px] border border-white px-[18px] py-2.5 text-[13px] font-semibold text-white transition hover:bg-white/10"
            >
              Find Parts for Your Vehicle
            </Link>
          </div>
        </div>
        <div className="hidden flex-1 justify-center gap-1.5 text-[64px] sm:flex lg:text-[80px]">
          <span>🛵</span>
          <span>🔋</span>
          <span>⚙️</span>
        </div>
      </div>

      <div className="border-b border-brand-line">
        <TrustStrip />
      </div>

      <div className="px-4 pb-2.5 pt-7 sm:px-7">
        <div className="flex flex-wrap items-center gap-3.5 rounded-[10px] border border-brand-line p-[18px]">
          <div className="shrink-0 text-[13px] font-bold">Find Parts for Your Vehicle</div>
          {["Select Brand", "Select Model", "Select Variant", "Select Year"].map((placeholder) => (
            <select
              key={placeholder}
              disabled
              className="min-w-[130px] flex-1 rounded-[7px] border border-brand-line p-2.5 text-xs text-brand-sub disabled:bg-brand-surface"
            >
              <option>{placeholder}</option>
            </select>
          ))}
          <Link href="/find-parts">
            <Button>Find Parts</Button>
          </Link>
        </div>
      </div>

      <div className="px-4 py-3.5 sm:px-7">
        <div className="mb-3.5 flex items-center justify-between">
          <h3 className="m-0 text-base font-bold">Shop by Categories</h3>
          <Link href="/products" className="text-xs font-medium text-brand-green-dark hover:underline">
            View All Categories ›
          </Link>
        </div>
        <div className="flex flex-wrap justify-between gap-3.5">
          {categories.map((category) => (
            <Link key={category.id} href={`/products?categoryId=${category.id}`} className="w-[76px] text-center">
              <div className="mx-auto mb-1.5 flex h-[46px] w-[46px] items-center justify-center rounded-full bg-brand-green-light text-xl">
                {categoryIcon(category.name)}
              </div>
              <div className="text-[10.8px] font-semibold">{category.name}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="px-4 pb-3.5 pt-1.5 sm:px-7">
        <div className="mb-3.5 flex items-center justify-between">
          <h3 className="m-0 text-base font-bold">Top Selling Products</h3>
          <Link href="/products" className="text-xs font-medium text-brand-green-dark hover:underline">
            View All ›
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-brand-line p-12 text-center text-brand-sub">
            New products are being added to the catalog - check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
            {products.map((product) => (
              <CatalogProductCard
                key={product.id}
                slug={product.slug}
                name={product.name}
                sub={product.brand?.name}
                price={product.price}
                mrp={product.mrp}
                inStock={product.inStock}
                imageUrl={product.images[0]?.url}
                actions={<ProductCardActions productId={product.id} inStock={product.inStock} />}
              />
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-0 sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[10px] bg-[#101210] px-6 py-6 text-white sm:px-[30px]">
          <div>
            <div className="text-xl font-extrabold">Free Shipping Over ₹2,999</div>
            <div className="mt-1 text-xs text-[#B7BBBE]">
              Applied automatically at checkout - orders below ship for a flat ₹99.
            </div>
          </div>
          <div className="text-[44px]">🛵</div>
          <Link href="/products">
            <Button>Shop Now</Button>
          </Link>
        </div>
      </div>

      <div className="px-4 pb-3.5 pt-7 sm:px-7">
        <h3 className="mb-3.5 text-base font-bold">Why Choose Khalsa EV Spare Parts?</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {WHY_CHOOSE_US.map(([icon, title, sub]) => (
            <div key={title} className="rounded-[10px] border border-brand-line p-4 text-center">
              <div className="text-[22px]">{icon}</div>
              <div className="mb-0.5 mt-1.5 text-xs font-bold">{title}</div>
              <div className="text-[10.5px] text-brand-sub">{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {brands.length > 0 ? (
        <div className="px-4 pb-9 pt-1.5 sm:px-7">
          <h3 className="mb-3.5 text-base font-bold">Top Brands We Support</h3>
          <div className="flex flex-wrap gap-3.5">
            {brands.map((b) => (
              <div key={b.id} className="rounded-[10px] border border-brand-line px-[22px] py-3.5 text-sm font-extrabold text-brand-ink">
                {b.name}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="pb-9" />
      )}

      <Footer />
    </main>
  );
}
