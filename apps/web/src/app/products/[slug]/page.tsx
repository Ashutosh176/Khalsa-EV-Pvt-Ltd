import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogProductCard } from "@khalsa-ev/ui";
import { formatIndianRupees } from "@khalsa-ev/utils";
import { Header } from "../../../components/Header";
import { Footer } from "../../../components/Footer";
import { ProductCardActions } from "../../../components/ProductCardActions";
import { getCatalogProduct, getCatalogProducts } from "../../../lib/api";
import { ProductGallery } from "./ProductGallery";
import { ProductBuyBox } from "./ProductBuyBox";
import { ProductTabs } from "./ProductTabs";

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
  const specEntries = product.specifications ? Object.entries(product.specifications) : [];

  const related = (await getCatalogProducts({ categoryId: product.category.id, pageSize: 5 })).items.filter(
    (p) => p.id !== product.id,
  );

  const rawTabs: ({ label: string; content: ReactNode } | null)[] = [
    specEntries.length > 0
      ? {
          label: "Specifications",
          content: (
            <div className="grid gap-x-10 gap-y-2 text-[12.5px] sm:grid-cols-2">
              {specEntries.map(([key, value]) => (
                <div key={key} className="flex justify-between border-b border-dashed border-brand-line py-1.5">
                  <span className="text-brand-sub">{key}</span>
                  <span className="font-bold">{String(value)}</span>
                </div>
              ))}
            </div>
          ),
        }
      : null,
    product.description
      ? { label: "Description", content: <p className="max-w-3xl text-[13px] leading-relaxed text-brand-ink">{product.description}</p> }
      : null,
    product.compatibility.length > 0
      ? {
          label: "Compatibility",
          content: (
            <ul className="space-y-1.5 text-[13px]">
              {product.compatibility.map((entry) => (
                <li key={entry.id} className="flex items-center gap-2">
                  <span className="font-bold text-brand-green">✓</span>
                  {entry.vehicleVariant.model.brand.name} {entry.vehicleVariant.model.name} {entry.vehicleVariant.name}
                  {entry.vehicleYear ? ` (${entry.vehicleYear.year})` : ""}
                </li>
              ))}
            </ul>
          ),
        }
      : null,
    product.warrantyMonths
      ? {
          label: "Warranty & Returns",
          content: (
            <p className="text-[13px] text-brand-ink">
              Covered by a {product.warrantyMonths}-month manufacturer warranty. Eligible for a 7-day return if the item
              arrives damaged or doesn&apos;t match the listing.
            </p>
          ),
        }
      : null,
  ];
  const tabs = rawTabs.filter((tab): tab is { label: string; content: ReactNode } => tab !== null);

  return (
    <main className="min-h-screen bg-white text-brand-ink">
      <Header />

      <div className="mx-auto max-w-[1440px] px-4 pt-3.5 text-xs text-brand-sub sm:px-7">
        <Link href="/products" className="hover:text-brand-green-dark">
          Home
        </Link>
        {" › "}
        <Link href={`/products?categoryId=${product.category.id}`} className="hover:text-brand-green-dark">
          {product.category.name}
        </Link>
        {" › "}
        <span className="text-brand-ink">{product.name}</span>
      </div>

      <div className="mx-auto flex max-w-[1440px] flex-col gap-7 px-4 py-7 sm:px-7 lg:flex-row">
        <div className="lg:w-[340px] lg:shrink-0">
          <ProductGallery images={product.images} name={product.name} />
        </div>

        <div className="flex-1">
          {product.brand ? (
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-green">{product.brand.name}</p>
          ) : null}
          <h1 className="mt-1.5 text-[21px] font-bold">{product.name}</h1>
          <p className="mt-1 text-[13px] text-brand-sub">
            SKU: {product.sku}
            {product.partNumber ? ` · Part #${product.partNumber}` : ""}
          </p>

          <div className="mt-3.5 flex items-baseline gap-2.5">
            <span className="text-[26px] font-extrabold">{formatIndianRupees(product.price)}</span>
            {discountPercent > 0 ? (
              <>
                <span className="text-[13px] text-brand-sub line-through">{formatIndianRupees(product.mrp)}</span>
                <span className="text-[13px] font-bold text-brand-red">{discountPercent}% OFF</span>
              </>
            ) : null}
          </div>
          {product.gstPercent && Number(product.gstPercent) > 0 ? (
            <p className="mt-1 text-xs text-brand-sub">Inclusive of {product.gstPercent}% GST</p>
          ) : null}

          <div className="mt-3 text-[12px] font-bold text-brand-green-dark">
            {product.inStock ? `● In Stock — ${product.availableStock} available` : "● Out of stock"}
          </div>

          {product.compatibility.length > 0 ? (
            <div className="mt-3.5 rounded-[10px] border border-brand-line p-3.5 text-xs">
              <b>Compatible With:</b>{" "}
              {product.compatibility
                .slice(0, 6)
                .map((entry) => `${entry.vehicleVariant.model.brand.name} ${entry.vehicleVariant.model.name} ${entry.vehicleVariant.name}`)
                .join(", ")}
            </div>
          ) : null}
        </div>

        <div className="lg:w-[280px] lg:shrink-0">
          <ProductBuyBox productId={product.id} price={product.price} mrp={product.mrp} inStock={product.inStock} />
        </div>
      </div>

      {tabs.length > 0 ? (
        <div className="mx-auto max-w-[1440px] px-4 pb-7 sm:px-7">
          <ProductTabs tabs={tabs} />
        </div>
      ) : null}

      {related.length > 0 ? (
        <div className="mx-auto max-w-[1440px] px-4 pb-9 sm:px-7">
          <h3 className="mb-3.5 text-[15px] font-bold">You May Also Like</h3>
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
