import { CatalogProductCard, SectionHeading } from "@khalsa-ev/ui";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { ProductCardActions } from "../../components/ProductCardActions";
import { getCatalogProducts, getCategories, type CatalogFilters } from "../../lib/api";

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
  const sortParam = toStringParam(params.sort);
  const sort = sortParam === "price_asc" || sortParam === "price_desc" ? sortParam : "newest";
  const page = Number(toStringParam(params.page) ?? "1") || 1;

  const [categories, catalog] = await Promise.all([
    getCategories(),
    getCatalogProducts({ search, categoryId, sort, page, pageSize: 12 }),
  ]);

  const totalPages = Math.max(1, Math.ceil(catalog.total / catalog.pageSize));

  return (
    <main className="min-h-screen bg-slate-50 text-brand-ink">
      <Header />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Shop"
          title="EV spare parts & accessories"
          description="Search or filter by category to find genuine parts for your electric vehicle."
        />

        <form method="get" className="mt-8 flex flex-wrap gap-3 rounded-3xl border border-slate-200 bg-white p-4">
          <input
            type="search"
            name="search"
            defaultValue={search}
            placeholder="Search by name, SKU, or part number"
            className="min-w-[220px] flex-1 rounded-full border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-green"
          />
          <select
            name="categoryId"
            defaultValue={categoryId ?? ""}
            className="rounded-full border border-slate-200 px-4 py-2.5 text-sm"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select name="sort" defaultValue={sort} className="rounded-full border border-slate-200 px-4 py-2.5 text-sm">
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-full bg-brand-green px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2f8c13]"
          >
            Apply
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-500">
          {catalog.total} {catalog.total === 1 ? "product" : "products"} found
        </p>

        {catalog.items.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            No products match your search yet.
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
          <div className="mt-10 flex items-center justify-center gap-3">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => {
              const query = new URLSearchParams();
              if (search) query.set("search", search);
              if (categoryId) query.set("categoryId", categoryId);
              if (sort !== "newest") query.set("sort", sort);
              query.set("page", String(pageNumber));

              return (
                <a
                  key={pageNumber}
                  href={`/products?${query.toString()}`}
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                    pageNumber === page ? "bg-brand-green text-white" : "border border-slate-200 text-slate-600"
                  }`}
                >
                  {pageNumber}
                </a>
              );
            })}
          </div>
        ) : null}
      </div>

      <Footer />
    </main>
  );
}
