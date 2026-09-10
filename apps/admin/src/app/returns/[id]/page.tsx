"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { formatIndianRupees } from "@khalsa-ev/utils";
import { Button } from "@khalsa-ev/ui";
import { AdminShell } from "../../../components/AdminShell";
import { AdminTopbar } from "../../../components/AdminTopbar";
import { useAuth } from "../../../lib/auth-context";
import { getAdminReturn, updateReturnStatus } from "../../../lib/api";
import type { AdminReturnListItem, ReturnStatus } from "../../../lib/types";

// Mirrors apps/api/src/returns/return-status.ts - kept in sync manually.
// This only controls which buttons are shown; the backend is still the
// authoritative check on every request.
const NEXT_STATUSES: Record<ReturnStatus, ReturnStatus[]> = {
  REQUESTED: ["APPROVED", "REJECTED"],
  APPROVED: ["PICKED_UP"],
  PICKED_UP: ["RECEIVED"],
  RECEIVED: ["COMPLETED"],
  REJECTED: [],
  COMPLETED: [],
};

const STATUS_STYLES: Record<string, string> = {
  REQUESTED: "bg-[#E7F0FE] text-[#2563C6]",
  APPROVED: "bg-[#FFF3DF] text-[#B9770E]",
  PICKED_UP: "bg-[#FFF3DF] text-[#B9770E]",
  RECEIVED: "bg-[#FFF3DF] text-[#B9770E]",
  COMPLETED: "bg-[#E8F7EA] text-[#1F8A3B]",
  REJECTED: "bg-[#FDE8E7] text-[#D93429]",
};

function ReturnDetailContent({ id }: { id: string }) {
  const { accessToken } = useAuth();
  const [ret, setRet] = useState<AdminReturnListItem | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function reload() {
    if (!accessToken) return;
    getAdminReturn(accessToken, id)
      .then(setRet)
      .catch(() => setNotFound(true));
  }

  useEffect(reload, [accessToken, id]);

  async function handleStatusChange(nextStatus: ReturnStatus) {
    if (!accessToken) return;
    const requiresNote = nextStatus === "REJECTED";
    let adminNote: string | undefined;
    if (requiresNote) {
      adminNote = window.prompt(`Note for marking this return ${nextStatus}:`) ?? undefined;
      if (adminNote === undefined) return; // cancelled the prompt
    }

    setBusy(true);
    setError(null);
    try {
      const updated = await updateReturnStatus(accessToken, id, nextStatus, adminNote);
      setRet(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update return status");
    } finally {
      setBusy(false);
    }
  }

  if (notFound) {
    return (
      <div>
        <AdminTopbar />
        <p className="p-5 text-brand-sub">Return not found.</p>
      </div>
    );
  }

  if (!ret) {
    return (
      <div>
        <AdminTopbar />
        <p className="p-5 text-brand-sub">Loading...</p>
      </div>
    );
  }

  const nextStatuses = NEXT_STATUSES[ret.status];

  return (
    <div>
      <AdminTopbar />
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[21px] font-bold">
              Return for{" "}
              <Link href={`/orders/${ret.order.id}`} className="text-brand-green-dark">
                {ret.order.orderNumber}
              </Link>
            </h1>
            <p className="mt-1 text-[13px] text-brand-sub">
              Requested {new Date(ret.createdAt).toLocaleString("en-IN")} by {ret.user.name} ({ret.user.email})
            </p>
          </div>
          <span className={`rounded-full px-3 py-1.5 text-[13px] font-bold ${STATUS_STYLES[ret.status] ?? "bg-slate-100 text-slate-600"}`}>
            {ret.status.replace(/_/g, " ")}
          </span>
        </div>

        {error ? <p className="mt-4 rounded-[7px] bg-red-50 px-4 py-2.5 text-[12.5px] text-brand-red">{error}</p> : null}

        {nextStatuses.length > 0 ? (
          <div className="mt-3.5 flex flex-wrap gap-2">
            {nextStatuses.map((next) => (
              <Button
                key={next}
                variant={next === "REJECTED" ? "secondary" : "primary"}
                disabled={busy}
                onClick={() => handleStatusChange(next)}
              >
                Mark as {next.replace(/_/g, " ")}
              </Button>
            ))}
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <section className="rounded-[10px] border border-brand-line bg-white p-4">
            <b className="text-[15px]">Reason for return</b>
            <p className="mt-2 text-[12.5px] text-brand-sub">{ret.reason}</p>
          </section>

          <section className="h-fit rounded-[10px] border border-brand-line bg-white p-4">
            <b className="text-[15px]">Admin notes & refund</b>
            <p className="mt-2 text-[12.5px] text-brand-sub">{ret.adminNote ?? "No notes yet."}</p>

            <div className="mt-3.5 border-t border-brand-line pt-3.5 text-[12.5px]">
              {ret.refund ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-brand-sub">Refund amount</span>
                    <span className="font-bold">{formatIndianRupees(ret.refund.amount)}</span>
                  </div>
                  <div className="mt-1.5 flex justify-between">
                    <span className="text-brand-sub">Refund status</span>
                    <span className="font-semibold">{ret.refund.status}</span>
                  </div>
                </>
              ) : (
                <p className="text-brand-sub">
                  {ret.status === "COMPLETED"
                    ? "No refund on file for this return."
                    : "A refund is issued automatically via Razorpay once this return is marked Completed."}
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function ReturnDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AdminShell>
      <ReturnDetailContent id={id} />
    </AdminShell>
  );
}
