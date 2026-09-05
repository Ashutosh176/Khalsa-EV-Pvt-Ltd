"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Category } from "@khalsa-ev/types";
import { useAuth } from "../lib/auth-context";
import { useCart } from "../lib/cart-context";
import { useNotifications } from "../lib/notifications-context";
import { getCategories } from "../lib/api";

const TRUST_ITEMS = ["100% Genuine Parts", "7 Days Easy Returns", "Fast Delivery Across India", "Secure Payment"];

export function Header() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { unreadCount } = useNotifications();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("search", query.trim());
    if (categoryId) params.set("categoryId", categoryId);
    router.push(`/products${params.toString() ? `?${params.toString()}` : ""}`);
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
              ✉️ infor@khalsaev.com
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1440px] items-center gap-[22px] border-b border-brand-line px-4 py-3.5 sm:px-7">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image src="/logo.png" alt="Khalsa EV" width={292} height={162} className="h-[48px] w-auto" priority />
        </Link>

        <form onSubmit={handleSearch} className="hidden w-[560px] md:ml-auto md:flex">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-[160px] shrink-0 truncate rounded-l-lg border border-r-0 border-brand-line bg-brand-surface px-2.5 text-[13px] text-brand-sub outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for parts, accessories, brand..."
            className="flex-1 border-y border-brand-line px-3 py-2.5 text-[13px] outline-none"
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
              <Link href="/account" className="relative flex items-center gap-1.5 text-[13.8px] text-brand-ink">
                <span className="text-[20.4px] leading-none">👤</span>
                <span>My Account</span>
                {unreadCount > 0 ? (
                  <span className="absolute -right-2.5 -top-1.5 flex h-[15px] w-[15px] items-center justify-center rounded-full bg-brand-red text-[9px] font-bold text-white">
                    {unreadCount}
                  </span>
                ) : null}
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

      <form onSubmit={handleSearch} className="border-b border-brand-line px-4 py-2 md:hidden">
        <div className="flex w-full items-center rounded-lg border border-brand-line">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search parts..."
            className="flex-1 rounded-l-lg px-3 py-2 text-[13px] outline-none"
          />
          <button type="submit" className="rounded-r-lg bg-brand-green px-4 py-2 text-[13px] font-semibold text-white">
            Search
          </button>
        </div>
      </form>

      <nav className="hidden border-b border-brand-line lg:block">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-end gap-[22px] px-7 py-3 text-[12.8px] font-semibold text-[#33373A]">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?categoryId=${category.id}`}
              className="whitespace-nowrap transition hover:text-brand-green-dark"
            >
              {category.name}
            </Link>
          ))}
          <Link href="/#offers" className="whitespace-nowrap text-brand-red">
            Offers
          </Link>
        </div>
      </nav>
    </header>
  );
}
