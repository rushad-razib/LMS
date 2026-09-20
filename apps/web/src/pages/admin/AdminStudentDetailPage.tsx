import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MarkInstallmentPaidInputSchema, type AdminPaymentMethod } from "@arva/shared";
import { api, ApiError, type AdminStudentDetail } from "@/lib/api";
import {
  applyApiFormError,
  parseWithSchema,
  type FieldErrors,
} from "@/lib/formErrors";
import { toast } from "@/lib/toast";
import { PageHeader } from "@/components/PageHeader";

const PAYMENT_METHODS: AdminPaymentMethod[] = [
  "CASH",
  "CARD",
  "SSLCOMMERZ_OFFLINE",
  "OTHER",
];

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function AdminStudentDetailPage() {
  const { userId } = useParams();
  const [detail, setDetail] = useState<AdminStudentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [payMethodByInst, setPayMethodByInst] = useState<Record<string, AdminPaymentMethod>>(
    {},
  );
  const [payFieldErrors, setPayFieldErrors] = useState<FieldErrors>({});
  const [payFormError, setPayFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    const r = await api.adminStudentDetail(userId);
    setDetail(r);
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed"))
      .finally(() => setLoading(false));
  }, [load]);

  async function toggleAccess(enrollmentId: string, accessBlocked: boolean) {
    setBusy(enrollmentId);
    try {
      await api.adminSetEnrollmentAccess(enrollmentId, accessBlocked);
      await load();
      toast.success(accessBlocked ? "Access blocked" : "Access restored");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  async function markPaid(installmentId: string) {
    setPayFieldErrors((prev) => {
      const next = { ...prev };
      delete next[installmentId];
      return next;
    });
    setPayFormError(null);

    const paymentMethod = payMethodByInst[installmentId] ?? "CASH";
    const parsed = parseWithSchema(MarkInstallmentPaidInputSchema, { paymentMethod });
    if (!parsed.ok) {
      const message =
        parsed.fieldErrors.paymentMethod ?? parsed.formError ?? "Invalid payment method";
      setPayFieldErrors((prev) => ({ ...prev, [installmentId]: message }));
      return;
    }

    setBusy(installmentId);
    try {
      await api.adminMarkInstallmentPaid(installmentId, parsed.data.paymentMethod);
      await load();
      toast.success("Installment marked paid");
    } catch (err) {
      if (err instanceof ApiError && err.code === "VALIDATION_ERROR") {
        applyApiFormError(
          err,
          (fields) => {
            const message = fields.paymentMethod;
            if (message) {
              setPayFieldErrors((prev) => ({ ...prev, [installmentId]: message }));
            }
          },
          setPayFormError,
          "Payment failed",
        );
      } else {
        toast.error(err instanceof ApiError ? err.message : "Payment failed");
      }
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return <p className="text-ink-muted">Loading student…</p>;
  }

  if (error || !detail) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-400">{error ?? "Student not found"}</p>
        <Link to="/admin/users" className="text-accent hover:underline">
          ← Users
        </Link>
      </div>
    );
  }

  const { student, enrollments } = detail;

  return (
    <div className="space-y-6">
      <PageHeader title={student.fullName} description="Student profile & enrollments" />
      <Link to="/admin/users" className="text-sm text-accent hover:underline">
        ← Users
      </Link>

      <div className="rounded-xl border border-border bg-surface-elevated p-4">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase text-ink-muted">Email</dt>
            <dd className="mt-1">{student.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-ink-muted">Phone</dt>
            <dd className="mt-1">{student.phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-ink-muted">WhatsApp</dt>
            <dd className="mt-1">{student.whatsappPhone || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-ink-muted">Date of birth</dt>
            <dd className="mt-1">{student.dateOfBirth || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-ink-muted">Gender</dt>
            <dd className="mt-1">{student.gender || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-ink-muted">NID</dt>
            <dd className="mt-1">{student.nidNumber || "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase text-ink-muted">Address</dt>
            <dd className="mt-1">
              {[student.addressLine, student.city, student.district]
                .filter(Boolean)
                .join(", ") || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-ink-muted">Guardian</dt>
            <dd className="mt-1">{student.guardianName || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-ink-muted">Guardian phone</dt>
            <dd className="mt-1">{student.guardianPhone || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-ink-muted">Education</dt>
            <dd className="mt-1">{student.educationLevel || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-ink-muted">Occupation</dt>
            <dd className="mt-1">{student.occupation || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-ink-muted">Status</dt>
            <dd className="mt-1">{student.status}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-ink-muted">Joined</dt>
            <dd className="mt-1">{formatDate(student.createdAt)}</dd>
          </div>
        </dl>
      </div>

      {payFormError ? <p className="text-sm text-red-400">{payFormError}</p> : null}

      <div className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Courses enrolled</h2>
        {enrollments.length === 0 ? (
          <p className="text-ink-muted">No active enrollments.</p>
        ) : (
          enrollments.map((e) => (
            <div
              key={e.id}
              className="space-y-3 rounded-xl border border-border bg-surface-elevated p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{e.course.title}</p>
                  <p className="text-sm text-ink-muted">
                    Enrolled {formatDate(e.createdAt)}
                    {e.batch ? ` · Batch ${e.batch.name}` : " · Awaiting batch"}
                  </p>
                  <p className="mt-1 text-sm">
                    Due ৳{e.dueBdt.toLocaleString("en-BD")} / ৳
                    {e.totalBdt.toLocaleString("en-BD")}
                    {e.paymentMode !== "FULL" ? ` · ${e.paymentMode}` : " · Full payment"}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy === e.id}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs hover:border-accent"
                  onClick={() => toggleAccess(e.id, !e.accessBlocked)}
                >
                  {e.accessBlocked ? "Unblock access" : "Block access"}
                </button>
              </div>

              {e.accessBlocked ? (
                <p className="text-sm text-amber-400">Access currently blocked</p>
              ) : null}

              {e.plan ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-xs uppercase text-ink-muted">
                      <tr>
                        <th className="py-2 pr-3">#</th>
                        <th className="py-2 pr-3">Amount</th>
                        <th className="py-2 pr-3">Due</th>
                        <th className="py-2 pr-3">Pay by</th>
                        <th className="py-2 pr-3">Status</th>
                        <th className="py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {e.plan.installments.map((inst) => (
                        <tr key={inst.id} className="border-t border-border">
                          <td className="py-2 pr-3">{inst.sequence}</td>
                          <td className="py-2 pr-3">
                            ৳{inst.amountBdt.toLocaleString("en-BD")}
                          </td>
                          <td className="py-2 pr-3">{formatDate(inst.dueDate)}</td>
                          <td className="py-2 pr-3">{formatDate(inst.payByDate)}</td>
                          <td className="py-2 pr-3">{inst.status}</td>
                          <td className="py-2">
                            {inst.status === "PAID" ? (
                              <span className="text-ink-muted">
                                Paid {formatDate(inst.paidAt)}
                              </span>
                            ) : (
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <select
                                    className="rounded-lg border border-border bg-surface px-2 py-1 text-xs"
                                    value={payMethodByInst[inst.id] ?? "CASH"}
                                    onChange={(ev) => {
                                      setPayFieldErrors((prev) => {
                                        const next = { ...prev };
                                        delete next[inst.id];
                                        return next;
                                      });
                                      setPayMethodByInst((prev) => ({
                                        ...prev,
                                        [inst.id]: ev.target.value as AdminPaymentMethod,
                                      }));
                                    }}
                                  >
                                    {PAYMENT_METHODS.map((m) => (
                                      <option key={m} value={m}>
                                        {m}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    disabled={busy === inst.id}
                                    className="rounded-lg bg-accent px-2 py-1 text-xs font-semibold text-accent-fg disabled:opacity-60"
                                    onClick={() => markPaid(inst.id)}
                                  >
                                    Mark paid
                                  </button>
                                </div>
                                {payFieldErrors[inst.id] ? (
                                  <p className="text-xs text-red-400">{payFieldErrors[inst.id]}</p>
                                ) : null}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
