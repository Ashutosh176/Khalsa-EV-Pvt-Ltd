"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Brand, Category } from "@khalsa-ev/types";
import { useAuth } from "../lib/auth-context";
import { useCart } from "../lib/cart-context";
import { getBrands, getCategories } from "../lib/api";

const TRUST_ITEMS = ["100% Genuine Parts", "7 Days Easy Returns", "Fast Delivery Across India", "Secure Payment"];

// The site's two top-level product sections (Section 60) - kept as distinct
// route trees (see apps/web/src/app/electric-scooters/*) rather than one
// page conditionally re-skinned, so each can carry its own home/listing/
// detail pages and nav while Cart/Wishlist/Account/Search stay global.
const ELECTRIC_SCOOTERS_ROOT = "/electric-scooters";

// Electric Scooters first (left), Spare Parts second (right) - order here is
// the only thing that decides left-to-right position in the pill below.
const SECTION_TABS = [
  { href: ELECTRIC_SCOOTERS_ROOT, icon: "🛵", label: "Electric Scooters", tagline: "Ride the Future" },
  { href: "/", icon: "⚙️", label: "Spare Parts", tagline: "Keep Your Ride Running" },
] as const;

export function Header() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const isScooterSection = pathname.startsWith(ELECTRIC_SCOOTERS_ROOT);
  const [query, setQuery] = useState("");
  // Holds a categoryId in the Spare Parts section, a brandId in the
  // Electric Scooters one - scooters have no category taxonomy of their
  // own (Section 60), brand is the equivalent filter there.
  const [filterId, setFilterId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [scooterBrands, setScooterBrands] = useState<Brand[]>([]);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
    getBrands({ productType: "SCOOTER" })
      .then(setScooterBrands)
      .catch(() => setScooterBrands([]));
  }, []);

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("search", query.trim());
    if (isScooterSection) {
      if (filterId) params.set("brandId", filterId);
      router.push(`${ELECTRIC_SCOOTERS_ROOT}/products${params.toString() ? `?${params.toString()}` : ""}`);
    } else {
      if (filterId) params.set("categoryId", filterId);
      router.push(`/products${params.toString() ? `?${params.toString()}` : ""}`);
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-white">
      <div className="hidden bg-brand-charcoal text-[#C9CDD0] sm:block">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-7 py-[7px] text-[11.5px]">
          <div className="flex gap-5">
            {TRUST_ITEMS.map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold text-brand-green">✓</span>
                {item}
              </span>
            ))}
          </div>
          <div className="flex gap-[18px]">
            <a href="tel:18001210259" className="hover:text-white">
              📞 1800-121-0259
            </a>
            <a href="mailto:infor@khalsaev.com" className="hover:text-white">
              ✉️ info@khalsaev.com
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1440px] items-center gap-[22px] border-b border-brand-line px-4 py-3.5 sm:px-7">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image src="/logo.png" alt="Khalsa EV" width={292} height={162} className="h-[48px] w-[103.8px]" priority />
        </Link>

        <form onSubmit={handleSearch} className="hidden w-[560px] md:ml-auto md:flex">
          <select
            value={filterId}
            onChange={(e) => setFilterId(e.target.value)}
            className="w-[160px] shrink-0 truncate rounded-l-lg border border-r-0 border-brand-line bg-brand-surface px-2.5 text-[13px] text-brand-sub outline-none"
          >
            <option value="">{isScooterSection ? "All Brands" : "All Categories"}</option>
            {(isScooterSection ? scooterBrands : categories).map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isScooterSection ? "Search for scooters, brands..." : "Search for parts, accessories, brand..."}
            className="flex-1 border-y border-brand-line px-3 py-1.5 text-[13px] outline-none"
          />
          <button
            type="submit"
            className="rounded-r-lg bg-brand-green px-5 text-[13px] font-semibold text-white transition hover:bg-brand-green-dark"
          >
            Search
          </button>
        </form>

        <div className="flex shrink-0 items-center gap-[23px]">
          <Link href="/account/orders" className="hidden items-center gap-1.5 text-[13.8px] text-brand-ink lg:flex">
            <span className="text-[20.4px] leading-none">🚚</span>
            Track Order
          </Link>
          <Link href="/wishlist" className="hidden items-center gap-1.5 text-[13.8px] text-brand-ink sm:flex">
            <span className="text-[20.4px] leading-none">💗</span>
            Wishlist
          </Link>
          <Link href="/cart" className="relative flex items-center gap-1.5 text-[13.8px] text-brand-ink">
            <span className="text-[20.4px] leading-none">🛒</span>
            Cart
            {cart && cart.itemCount > 0 ? (
              <span className="absolute -right-2.5 -top-1.5 flex h-[15px] w-[15px] items-center justify-center rounded-full bg-brand-green text-[9px] font-bold text-white">
                {cart.itemCount}
              </span>
            ) : null}
          </Link>

          {user ? (
            <div className="flex items-center gap-[12.5px]">
              <Link href="/account" className="flex items-center gap-1.5 text-[13.8px] text-brand-ink">
                <span className="text-[20.4px] leading-none">👤</span>
                <span>My Account</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="hidden rounded-[7px] border border-brand-line px-3 py-1.5 text-[11.5px] font-semibold text-brand-sub transition hover:border-brand-red hover:text-brand-red sm:inline-flex"
              >
                Log out
              </button>
            </div>
          ) : (
            <Link href="/login" className="flex flex-col items-center gap-0.5 text-[11px] text-brand-ink">
              <span className="text-[17px] leading-none">👤</span>
              Login / Register
            </Link>
          )}
        </div>
      </div>

      <div className="border-b border-brand-line py-1">
        <div className="mx-auto flex max-w-[1440px] items-center justify-center gap-3 px-4 sm:px-7">
          <div className="hidden flex-1 items-center gap-2 lg:flex">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-brand-green/50" />
            <span className="whitespace-nowrap text-[8px] font-bold uppercase tracking-[0.16em] text-brand-green-dark/70">
              A Greener Tomorrow
            </span>
          </div>

          <div className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-brand-green/35 bg-white p-[2.5px] shadow-[0_1px_5px_rgba(20,83,45,0.15)]">
            {SECTION_TABS.map((tab) => {
              const active = tab.href === ELECTRIC_SCOOTERS_ROOT ? isScooterSection : !isScooterSection;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-w-[130px] items-center justify-center gap-2 rounded-full px-2.5 py-[2.5px] transition-all duration-300 sm:min-w-[152px] sm:px-3.5 ${
                    active ? "bg-brand-green-dark shadow-[0_1px_4px_rgba(22,101,52,0.4)]" : "hover:bg-brand-surface"
                  }`}
                >
                  <span className="text-[16px] leading-none sm:text-[19px]">{tab.icon}</span>
                  <span className="flex flex-col items-start leading-none">
                    <span
                      className={`text-[12px] font-bold leading-none transition-colors duration-300 sm:text-[13.5px] ${
                        active ? "text-white" : "text-brand-ink"
                      }`}
                    >
                      {tab.label}
                    </span>
                    <span
                      className={`mt-[1.5px] text-[8px] font-medium leading-none transition-colors duration-300 sm:text-[9.5px] ${
                        active ? "text-white/85" : "text-brand-sub"
                      }`}
                    >
                      {tab.tagline}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="hidden flex-1 items-center gap-2 lg:flex">
            <span className="whitespace-nowrap text-[8px] font-bold uppercase tracking-[0.16em] text-brand-green-dark/70">
              Parts For Today
            </span>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-brand-green/50" />
          </div>
        </div>
      </div>

      <form onSubmit={handleSearch} className="border-b border-brand-line px-4 py-2 md:hidden">
        <div className="flex w-full items-center rounded-lg border border-brand-line">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isScooterSection ? "Search scooters..." : "Search parts..."}
            className="flex-1 rounded-l-lg px-3 py-1.5 text-[13px] outline-none"
          />
          <button type="submit" className="rounded-r-lg bg-brand-green px-4 py-1.5 text-[13px] font-semibold text-white">
            Search
          </button>
        </div>
      </form>
    </header>
  );
}
