import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { api, ApiError, type BatchOverview } from "@/lib/api";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function AdminBatchDetailPage() {
  const { batchId } = useParams();
  const [batch, setBatch] = useState<BatchOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!batchId) return;
    const r = await api.adminGetBatch(batchId);
    setBatch(r.batch);
  }, [batchId]);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed"))
      .finally(() => setLoading(false));
  }, [load]);

  const columns = useMemo<
    ColumnDef<BatchOverview["students"][number], unknown>[]
  >(
    () => [
      {
        accessorKey: "fullName",
        header: "Student",
        cell: ({ row }) => (
          <Link
            to={`/admin/students/${row.original.id}`}
            className="font-medium text-accent hover:underline"
          >
            {row.original.fullName}
          </Link>
        ),
      },
      { accessorKey: "email", header: "Email" },
      {
        accessorKey: "enrolledAt",
        header: "Enrolled",
        cell: ({ row }) => formatDate(row.original.enrolledAt),
      },
    ],
    [],
  );

  if (loading) {
    return <p className="text-ink-muted">Loading batch…</p>;
  }

  if (error || !batch) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-400">{error ?? "Batch not found"}</p>
        <Link to="/admin/batches" className="text-accent hover:underline">
          ← Batches
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={batch.name}
        description={batch.course?.title ?? "Batch overview"}
      />
      <Link to="/admin/batches" className="text-sm text-accent hover:underline">
        ← All batches
      </Link>

      <div className="grid gap-3 rounded-xl border border-border bg-surface-elevated p-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-muted">Seats</p>
          <p className="mt-1 text-lg font-semibold">
            {batch.seatsFilled}/{batch.seatCapacity} Seats filled
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-muted">Mode</p>
          <p className="mt-1 font-medium">{batch.deliveryMode}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-muted">Status</p>
          <p className="mt-1 font-medium">{batch.status}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-muted">Start</p>
          <p className="mt-1 font-medium">{formatDate(batch.startDate)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-muted">End</p>
          <p className="mt-1 font-medium">{formatDate(batch.endDate)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-muted">Teacher</p>
          <p className="mt-1 font-medium">{batch.teacher?.fullName ?? "Unassigned"}</p>
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <p className="text-xs uppercase tracking-wide text-ink-muted">Schedule</p>
          <p className="mt-1 font-medium">{batch.scheduleSummary || "—"}</p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold">Enrolled students</h2>
        <DataTable
          data={batch.students}
          columns={columns}
          filterPlaceholder="Search students…"
          emptyMessage="No students in this batch yet."
        />
      </div>
    </div>
  );
}
