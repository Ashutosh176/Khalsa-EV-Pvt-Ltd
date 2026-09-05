import Link from "next/link";
import { CatalogProductCard } from "@khalsa-ev/ui";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { ProductCardActions } from "../../components/ProductCardActions";
import { getBrands, getCatalogProducts, getCategories, type CatalogFilters } from "../../lib/api";

export const metadata = {
  title: "Shop EV Spare Parts | Khalsa EV",
  description: "Browse genuine electric vehicle spare parts and accessories, with vehicle compatibility guidance.",
};

const SORT_LABELS: Record<NonNullable<CatalogFilters["sort"]>, string> = {
  newest: "Newest",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
};

function toStringParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = toStringParam(params.search);
  const categoryId = toStringParam(params.categoryId);
  const brandId = toStringParam(params.brandId);
  const priceMin = toStringParam(params.priceMin);
  const priceMax = toStringParam(params.priceMax);
  const sortParam = toStringParam(params.sort);
  const sort = sortParam === "price_asc" || sortParam === "price_desc" ? sortParam : "newest";
  const page = Number(toStringParam(params.page) ?? "1") || 1;

  const [categories, brands, catalog] = await Promise.all([
    getCategories(),
    getBrands({ productType: "SPARE_PART" }),
    getCatalogProducts({
      productType: "SPARE_PART",
      search,
      categoryId,
      brandId,
      priceMin: priceMin ? Number(priceMin) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
      sort,
      page,
      pageSize: 12,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(catalog.total / catalog.pageSize));
  const selectedCategory = categories.find((c) => c.id === categoryId);

  return (
    <main className="min-h-screen bg-white text-brand-ink">
      <Header />

      <div className="mx-auto max-w-[1440px] px-4 pt-3.5 text-xs text-brand-sub sm:px-7">
        <Link href="/products" className="hover:text-brand-green-dark">
          Home
        </Link>
        {" › "}
        {selectedCategory ? (
          <>
            <Link href="/products" className="hover:text-brand-green-dark">
              Categories
            </Link>
            {" › "}
            <span className="text-brand-ink">{selectedCategory.name}</span>
          </>
        ) : (
          <span className="text-brand-ink">All Products</span>
        )}
      </div>

      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-7 sm:px-7 lg:flex-row lg:items-start">
        <div className="lg:w-[220px] lg:shrink-0">
          <form method="get" className="rounded-[10px] border border-brand-line p-4">
            <div className="mb-2.5 flex items-center justify-between text-[12.5px] font-bold">
              <span>FILTERS</span>
              <Link href="/products" className="text-[11.5px] font-semibold text-brand-green-dark">
                Clear All
              </Link>
            </div>

            <div className="mb-4">
              <div className="mb-2 text-xs font-bold">Category</div>
              <label className="mb-1.5 flex items-center gap-1.5 text-[11.8px] text-[#3A3E42]">
                <input type="radio" name="categoryId" value="" defaultChecked={!categoryId} />
                All Categories
              </label>
              {categories.map((category) => (
                <label key={category.id} className="mb-1.5 flex items-center gap-1.5 text-[11.8px] text-[#3A3E42]">
                  <input type="radio" name="categoryId" value={category.id} defaultChecked={category.id === categoryId} />
                  {category.name}
                </label>
              ))}
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

            <select name="sort" defaultValue={sort} className="mb-3 w-full rounded-[6px] border border-brand-line px-2 py-1.5 text-[11.5px]">
              {Object.entries(SORT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  Sort: {label}
                </option>
              ))}
            </select>
            {search ? <input type="hidden" name="search" value={search} /> : null}

            <button type="submit" className="w-full rounded-[7px] bg-brand-green py-2.5 text-[13px] font-semibold text-white hover:bg-brand-green-dark">
              Apply Filters
            </button>
          </form>
        </div>

        <div className="flex-1">
          <div className="mb-3.5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="m-0 text-[23px] font-bold">{selectedCategory ? selectedCategory.name : "All Products"}</h1>
              <p className="mt-1 text-[13px] text-brand-sub">
                {selectedCategory?.description ?? "Genuine EV spare parts and accessories for every vehicle."}
              </p>
            </div>
            <div className="text-xs text-brand-sub">
              {catalog.total} {catalog.total === 1 ? "result" : "results"} · Sort by: <b className="text-brand-ink">{SORT_LABELS[sort]}</b>
            </div>
          </div>

          {catalog.items.length === 0 ? (
            <div className="rounded-[10px] border border-dashed border-brand-line p-12 text-center text-brand-sub">
              No products match your search yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {catalog.items.map((product) => (
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

          {totalPages > 1 ? (
            <div className="mt-7 flex items-center justify-center gap-2 text-[12.5px]">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => {
                const query = new URLSearchParams();
                if (search) query.set("search", search);
                if (categoryId) query.set("categoryId", categoryId);
                if (brandId) query.set("brandId", brandId);
                if (priceMin) query.set("priceMin", priceMin);
                if (priceMax) query.set("priceMax", priceMax);
                if (sort !== "newest") query.set("sort", sort);
                query.set("page", String(pageNumber));

                return (
                  <a
                    key={pageNumber}
                    href={`/products?${query.toString()}`}
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
