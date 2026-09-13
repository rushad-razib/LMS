import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError, type StudentOrderRow } from "@/lib/api";

export function StudentOrdersPage() {
  const [orders, setOrders] = useState<StudentOrderRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .myOrders()
      .then((r) => setOrders(r.orders))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Failed to load"),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Orders</h1>
        <p className="mt-1 text-ink-muted">Your purchase and enrollment history.</p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-ink-muted">Loading…</p>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface-elevated p-6">
          <p className="text-ink-muted">No orders yet.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li
              key={o.id}
              className="rounded-xl border border-border bg-surface-elevated p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold">
                    {o.course.title}
                  </h2>
                  <p className="mt-1 text-sm text-ink-muted">
                    {o.status} · {o.channel}
                    {o.paymentMethod ? ` · ${o.paymentMethod}` : ""} · ৳
                    {o.amountBdt.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {new Date(o.createdAt).toLocaleString()} · {o.tranId}
                  </p>
                  {o.enrollment && (
                    <p className="mt-2 text-sm text-ink-muted">
                      {o.enrollment.batchId
                        ? `Batch: ${o.enrollment.batch?.name ?? o.enrollment.batchId}`
                        : "Awaiting batch"}
                    </p>
                  )}
                </div>
                <Link
                  to={`/student/courses/${o.course.slug}`}
                  className="text-sm font-medium text-accent hover:underline"
                >
                  Open course
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
