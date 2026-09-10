"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../lib/auth-context";

const LINKS = [
  { href: "/account", icon: "🏠", label: "Dashboard" },
  { href: "/account/orders", icon: "📦", label: "My Orders" },
  { href: "/wishlist", icon: "♡", label: "Wishlist" },
  { href: "/account/addresses", icon: "📍", label: "Addresses" },
  { href: "/account/profile", icon: "👤", label: "Account Details" },
  { href: "/account/returns", icon: "↩️", label: "Returns & Refunds" },
  { href: "/account/notifications", icon: "🔔", label: "Notifications" },
];

export function AccountNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <div className="lg:w-[230px] lg:shrink-0">
      {user ? (
        <div className="mb-2 rounded-[10px] border border-brand-line p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-brand-blue-light text-lg">👤</div>
            <div>
              <b className="text-[12.8px]">{user.name}</b>
              <div className="text-[10.8px] text-brand-sub">{user.email}</div>
            </div>
          </div>
        </div>
      ) : null}

      <nav className="flex gap-1.5 overflow-x-auto lg:flex-col lg:overflow-visible">
        {LINKS.map((link) => {
          const active = link.href === "/account" ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-[7px] px-3.5 py-2.5 text-[12.5px] transition ${
                active ? "bg-brand-blue-light font-bold text-brand-blue-dark" : "text-[#3A3E42] hover:bg-brand-surface"
              }`}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={handleLogout}
          className="flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-[7px] px-3.5 py-2.5 text-left text-[12.5px] text-brand-red"
        >
          <span>↪</span>
          Logout
        </button>
      </nav>
    </div>
  );
}
