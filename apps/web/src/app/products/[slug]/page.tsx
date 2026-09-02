import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "../../../components/Header";
import { Footer } from "../../../components/Footer";
import { getCatalogProduct } from "../../../lib/api";
import { formatIndianRupees } from "@khalsa-ev/utils";
import { ProductActions } from "./ProductActions";

async function loadProduct(slug: string) {
  try {
    return await getCatalogProduct(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) return { title: "Product not found | Khalsa EV" };
  return {
    title: `${product.name} | Khalsa EV`,
    description: product.description ?? `Genuine ${product.name} for electric vehicles, from Khalsa EV.`,
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) notFound();

  const discountPercent = product.mrp > product.price ? Math.round((1 - product.price / product.mrp) * 100) : 0;
  const specifications = product.specifications;

  return (
    <main className="min-h-screen bg-slate-50 text-brand-ink">
      <Header />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <nav className="text-sm text-slate-500">
          <Link href="/products" className="hover:text-brand-green">
            Shop
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/products?categoryId=${product.category.id}`} className="hover:text-brand-green">
            {product.category.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-700">{product.name}</span>
        </nav>

        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          <div className="flex h-96 items-center justify-center rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top,_#ecfdf5,_#eef7ee_40%,_#f5f5f5_100%)]">
            {product.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element -- product images are remote, unoptimized is fine for now
              <img
                src={product.images[0].url}
                alt={product.images[0].altText ?? product.name}
                className="h-full w-full rounded-[2rem] object-cover"
              />
            ) : (
              <span className="text-8xl">🔧</span>
            )}
          </div>

          <div>
            {product.brand ? (
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-green">{product.brand.name}</p>
            ) : null}
            <h1 className="mt-2 text-3xl font-black tracking-tight text-brand-ink sm:text-4xl">{product.name}</h1>
            <p className="mt-2 text-sm text-slate-500">
              SKU: {product.sku}
              {product.partNumber ? ` · Part #${product.partNumber}` : ""}
            </p>

            <div className="mt-6 flex items-center gap-3">
              <span className="text-3xl font-black text-brand-ink">{formatIndianRupees(product.price)}</span>
              {discountPercent > 0 ? (
                <>
                  <span className="text-lg text-slate-400 line-through">{formatIndianRupees(product.mrp)}</span>
                  <span className="rounded-full bg-brand-green/10 px-3 py-1 text-sm font-bold text-brand-green">
                    {discountPercent}% off
                  </span>
                </>
              ) : null}
            </div>
            {product.gstPercent && Number(product.gstPercent) > 0 ? (
              <p className="mt-1 text-xs text-slate-400">Inclusive of {product.gstPercent}% GST</p>
            ) : null}

            <div className="mt-4">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${
                  product.inStock ? "bg-brand-green/10 text-brand-green" : "bg-red-50 text-red-500"
                }`}
              >
                {product.inStock ? `In stock (${product.availableStock} available)` : "Out of stock"}
              </span>
            </div>

            <ProductActions productId={product.id} inStock={product.inStock} />

            {product.warrantyMonths ? (
              <p className="mt-4 text-sm text-slate-600">Warranty: {product.warrantyMonths} months</p>
            ) : null}

            {product.description ? <p className="mt-6 text-slate-600">{product.description}</p> : null}

            {product.compatibility.length > 0 ? (
              <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">Compatible with</h2>
                <ul className="mt-3 space-y-2">
                  {product.compatibility.map((entry) => (
                    <li key={entry.id} className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="font-bold text-brand-green">✓</span>
                      {entry.vehicleVariant.model.brand.name} {entry.vehicleVariant.model.name}{" "}
                      {entry.vehicleVariant.name}
                      {entry.vehicleYear ? ` (${entry.vehicleYear.year})` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {specifications && Object.keys(specifications).length > 0 ? (
              <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">Specifications</h2>
                <dl className="mt-3 space-y-2 text-sm">
                  {Object.entries(specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                      <dt className="text-slate-500">{key}</dt>
                      <dd className="font-medium text-slate-700">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
