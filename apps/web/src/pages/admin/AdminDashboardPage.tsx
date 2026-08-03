export function AdminDashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-semibold">Admin dashboard</h1>
      <p className="text-ink-muted">
        Dark dashboard shell shared with Teacher. Modules land in Phases 2–6.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {["Students", "Orders", "Batches"].map((label) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-surface-elevated p-4"
          >
            <p className="text-sm text-ink-muted">{label}</p>
            <p className="mt-1 font-display text-2xl font-semibold">—</p>
          </div>
        ))}
      </div>
    </div>
  );
}
