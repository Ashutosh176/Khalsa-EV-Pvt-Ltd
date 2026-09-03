"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import { useCart } from "../lib/cart-context";
import { useNotifications } from "../lib/notifications-context";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-5 w-5">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M12 20.5s-7.5-4.6-9.8-9.3C.6 7.6 2.2 4 5.7 3.4c2-.35 3.9.6 5 2.2a5.6 5.6 0 0 1 5-2.2c3.5.6 5.1 4.2 3.5 7.8-2.3 4.7-9.8 9.3-9.8 9.3Z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <circle cx="9.5" cy="20.5" r="1.3" />
      <circle cx="17.5" cy="20.5" r="1.3" />
      <path d="M2.5 3.5h2l2.3 11.4a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6l1.4-7.4H6.2" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20c1.4-3.6 4.3-5.5 7.5-5.5s6.1 1.9 7.5 5.5" />
    </svg>
  );
}

const NAV_LINKS = [
  { href: "/products", label: "Shop all" },
  { href: "/find-parts", label: "Find my fitment" },
  { href: "/#categories", label: "Categories" },
  { href: "/#offers", label: "Offers" },
];

export function Header() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { unreadCount } = useNotifications();
  const router = useRouter();
  const [query, setQuery] = useState("");

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/products?search=${encodeURIComponent(trimmed)}` : "/products");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="hidden border-b border-slate-100 bg-brand-charcoal text-slate-200 sm:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-xs sm:px-6 lg:px-8">
          <span>Genuine EV spare parts, shipped across India</span>
          <a href="tel:18001210259" className="font-medium text-slate-100 hover:text-brand-green">
            Support: 1800-121-0259
          </a>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Image src="/logo.png" alt="Khalsa EV" width={292} height={162} className="h-10 w-auto" priority />
          <span className="hidden text-sm text-slate-500 md:block">Genuine spare parts</span>
        </Link>

        <form onSubmit={handleSearch} className="hidden flex-1 items-center md:flex">
          <div className="flex w-full items-center rounded-full border border-slate-200 bg-slate-50 pl-4 pr-1.5 py-1 transition focus-within:border-brand-green focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-green/15">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search batteries, controllers, brakes, lights..."
              className="w-full bg-transparent py-1.5 text-sm outline-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              aria-label="Search"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-green text-white transition hover:bg-[#2f8c13]"
            >
              <SearchIcon />
            </button>
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link
            href="/wishlist"
            className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:flex"
          >
            <HeartIcon />
            <span className="hidden lg:inline">Wishlist</span>
          </Link>

          <Link
            href="/cart"
            className="relative flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            <CartIcon />
            <span className="hidden lg:inline">Cart</span>
            {cart && cart.itemCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-green px-1 text-[10px] font-bold text-white">
                {cart.itemCount}
              </span>
            ) : null}
          </Link>

          {user ? (
            <>
              <Link
                href="/account"
                className="relative flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                <UserIcon />
                <span className="hidden lg:inline">Account</span>
                {unreadCount > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                ) : null}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="hidden rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-red-300 hover:text-red-500 sm:inline-flex"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-full bg-brand-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2f8c13]"
            >
              <UserIcon />
              <span className="hidden sm:inline">Log in</span>
            </Link>
          )}
        </div>
      </div>

      <form onSubmit={handleSearch} className="border-t border-slate-100 px-4 py-2 md:hidden">
        <div className="flex w-full items-center rounded-full border border-slate-200 bg-slate-50 pl-4 pr-1.5 py-1">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search parts..."
            className="w-full bg-transparent py-1.5 text-sm outline-none placeholder:text-slate-400"
          />
          <button type="submit" aria-label="Search" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-green text-white">
            <SearchIcon />
          </button>
        </div>
      </form>

      <nav className="hidden border-t border-slate-100 lg:block">
        <div className="mx-auto flex max-w-7xl items-center gap-7 px-4 py-2.5 text-sm font-medium text-slate-600 sm:px-6 lg:px-8">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-brand-green">
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
