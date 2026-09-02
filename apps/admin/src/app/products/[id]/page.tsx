"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@khalsa-ev/ui";
import { AdminShell } from "../../../components/AdminShell";
import { useAuth } from "../../../lib/auth-context";
import { archiveProduct, getAdminProduct } from "../../../lib/api";
import type { AdminProduct } from "../../../lib/types";
import { ProductForm } from "../ProductForm";
import { CompatibilityManager } from "./CompatibilityManager";

function ProductEditContent({ id }: { id: string }) {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    getAdminProduct(accessToken, id)
      .then((result) => {
        if (!cancelled) setProduct(result);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, id]);

  async function handleArchive() {
    if (!accessToken || !product) return;
    if (!window.confirm(`Archive "${product.name}"? It will no longer be sold.`)) return;
    const updated = await archiveProduct(accessToken, product.id);
    setProduct(updated);
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-slate-500">Product not found.</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  const stock = product.inventory.reduce((sum, row) => sum + row.currentStock - row.reservedStock, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">{product.name}</h1>
          <p className="mt-1 text-slate-500">
            {stock} in stock ·{" "}
            <button type="button" onClick={() => router.push("/inventory")} className="text-brand-green hover:underline">
              adjust in Inventory
            </button>
          </p>
        </div>
        {product.status !== "ARCHIVED" ? (
          <Button variant="secondary" onClick={handleArchive}>
            Archive
          </Button>
        ) : null}
      </div>

      <div className="mt-6">
        <ProductForm mode="edit" product={product} />
      </div>

      <div className="mt-6">
        <CompatibilityManager productId={product.id} />
      </div>
    </div>
  );
}

export default function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AdminShell>
      <ProductEditContent id={id} />
    </AdminShell>
  );
}
