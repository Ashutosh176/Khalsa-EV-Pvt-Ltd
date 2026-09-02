"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../lib/auth-context";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/orders", label: "Orders" },
  { href: "/inventory", label: "Inventory" },
  { href: "/vehicles", label: "Vehicles" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-green text-lg font-black text-white">
          K
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-brand-green">Khalsa EV</div>
          <div className="text-sm text-slate-500">Admin panel</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                active ? "bg-brand-green/10 text-brand-green" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="mb-3 px-1">
          <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
          <p className="text-xs text-slate-500">{user?.role.replace(/_/g, " ")}</p>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-red-300 hover:text-red-500"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
