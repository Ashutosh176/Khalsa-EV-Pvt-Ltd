"use client";

import { useState } from "react";
import type { ProductImage } from "@khalsa-ev/types";

export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex];

  return (
    <div className="flex gap-2.5">
      {images.length > 1 ? (
        <div className="flex flex-col gap-2">
          {images.slice(0, 5).map((image, i) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`h-[52px] w-[52px] overflow-hidden rounded-lg border ${
                i === activeIndex ? "border-brand-green" : "border-brand-line"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- product images are remote */}
              <img src={image.url} alt={image.altText ?? name} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex h-[300px] flex-1 items-center justify-center overflow-hidden rounded-lg border border-brand-line bg-gradient-to-br from-[#F2F4F1] to-[#E4E9E3]">
        {active ? (
          // eslint-disable-next-line @next/next/no-img-element -- product images are remote
          <img src={active.url} alt={active.altText ?? name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-8xl">🔧</span>
        )}
      </div>
    </div>
  );
}
