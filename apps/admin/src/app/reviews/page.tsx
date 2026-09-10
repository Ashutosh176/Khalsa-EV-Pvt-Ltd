"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "../../components/AdminShell";
import { AdminTopbar } from "../../components/AdminTopbar";
import { useAuth } from "../../lib/auth-context";
import { approveReview, deleteReview, getAdminReviews } from "../../lib/api";
import type { AdminReview } from "../../lib/types";

const STATUS_TABS = [
  ["", "All"],
  ["false", "Pending"],
  ["true", "Approved"],
] as const;

function Stars({ rating }: { rating: number }) {
  return <span className="text-amber-500">{"★".repeat(rating)}{"☆".repeat(5 - rating)}</span>;
}

function ReviewsContent() {
  const { accessToken } = useAuth();
  const [reviews, setReviews] = useState<AdminReview[] | null>(null);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<"" | "false" | "true">("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const pageSize = 20;

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    getAdminReviews(accessToken, {
      isApproved: statusFilter === "" ? undefined : statusFilter === "true",
      page,
      pageSize,
    })
      .then((result) => {
        if (cancelled) return;
        setReviews(result.items);
        setTotal(result.total);
      })
      .catch(() => {
        if (!cancelled) setReviews([]);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, statusFilter, page]);

  async function handleApprove(id: string) {
    if (!accessToken) return;
    setBusyId(id);
    try {
      await approveReview(accessToken, id);
      setReviews((prev) => (prev ?? []).map((r) => (r.id === id ? { ...r, isApproved: true } : r)));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!accessToken) return;
    setBusyId(id);
    try {
      await deleteReview(accessToken, id);
      setReviews((prev) => (prev ?? []).filter((r) => r.id !== id));
      setTotal((t) => t - 1);
    } finally {
      setBusyId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <AdminTopbar />
      <div className="p-5">
        <h1 className="text-[23px] font-bold">Reviews</h1>
        <p className="mt-0.5 text-[13px] text-brand-sub">Moderate customer reviews before they go live on product pages.</p>

        <div className="mt-4 rounded-[10px] border border-brand-line bg-white">
          <div className="flex gap-4 border-b border-brand-line px-4 py-2.5 text-[12.5px] font-semibold text-brand-sub">
            {STATUS_TABS.map(([value, label]) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setPage(1);
                  setStatusFilter(value);
                }}
                className={`pb-1.5 ${statusFilter === value ? "border-b-2 border-brand-green-dark text-brand-green-dark" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>

          <table className="dt w-full text-left text-[12.5px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-brand-sub">
                <th className="px-4 py-2.5 font-semibold">Product</th>
                <th className="px-4 py-2.5 font-semibold">Customer</th>
                <th className="px-4 py-2.5 font-semibold">Rating</th>
                <th className="px-4 py-2.5 font-semibold">Review</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews === null ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-brand-sub">
                    Loading...
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-brand-sub">
                    No reviews found.
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review.id} className="border-t border-[#EFF0F1] align-top">
                    <td className="px-4 py-2.5 font-bold text-brand-green-dark">
                      <Link href={`/products/${review.product.id}`}>{review.product.name}</Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <b>{review.user.name}</b>
                      <span className="block text-[11px] text-brand-sub">{review.user.email}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <Stars rating={review.rating} />
                    </td>
                    <td className="max-w-[320px] px-4 py-2.5">
                      {review.title ? <b className="block">{review.title}</b> : null}
                      {review.comment ? <span className="text-brand-sub">{review.comment}</span> : null}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${
                          review.isApproved ? "bg-[#E8F7EA] text-[#1F8A3B]" : "bg-[#FFF3DF] text-[#B9770E]"
                        }`}
                      >
                        {review.isApproved ? "APPROVED" : "PENDING"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-3">
                        {!review.isApproved ? (
                          <button
                            type="button"
                            disabled={busyId === review.id}
                            onClick={() => handleApprove(review.id)}
                            className="font-semibold text-brand-green-dark disabled:opacity-50"
                          >
                            Approve
                          </button>
                        ) : null}
                        <button
                          type="button"
                          disabled={busyId === review.id}
                          onClick={() => handleDelete(review.id)}
                          className="font-semibold text-brand-red disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between px-4 py-3 text-xs text-brand-sub">
            <span>Showing {reviews?.length ?? 0} of {total} reviews</span>
            {totalPages > 1 ? (
              <div className="flex gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setPage(pageNumber)}
                    className={`rounded-[6px] px-2.5 py-1 font-semibold ${
                      pageNumber === page ? "bg-brand-green text-white" : "border border-brand-line text-brand-ink"
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  return (
    <AdminShell>
      <ReviewsContent />
    </AdminShell>
  );
}
