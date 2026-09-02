import type { ButtonHTMLAttributes, ReactNode } from "react";
import { formatIndianRupees } from "@khalsa-ev/utils";

export const brand = {
  green: "#42b419",
  ink: "#09120c",
  charcoal: "#101614",
  muted: "#f5f7f4",
  white: "#ffffff",
} as const;

export type ButtonVariant = "primary" | "secondary" | "ghost";

export type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  children,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const styleByVariant: Record<ButtonVariant, string> = {
    primary: "bg-brand-green text-white hover:bg-[#2f8c13] shadow-sm",
    secondary: "bg-white text-brand-ink ring-1 ring-slate-200 hover:bg-slate-50",
    ghost: "bg-transparent text-brand-ink hover:bg-slate-100",
  };

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition-all duration-200 ${styleByVariant[variant]} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  const alignment = align === "center" ? "mx-auto text-center" : "text-left";

  return (
    <div className={`${alignment} max-w-2xl`}>
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-green">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-brand-ink sm:text-4xl">{title}</h2>
      {description ? <p className="mt-3 text-base text-slate-600">{description}</p> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <span className="text-3xl font-black text-brand-ink">{value}</span>
        {trend ? <span className="text-xs font-semibold text-brand-green">{trend}</span> : null}
      </div>
    </div>
  );
}

export function ProductCard({
  name,
  price,
  originalPrice,
  badge,
  rating,
  reviewCount,
  imageLabel,
}: {
  name: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  rating: number;
  reviewCount: number;
  imageLabel: string;
}) {
  const indianFormat = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg">
      <div className="flex h-56 items-center justify-center bg-[radial-gradient(circle_at_top,_#ecfdf5,_#eef7ee_40%,_#f5f5f5_100%)] text-6xl">
        {imageLabel}
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-brand-green/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-green">
            {badge ?? "Featured"}
          </span>
          <span className="text-sm font-medium text-slate-600">★ {rating} ({reviewCount})</span>
        </div>
        <h3 className="mt-4 text-lg font-bold text-brand-ink">{name}</h3>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xl font-black text-brand-ink">{indianFormat.format(price)}</span>
          {originalPrice ? (
            <span className="text-sm text-slate-400 line-through">{indianFormat.format(originalPrice)}</span>
          ) : null}
        </div>
        <button className="mt-5 w-full rounded-full bg-brand-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2f8c13]">
          Add to cart
        </button>
      </div>
    </article>
  );
}

// Real-catalog product card (API-backed data, prices in paise). Omits
// rating/wishlist/cart-add - Reviews, Wishlist, and Cart aren't built
// yet (Phases 6/9), so no fake affordances for features that don't work.
export function CatalogProductCard({
  slug,
  name,
  sku,
  price,
  mrp,
  inStock,
  imageUrl,
}: {
  slug: string;
  name: string;
  sku: string;
  price: number;
  mrp: number;
  inStock: boolean;
  imageUrl?: string;
}) {
  const discountPercent = mrp > price ? Math.round((1 - price / mrp) * 100) : 0;

  return (
    <a
      href={`/products/${slug}`}
      className="group block overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="flex h-48 items-center justify-center bg-[radial-gradient(circle_at_top,_#ecfdf5,_#eef7ee_40%,_#f5f5f5_100%)]">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- shared package, no next/image dependency
          <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-5xl">🔧</span>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">{sku}</span>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
              inStock ? "bg-brand-green/10 text-brand-green" : "bg-red-50 text-red-500"
            }`}
          >
            {inStock ? "In stock" : "Out of stock"}
          </span>
        </div>
        <h3 className="mt-3 line-clamp-2 text-lg font-bold text-brand-ink">{name}</h3>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xl font-black text-brand-ink">{formatIndianRupees(price)}</span>
          {discountPercent > 0 ? (
            <>
              <span className="text-sm text-slate-400 line-through">{formatIndianRupees(mrp)}</span>
              <span className="text-sm font-semibold text-brand-green">{discountPercent}% off</span>
            </>
          ) : null}
        </div>
        <span className="mt-5 inline-flex w-full items-center justify-center rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-brand-ink transition group-hover:border-brand-green group-hover:text-brand-green">
          View details
        </span>
      </div>
    </a>
  );
}
