"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function AdminTopbar({ placeholder = "Search products, orders..." }: { placeholder?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/products?search=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div className="flex items-center justify-between border-b border-brand-line bg-white px-6 py-3">
      <form onSubmit={handleSubmit} className="max-w-[420px] flex-1">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-[7px] border border-brand-line bg-brand-surface px-3 py-2 text-[12.5px] text-brand-ink outline-none placeholder:text-brand-sub"
        />
      </form>
    </div>
  );
}
