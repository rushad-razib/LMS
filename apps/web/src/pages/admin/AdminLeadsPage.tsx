import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { api, type Lead, ApiError } from "@/lib/api";
import { toast } from "@/lib/toast";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";

export function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Lead | null>(null);

  async function load() {
    const r = await api.adminListLeads();
    setLeads(r.leads);
  }

  useEffect(() => {
    load().catch((err) =>
      setLoadError(err instanceof ApiError ? err.message : "Failed"),
    );
  }, []);

  const columns = useMemo<ColumnDef<Lead>[]>(
    () => [
      { accessorKey: "name", header: "Name" },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "subject", header: "Subject" },
      {
        accessorKey: "readAt",
        header: "Status",
        cell: ({ row }) => (row.original.readAt ? "Read" : "Unread"),
      },
      {
        accessorKey: "createdAt",
        header: "Received",
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <button
              type="button"
              className="text-sm text-accent"
              onClick={() => setSelected(row.original)}
            >
              View
            </button>
            {!row.original.readAt ? (
              <button
                type="button"
                className="text-sm text-ink-muted"
                onClick={async () => {
                  await api.adminMarkLeadRead(row.original.id);
                  toast.success("Marked read");
                  await load();
                }}
              >
                Mark read
              </button>
            ) : null}
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <PageHeader title="Leads" description="Contact form submissions." />
      {loadError ? <p className="text-sm text-red-400">{loadError}</p> : null}
      <DataTable columns={columns} data={leads} filterPlaceholder="Search leads…" />
      {selected ? (
        <div className="rounded-xl border border-border bg-surface-elevated p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-semibold">{selected.subject}</h2>
              <p className="text-sm text-ink-muted">
                {selected.name} · {selected.email}
                {selected.phone ? ` · ${selected.phone}` : ""}
              </p>
            </div>
            <button
              type="button"
              className="text-sm text-ink-muted"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm">{selected.message}</p>
        </div>
      ) : null}
    </div>
  );
}
