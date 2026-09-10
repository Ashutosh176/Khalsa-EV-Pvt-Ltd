"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "../../components/AdminShell";
import { AdminTopbar } from "../../components/AdminTopbar";
import { useAuth } from "../../lib/auth-context";
import { getAdminReturns } from "../../lib/api";
import type { AdminReturnListItem } from "../../lib/types";

const STATUS_TABS = [
  ["", "All Returns"],
  ["REQUESTED", "Requested"],
  ["APPROVED", "Approved"],
  ["PICKED_UP", "Picked Up"],
  ["RECEIVED", "Received"],
  ["COMPLETED", "Completed"],
  ["REJECTED", "Rejected"],
] as const;

const STATUS_STYLES: Record<string, string> = {
  REQUESTED: "bg-[#E7F0FE] text-[#2563C6]",
  APPROVED: "bg-[#FFF3DF] text-[#B9770E]",
  PICKED_UP: "bg-[#FFF3DF] text-[#B9770E]",
  RECEIVED: "bg-[#FFF3DF] text-[#B9770E]",
  COMPLETED: "bg-[#E8F7EA] text-[#1F8A3B]",
  REJECTED: "bg-[#FDE8E7] text-[#D93429]",
};

function ReturnsContent() {
  const { accessToken } = useAuth();
  const [returns, setReturns] = useState<AdminReturnListItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    getAdminReturns(accessToken, { search, status: status || undefined, page, pageSize })
      .then((result) => {
        if (cancelled) return;
        setReturns(result.items);
        setTotal(result.total);
      })
      .catch(() => {
        if (!cancelled) setReturns([]);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, search, status, page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = returns && returns.length > 0 ? (page - 1) * pageSize + 1 : 0;
  const rangeEnd = returns ? (page - 1) * pageSize + returns.length : 0;

  return (
    <div>
      <AdminTopbar placeholder="Search returns, customers, orders..." />

      <div className="p-5">
        <h1 className="text-[23px] font-bold">Returns Management</h1>
        <p className="mt-0.5 text-[13px] text-brand-sub">Review and process customer return requests.</p>

        <div className="mt-4 rounded-[10px] border border-brand-line bg-white">
          <div className="flex gap-4 overflow-x-auto border-b border-brand-line px-4 py-2.5 text-[12.5px] font-semibold text-brand-sub">
            {STATUS_TABS.map(([value, label]) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setPage(1);
                  setStatus(value);
                }}
                className={`shrink-0 whitespace-nowrap pb-1.5 ${
                  status === value ? "border-b-2 border-brand-green-dark text-brand-green-dark" : ""
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-2.5 border-b border-brand-line p-3.5">
            <input
              type="search"
              placeholder="Search by Order ID, Customer, Email..."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="flex-1 rounded-[7px] border border-brand-line px-3 py-2 text-[12.5px] outline-none focus:border-brand-green"
            />
          </div>

          <table className="dt w-full text-left text-[12.5px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-brand-sub">
                <th className="px-4 py-2.5 font-semibold">Order ID</th>
                <th className="px-4 py-2.5 font-semibold">Customer</th>
                <th className="px-4 py-2.5 font-semibold">Reason</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold">Requested</th>
              </tr>
            </thead>
            <tbody>
              {returns === null ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-brand-sub">
                    Loading...
                  </td>
                </tr>
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-brand-sub">
                    No returns found.
                  </td>
                </tr>
              ) : (
                returns.map((r) => (
                  <tr key={r.id} className="border-t border-[#EFF0F1] hover:bg-brand-surface">
                    <td className="px-4 py-2.5 font-bold text-brand-green-dark">
                      <Link href={`/returns/${r.id}`}>{r.order.orderNumber}</Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <b>{r.user.name}</b>
                      <span className="block text-[11px] text-brand-sub">{r.user.email}</span>
                    </td>
                    <td className="max-w-[260px] truncate px-4 py-2.5">{r.reason}</td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${STATUS_STYLES[r.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {r.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-brand-sub">{new Date(r.createdAt).toLocaleDateString("en-IN")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between px-4 py-3 text-xs text-brand-sub">
            <span>
              Showing {rangeStart} to {rangeEnd} of {total} returns
            </span>
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

export default function ReturnsPage() {
  return (
    <AdminShell>
      <ReturnsContent />
    </AdminShell>
  );
}
