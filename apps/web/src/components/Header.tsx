"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@khalsa-ev/ui";
import { useAuth } from "../lib/auth-context";
import { useCart } from "../lib/cart-context";

export function Header() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-green text-lg font-black text-white">
            K
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-brand-green">Khalsa EV</div>
            <div className="text-sm text-slate-500">Genuine spare parts</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-700 lg:flex">
          <Link href="/products">Shop</Link>
          <Link href="/#categories">Categories</Link>
          <Link href="/find-parts">Find parts</Link>
          <Link href="/#offers">Offers</Link>
          <Link href="/#support">Support</Link>
        </nav>

        <div className="flex items-center gap-2">
          <button className="hidden rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 sm:inline-flex">
            Search
          </button>
          <Link href="/wishlist">
            <Button variant="secondary">Wishlist</Button>
          </Link>
          <Link href="/cart">
            <Button>Cart{cart && cart.itemCount > 0 ? ` (${cart.itemCount})` : ""}</Button>
          </Link>
          {user ? (
            <>
              <Link
                href="/account"
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-brand-green hover:text-brand-green"
              >
                Account
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-red-300 hover:text-red-500"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
            >
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
