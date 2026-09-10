"use client";

import { useState, type ReactNode } from "react";

export function ProductTabs({ tabs }: { tabs: { label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(0);
  if (tabs.length === 0) return null;

  return (
    <div>
      <div className="flex gap-6 overflow-x-auto border-b border-brand-line text-[13px] font-semibold text-brand-sub">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setActive(i)}
            className={`shrink-0 whitespace-nowrap pb-2.5 ${
              i === active
                ? "border-b-2 border-[var(--accent-dark,var(--color-brand-green-dark))] text-[var(--accent-dark,var(--color-brand-green-dark))]"
                : ""
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="pt-4">{tabs[active]?.content}</div>
    </div>
  );
}
