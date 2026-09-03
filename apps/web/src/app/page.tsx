import Link from "next/link";
import { Button, CatalogProductCard, SectionHeading } from "@khalsa-ev/ui";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { CategoryIcon } from "../components/CategoryIcon";
import { getCatalogProducts, getCategories, getVehicleBrands } from "../lib/api";

// Categories, vehicle brands, and featured products are fetched
// server-side from the API - without this, Next would freeze the
// homepage as fully static at build time and never show catalog
// changes made afterward (admins adding/featuring products, etc.).
export const revalidate = 60;

const TRUST_POINTS = [
  { title: "Vehicle-specific fitment", text: "Match parts to your exact EV model in seconds with compatibility filters." },
  { title: "Genuine quality", text: "Every product is selected for safety, reliability, and long-term performance." },
  { title: "Quick dispatch", text: "Orders are processed fast and shipped with tracking on every parcel." },
];

const HOW_IT_WORKS = [
  { step: "1", title: "Find your fit", text: "Search by part, or select your vehicle brand and model to see only what fits." },
  { step: "2", title: "Add to cart", text: "Compare price and stock, then add compatible parts to your cart." },
  { step: "3", title: "Track your order", text: "Checkout securely and follow your order from packed to delivered." },
];

export default async function HomePage() {
  const [categories, vehicleBrands, featuredResult] = await Promise.all([
    getCategories(),
    getVehicleBrands(),
    getCatalogProducts({ featured: true, pageSize: 8 }),
  ]);

  // Falls back to the newest ACTIVE listings when nothing is marked
  // featured yet, so the homepage never renders an empty product grid.
  const featuredProducts =
    featuredResult.items.length > 0 ? featuredResult.items : (await getCatalogProducts({ sort: "newest", pageSize: 8 })).items;

  return (
    <main className="min-h-screen bg-slate-50 text-brand-ink">
      <Header />

      <section className="border-b border-slate-200 bg-gradient-to-b from-[#f3faef] to-slate-50">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-20">
          <div className="flex flex-col justify-center">
            <span className="w-fit rounded-full bg-brand-green/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-brand-green">
              Trusted EV essentials
            </span>
            <h1 className="mt-6 max-w-xl text-4xl font-black tracking-tight text-brand-ink sm:text-5xl lg:text-6xl">
              Power every ride with genuine EV parts.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-slate-600">
              Upgrade batteries, controllers, brakes, lighting, and accessories with reliable compatibility guidance
              built for Indian EV riders.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/products">
                <Button>Shop all parts</Button>
              </Link>
              <Link href="/find-parts">
                <Button variant="secondary">Find my fitment</Button>
              </Link>
            </div>

            <div className="mt-10 grid max-w-lg grid-cols-3 gap-4">
              {[
                { label: "Category taxonomy", value: `${categories.length}` },
                { label: "Free shipping over", value: "₹2,999" },
                { label: "Support", value: "7 days/week" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-black text-brand-ink">{stat.value}</div>
                  <div className="text-sm text-slate-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/40">
            <div className="rounded-[1.5rem] bg-[radial-gradient(circle_at_top,_#ecfdf5,_#eff7f1_40%,_#f7f7f7_100%)] p-5">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-brand-green/15 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.16em] text-brand-green">
                  Fitment finder
                </span>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                  {vehicleBrands.length > 0 ? `${vehicleBrands.length} brand${vehicleBrands.length === 1 ? "" : "s"} supported` : "Live"}
                </span>
              </div>

              <div className="mt-6 space-y-3">
                {["Select your vehicle brand", "Pick the exact model & variant", "See only parts that fit"].map((step, i) => (
                  <div key={step} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-green/10 text-xs font-bold text-brand-green">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>

              <Link href="/find-parts" className="mt-5 block">
                <Button className="w-full">Check compatibility</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 text-center sm:grid-cols-4 sm:px-6 lg:px-8">
          {["Genuine parts", "Fast dispatch", "Secure checkout", "Easy returns"].map((metric) => (
            <div key={metric} className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              {metric}
            </div>
          ))}
        </div>
      </section>

      <section id="categories" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Shop by category"
            title="Explore parts for every EV need"
            description="Browse the essentials riders trust when upgrading, repairing, and maintaining their electric vehicles."
          />
          <Link href="/products" className="hidden shrink-0 text-sm font-semibold text-brand-green hover:underline md:inline-block">
            View all categories
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?categoryId=${category.id}`}
              className="group flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-brand-green/40 hover:shadow-md"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-green/10 text-brand-green transition group-hover:bg-brand-green group-hover:text-white">
                <CategoryIcon name={category.name} />
              </div>
              <div className="text-sm font-bold text-brand-ink">{category.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {vehicleBrands.length > 0 ? (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Shop by vehicle"
              title="Find parts made for your ride"
              description="Pick your EV brand to jump straight into the fitment finder for that vehicle."
            />

            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {vehicleBrands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/find-parts?brandId=${brand.id}`}
                  className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center transition hover:-translate-y-0.5 hover:border-brand-green/40 hover:bg-white hover:shadow-md"
                >
                  <span className="text-2xl font-black text-brand-ink">{brand.name.charAt(0)}</span>
                  <span className="text-sm font-bold text-brand-ink">{brand.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section id="shop" className="bg-slate-100/70 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <SectionHeading
              eyebrow="Featured products"
              title="Top performance essentials"
              description="From battery upgrades to critical safety components, these are the parts riders reach for most."
            />
            <Link href="/products" className="hidden md:inline-block">
              <Button variant="ghost">View all products</Button>
            </Link>
          </div>

          {featuredProducts.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
              New products are being added to the catalog - check back soon.
            </div>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {featuredProducts.map((product) => (
                <CatalogProductCard
                  key={product.id}
                  slug={product.slug}
                  name={product.name}
                  sku={product.sku}
                  price={product.price}
                  mrp={product.mrp}
                  inStock={product.inStock}
                  imageUrl={product.images[0]?.url}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="offers" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] bg-brand-charcoal p-8 text-white lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-green">Free shipping</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                Free shipping on every order over ₹2,999.
              </h2>
              <p className="mt-4 max-w-xl text-slate-300">
                Applied automatically at checkout - no code needed. Orders below the threshold ship for a flat ₹99.
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-white p-5 text-brand-ink">
              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200 p-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Free shipping threshold</div>
                  <div className="mt-2 text-lg font-bold">₹2,999</div>
                </div>
                <div className="rounded-2xl border border-slate-200 p-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Standard shipping</div>
                  <div className="mt-2 text-lg font-bold">₹99 flat rate</div>
                </div>
                <Link href="/products">
                  <Button className="w-full">Start shopping</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Why Khalsa EV"
            title="Built for better parts buying"
            description="We combine product quality, technical guidance, and service support to make EV maintenance simple and dependable."
            align="center"
          />

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {TRUST_POINTS.map((feature) => (
              <div key={feature.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-7 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-green/10 text-brand-green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <h3 className="mt-5 text-xl font-bold text-brand-ink">{feature.title}</h3>
                <p className="mt-3 text-slate-600">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-100/60 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="How it works" title="From search to your doorstep" align="center" />

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-green text-lg font-black text-white">
                  {item.step}
                </div>
                <h3 className="mt-5 text-lg font-bold text-brand-ink">{item.title}</h3>
                <p className="mt-3 text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
