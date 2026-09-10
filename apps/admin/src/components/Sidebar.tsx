"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../lib/auth-context";

const NAV_ITEMS = [
  { href: "/", icon: "🏠", label: "Dashboard" },
  {
    href: "/products",
    icon: "📦",
    label: "Products",
    subs: [["/products", "All Products"], ["/products/new", "Add Product"]] as const,
  },
  { href: "/categories", icon: "🏷️", label: "Categories & Brands" },
  { href: "/coupons", icon: "🎟️", label: "Coupons" },
  { href: "/offers", icon: "📣", label: "Offers" },
  { href: "/orders", icon: "🧾", label: "Orders" },
  { href: "/returns", icon: "↩️", label: "Returns" },
  { href: "/reviews", icon: "⭐", label: "Reviews" },
  { href: "/inventory", icon: "🗄️", label: "Inventory" },
  { href: "/vehicles", icon: "🚗", label: "Vehicles" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-screen w-[230px] flex-shrink-0 flex-col bg-brand-charcoal py-4 text-[#B7BBBE]">
      <div className="mb-2.5 flex items-center gap-2 border-b border-[#2A2E32] px-[18px] pb-4">
        <div className="rounded-lg bg-white px-2 py-1">
          <Image src="/logo.png" alt="Khalsa EV" width={1774} height={887} className="h-6 w-auto" priority />
        </div>
        <span className="text-xs text-[#9AA0A4]">Admin panel</span>
      </div>

      <div className="px-2.5 pt-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#6E7478]">Main</div>
      <nav className="flex-1 px-2">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-2.5 rounded-[6px] px-3 py-2.5 text-[12.8px] ${
                  active ? "border-r-[3px] border-brand-green bg-brand-green-dark text-white" : "hover:bg-[#1E2226]"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
              {active && item.subs
                ? item.subs.map(([href, label]) => (
                    <Link
                      key={href}
                      href={href}
                      className={`block px-11 py-1.5 text-xs ${pathname === href ? "font-bold text-brand-green" : "text-[#9AA0A4]"}`}
                    >
                      {label}
                    </Link>
                  ))
                : null}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-[#2A2E32] p-4">
        <div className="mb-3 px-1">
          <p className="text-[12.8px] font-semibold text-white">{user?.name}</p>
          <p className="text-xs text-[#9AA0A4]">{user?.role.replace(/_/g, " ")}</p>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="w-full rounded-[7px] border border-[#3A3D42] px-4 py-2 text-[12.5px] font-medium text-[#B7BBBE] transition hover:border-brand-red hover:text-brand-red"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
