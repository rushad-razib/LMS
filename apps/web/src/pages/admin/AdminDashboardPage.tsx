import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "@/lib/api";

export function AdminDashboardPage() {
  const [counts, setCounts] = useState<{
    students: number;
    orders: number;
    batches: number;
    unassignedEnrollments: number;
    unverifiedStudents: number;
    unreadLeads: number;
  } | null>(null);

  useEffect(() => {
    api
      .adminDashboardCounts()
      .then(setCounts)
      .catch((err) => {
        console.error(err instanceof ApiError ? err.message : err);
      });
  }, []);

  const cards = [
    { label: "Students", value: counts?.students, to: "/admin/users" },
    {
      label: "Unverified students",
      value: counts?.unverifiedStudents,
      to: "/admin/users",
    },
    { label: "Orders", value: counts?.orders, to: "/admin/orders" },
    { label: "Batches", value: counts?.batches, to: "/admin/batches" },
    {
      label: "Unassigned enrollments",
      value: counts?.unassignedEnrollments,
      to: "/admin/orders",
    },
    { label: "Unread leads", value: counts?.unreadLeads, to: "/admin/leads" },
  ];

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-semibold">Admin dashboard</h1>
      <p className="text-ink-muted">
        LMS ops plus CMS. Assign batches from Orders; manage content under Blog /
        Gallery / Notices.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className="rounded-xl border border-border bg-surface-elevated p-4 transition hover:border-accent"
          >
            <p className="text-sm text-ink-muted">{card.label}</p>
            <p className="mt-1 font-display text-2xl font-semibold">
              {card.value ?? "—"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
