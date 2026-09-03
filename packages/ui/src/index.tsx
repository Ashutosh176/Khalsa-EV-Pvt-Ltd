import type { ButtonHTMLAttributes, ReactNode } from "react";
import { formatIndianRupees } from "@khalsa-ev/utils";

export type ButtonVariant = "primary" | "secondary" | "dark" | "ghost";

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
    primary: "bg-brand-green text-white hover:bg-brand-green-dark",
    secondary: "bg-white text-brand-green-dark ring-1 ring-brand-green hover:bg-brand-green-light",
    dark: "bg-brand-ink text-white hover:bg-black",
    ghost: "bg-transparent text-brand-ink hover:bg-slate-100",
  };

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-1.5 rounded-[7px] px-[18px] py-2.5 text-[13px] font-semibold transition-colors duration-150 ${styleByVariant[variant]} ${className}`.trim()}
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
      {description ? <p className="mt-3 text-base text-brand-sub">{description}</p> : null}
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
    <div className="rounded-[10px] border border-brand-line bg-white p-5 shadow-sm">
      <p className="text-sm text-brand-sub">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <span className="text-3xl font-black text-brand-ink">{value}</span>
        {trend ? <span className="text-xs font-semibold text-brand-green-dark">{trend}</span> : null}
      </div>
    </div>
  );
}

// Real-catalog product tile (API-backed data, prices in paise), styled to
// match the approved Figma reference's product card. `sub` is an optional
// second line (e.g. brand name) - there is no fake marketing subtitle.
// `tag` is an optional corner pill (e.g. "BEST SELLER") - only ever passed
// when true of the real product (e.g. isFeatured), never fabricated.
// `actions` is a slot for real interactive buttons (Add to cart, wishlist)
// - kept out of this presentational, Next-agnostic package so it never
// needs to know about auth/cart state; callers compose their own client
// components into it.
export function CatalogProductCard({
  slug,
  name,
  sub,
  price,
  mrp,
  inStock,
  imageUrl,
  tag,
  actions,
}: {
  slug: string;
  name: string;
  sub?: string;
  price: number;
  mrp: number;
  inStock: boolean;
  imageUrl?: string;
  tag?: string;
  actions?: ReactNode;
}) {
  const discountPercent = mrp > price ? Math.round((1 - price / mrp) * 100) : 0;

  return (
    <div className="relative rounded-[10px] border border-brand-line bg-white p-3">
      {tag ? (
        <span className="absolute left-4 top-4 z-10 rounded-[4px] bg-brand-green px-[7px] py-[2px] text-[9.5px] font-extrabold uppercase tracking-[0.02em] text-white">
          {tag}
        </span>
      ) : null}

      <a href={`/products/${slug}`} className="group block">
        <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-brand-line bg-gradient-to-br from-[#F2F4F1] to-[#E4E9E3]">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- shared package, no next/image dependency
            <img src={imageUrl} alt={name} className="h-full w-full rounded-lg object-cover" />
          ) : (
            <span className="text-4xl">🔧</span>
          )}
        </div>

        <div className="mt-2.5 min-h-[33px] text-[12.8px] font-bold leading-tight text-brand-ink group-hover:text-brand-green-dark">
          {name}
        </div>
        <div className="mt-0.5 mb-1.5 text-[11px] text-brand-sub">{sub ?? (inStock ? "In stock" : "Out of stock")}</div>

        <div className="mb-2.5 flex items-baseline gap-[7px]">
          <span className="text-[15px] font-extrabold text-brand-ink">{formatIndianRupees(price)}</span>
          {discountPercent > 0 ? (
            <>
              <span className="text-[11.5px] font-medium text-brand-sub line-through">{formatIndianRupees(mrp)}</span>
              <span className="text-[11px] font-bold text-brand-red">{discountPercent}% OFF</span>
            </>
          ) : null}
        </div>
      </a>

      {actions ?? (
        <a
          href={`/products/${slug}`}
          className="flex w-full items-center justify-center rounded-[7px] border border-brand-line bg-white py-2 text-[13px] font-semibold text-brand-ink transition hover:border-brand-green hover:text-brand-green-dark"
        >
          View details
        </a>
      )}
    </div>
  );
}
