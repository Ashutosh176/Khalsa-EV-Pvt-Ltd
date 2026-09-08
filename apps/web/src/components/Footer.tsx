"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Category } from "@khalsa-ev/types";
import { useAuth } from "../lib/auth-context";
import { getCategories } from "../lib/api";
import { TrustStrip } from "./TrustStrip";

export function Footer() {
  const { logout } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  return (
    <footer id="support">
      <div className="border-y border-brand-line">
        <TrustStrip />
      </div>

      <div className="bg-brand-charcoal pt-9 text-[#B7BBBE]">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-6 border-b border-[#2A2E32] px-4 pb-7 sm:px-7 md:grid-cols-3 lg:grid-cols-6 lg:gap-5">
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <div className="mb-2.5 inline-block rounded-xl bg-white px-2.5 py-1.5">
              <Image src="/logo.png" alt="Khalsa EV" width={292} height={162} className="h-8 w-auto" />
            </div>
            <p className="my-2 max-w-xs text-[11.3px] leading-relaxed">
              India&apos;s most trusted destination for genuine EV spare parts &amp; accessories.
            </p>
          </div>

          <div>
            <h5 className="mb-2.5 text-[12.5px] font-bold text-white">Shop</h5>
            <Link href="/products" className="block py-1 text-[11.3px] leading-[2] hover:text-white">
              All Products
            </Link>
            {categories.slice(0, 5).map((category) => (
              <Link
                key={category.id}
                href={`/products?categoryId=${category.id}`}
                className="block py-1 text-[11.3px] leading-[2] hover:text-white"
              >
                {category.name}
              </Link>
            ))}
          </div>

          <div>
            <h5 className="mb-2.5 text-[12.5px] font-bold text-white">Customer Service</h5>
            <Link href="/account/orders" className="block py-1 text-[11.3px] leading-[2] hover:text-white">
              Track Order
            </Link>
            <Link href="/account/returns" className="block py-1 text-[11.3px] leading-[2] hover:text-white">
              Returns &amp; Refunds
            </Link>
            <Link href="/find-parts" className="block py-1 text-[11.3px] leading-[2] hover:text-white">
              Vehicle Fitment
            </Link>
          </div>

          <div>
            <h5 className="mb-2.5 text-[12.5px] font-bold text-white">My Account</h5>
            <Link href="/account/orders" className="block py-1 text-[11.3px] leading-[2] hover:text-white">
              My Orders
            </Link>
            <Link href="/wishlist" className="block py-1 text-[11.3px] leading-[2] hover:text-white">
              Wishlist
            </Link>
            <Link href="/account/addresses" className="block py-1 text-[11.3px] leading-[2] hover:text-white">
              Addresses
            </Link>
            <Link href="/account/profile" className="block py-1 text-[11.3px] leading-[2] hover:text-white">
              Account Details
            </Link>
            <button type="button" onClick={() => void logout()} className="block py-1 text-left text-[11.3px] leading-[2] hover:text-white">
              Logout
            </button>
          </div>

          <div>
            <h5 className="mb-2.5 text-[12.5px] font-bold text-white">Company</h5>
            {["About Us", "Careers", "Become a Partner", "Terms & Conditions", "Privacy Policy"].map((item) => (
              <p key={item} className="py-1 text-[11.3px] leading-[2]">
                {item}
              </p>
            ))}
          </div>

          <div>
            <h5 className="mb-2.5 text-[12.5px] font-bold text-white">Contact Us</h5>
            <p className="py-1 text-[11.3px] leading-[2]">📞 1800-121-0259</p>
            <p className="py-1 text-[11.3px] leading-[2]">✉️ info@khalsaev.com</p>
            <p className="py-1 text-[11.3px] leading-[1.7]">
              📍 Plot no. 130/1 and 130/2, Pachenda Road, Village Mustafabad, Muzaffarnagar, UP - 251001
            </p>
          </div>
        </div>

        <div className="mx-auto flex max-w-[1440px] flex-col-reverse items-center gap-3 px-4 py-4 text-[11px] text-[#82888C] sm:flex-row sm:justify-between sm:px-7">
          <span>© {new Date().getFullYear()} Khalsa EV Spare Parts. All rights reserved.</span>
          <div className="flex gap-1.5">
            {["VISA", "MC", "UPI", "RuPay"].map((method) => (
              <span key={method} className="rounded-[3px] bg-white px-1.5 py-1 text-[9px] font-extrabold text-[#222]">
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
