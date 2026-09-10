"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@khalsa-ev/ui";
import type { ProductReviewsSummary } from "@khalsa-ev/types";
import { useAuth } from "../lib/auth-context";
import { createReview } from "../lib/api";

function Stars({ rating, onSelect }: { rating: number; onSelect?: (value: number) => void }) {
  const rounded = Math.round(rating);
  return (
    <span className="text-amber-500">
      {[1, 2, 3, 4, 5].map((value) =>
        onSelect ? (
          <button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            className="text-lg leading-none"
            aria-label={`Rate ${value} out of 5`}
          >
            {value <= rating ? "★" : "☆"}
          </button>
        ) : (
          <span key={value}>{value <= rounded ? "★" : "☆"}</span>
        ),
      )}
    </span>
  );
}

function ReviewForm({ productId, onSubmitted }: { productId: string; onSubmitted: () => void }) {
  const { accessToken } = useAuth();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accessToken || rating === 0) return;
    setError(null);
    setSubmitting(true);
    try {
      await createReview(accessToken, { productId, rating, title: title || undefined, comment: comment || undefined });
      setSuccess(true);
      setRating(0);
      setTitle("");
      setComment("");
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your review");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <p className="rounded-[10px] border border-dashed border-brand-line p-4 text-[12.5px] text-brand-sub">
        Thanks for your review! It&apos;ll appear here once our team approves it.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[10px] border border-brand-line p-4">
      <b className="text-[13px]">Write a review</b>

      {error ? <p className="mt-2.5 rounded-[7px] bg-red-50 px-3.5 py-2 text-[12px] text-brand-red">{error}</p> : null}

      <div className="mt-3">
        <span className="block text-[12px] font-medium text-brand-sub">Your rating</span>
        <Stars rating={rating} onSelect={setRating} />
      </div>

      <label className="mt-3 block">
        <span className="text-[12px] font-medium text-brand-sub">Title (optional)</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          className="mt-1 w-full rounded-[7px] border border-brand-line px-3 py-2 text-[12.5px] outline-none focus:border-brand-blue"
        />
      </label>

      <label className="mt-3 block">
        <span className="text-[12px] font-medium text-brand-sub">Comment (optional)</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={2000}
          className="mt-1 w-full rounded-[7px] border border-brand-line px-3 py-2 text-[12.5px] outline-none focus:border-brand-blue"
        />
      </label>

      <Button type="submit" disabled={submitting || rating === 0} className="mt-3">
        {submitting ? "Submitting..." : "Submit review"}
      </Button>
    </form>
  );
}

export function ProductReviews({ productId, initial: summary }: { productId: string; initial: ProductReviewsSummary }) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Stars rating={summary.averageRating} />
          <span className="text-[13px] font-bold">{summary.averageRating.toFixed(1)}</span>
          <span className="text-[12px] text-brand-sub">
            ({summary.totalCount} {summary.totalCount === 1 ? "review" : "reviews"})
          </span>
        </div>
        {user && !showForm ? (
          <button type="button" onClick={() => setShowForm(true)} className="text-[12.5px] font-semibold text-brand-blue-dark">
            + Write a review
          </button>
        ) : null}
      </div>

      {!user ? (
        <p className="text-[12.5px] text-brand-sub">
          <Link href="/login" className="font-semibold text-brand-blue-dark">
            Log in
          </Link>{" "}
          to write a review of a product you&apos;ve purchased.
        </p>
      ) : showForm ? (
        <ReviewForm productId={productId} onSubmitted={() => setShowForm(false)} />
      ) : null}

      {summary.items.length === 0 ? (
        <p className="text-[12.5px] text-brand-sub">No reviews yet - be the first to share your experience.</p>
      ) : (
        <div className="space-y-3.5">
          {summary.items.map((review) => (
            <div key={review.id} className="border-b border-brand-line pb-3.5 last:border-0">
              <div className="flex items-center gap-2">
                <Stars rating={review.rating} />
                {review.title ? <b className="text-[13px]">{review.title}</b> : null}
              </div>
              <p className="mt-1 text-[11.5px] text-brand-sub">
                {review.user.name} &middot; {new Date(review.createdAt).toLocaleDateString("en-IN")}
              </p>
              {review.comment ? <p className="mt-1.5 text-[12.5px] text-brand-ink">{review.comment}</p> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
