"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "../../components/AdminShell";
import { AdminTopbar } from "../../components/AdminTopbar";
import { useAuth } from "../../lib/auth-context";
import { getAuditLog } from "../../lib/api";
import type { AuditLogEntry } from "../../lib/types";

function MetadataCell({ metadata }: { metadata: Record<string, unknown> | null }) {
  const [expanded, setExpanded] = useState(false);
  if (!metadata || Object.keys(metadata).length === 0) return <span className="text-brand-sub">-</span>;

  return (
    <button type="button" onClick={() => setExpanded((v) => !v)} className="text-left">
      {expanded ? (
        <pre className="max-w-[320px] whitespace-pre-wrap break-words rounded-[6px] bg-brand-surface p-2 text-[11px]">
          {JSON.stringify(metadata, null, 2)}
        </pre>
      ) : (
        <span className="font-semibold text-brand-green-dark">View details</span>
      )}
    </button>
  );
}

function AuditLogContent() {
  const { accessToken } = useAuth();
  const [entries, setEntries] = useState<AuditLogEntry[] | null>(null);
  const [total, setTotal] = useState(0);
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 30;

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    getAuditLog(accessToken, { entityType: entityTypeFilter || undefined, page, pageSize })
      .then((result) => {
        if (cancelled) return;
        setEntries(result.items);
        setTotal(result.total);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, entityTypeFilter, page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <AdminTopbar />
      <div className="p-5">
        <h1 className="text-[23px] font-bold">Audit Log</h1>
        <p className="mt-0.5 text-[13px] text-brand-sub">A record of every admin action taken in this panel.</p>

        <div className="mt-4 rounded-[10px] border border-brand-line bg-white">
          <div className="border-b border-brand-line p-3.5">
            <input
              type="text"
              placeholder="Filter by entity type (e.g. Coupons, AdminUsers, Products)..."
              value={entityTypeFilter}
              onChange={(e) => {
                setPage(1);
                setEntityTypeFilter(e.target.value);
              }}
              className="w-full max-w-sm rounded-[7px] border border-brand-line px-3 py-2 text-[12.5px] outline-none focus:border-brand-green"
            />
          </div>

          <table className="dt w-full text-left text-[12.5px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-brand-sub">
                <th className="px-4 py-2.5 font-semibold">When</th>
                <th className="px-4 py-2.5 font-semibold">Admin</th>
                <th className="px-4 py-2.5 font-semibold">Action</th>
                <th className="px-4 py-2.5 font-semibold">Entity</th>
                <th className="px-4 py-2.5 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {entries === null ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-brand-sub">
                    Loading...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-brand-sub">
                    No audit log entries found.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="border-t border-[#EFF0F1] align-top">
                    <td className="px-4 py-2.5 whitespace-nowrap text-brand-sub">
                      {new Date(entry.createdAt).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-2.5">
                      <b>{entry.adminUser.name}</b>
                      <span className="block text-[11px] text-brand-sub">{entry.adminUser.email}</span>
                    </td>
                    <td className="px-4 py-2.5 font-bold">{entry.action}</td>
                    <td className="px-4 py-2.5 text-brand-sub">
                      {entry.entityType}
                      {entry.entityId ? <span className="block text-[10.5px]">{entry.entityId}</span> : null}
                    </td>
                    <td className="px-4 py-2.5">
                      <MetadataCell metadata={entry.metadata} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between px-4 py-3 text-xs text-brand-sub">
            <span>Showing {entries?.length ?? 0} of {total} entries</span>
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

export default function AuditLogPage() {
  return (
    <AdminShell>
      <AuditLogContent />
    </AdminShell>
  );
}
