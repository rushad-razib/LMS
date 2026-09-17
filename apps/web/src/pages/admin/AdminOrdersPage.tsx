import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import type { AdminEnrollPaymentMode, AdminPaymentMethod } from "@arva/shared";
import {
  AdminEnrollInputSchema,
  AssignEnrollmentBatchInputSchema,
} from "@arva/shared";
import {
  api,
  ApiError,
  type EnrollmentRow,
  type OrderRow,
} from "@/lib/api";
import {
  applyApiFormError,
  parseWithSchema,
  type FieldErrors,
} from "@/lib/formErrors";
import { toast } from "@/lib/toast";
import { DataTable } from "@/components/DataTable";
import { Field } from "@/components/Field";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";

const PAYMENT_METHODS: AdminPaymentMethod[] = [
  "CASH",
  "CARD",
  "SSLCOMMERZ_OFFLINE",
  "OTHER",
];

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState<EnrollmentRow | null>(null);
  const [students, setStudents] = useState<
    { id: string; fullName: string; email: string }[]
  >([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [batches, setBatches] = useState<
    { id: string; name: string; courseId: string }[]
  >([]);
  const [studentId, setStudentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<AdminPaymentMethod>("CASH");
  const [paymentMode, setPaymentMode] =
    useState<AdminEnrollPaymentMode>("FULL");
  const [batchId, setBatchId] = useState("");
  const [assignBatchId, setAssignBatchId] = useState("");
  const [enrollFieldErrors, setEnrollFieldErrors] = useState<FieldErrors>({});
  const [enrollFormError, setEnrollFormError] = useState<string | null>(null);
  const [assignFieldErrors, setAssignFieldErrors] = useState<FieldErrors>({});
  const [assignFormError, setAssignFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [o, e] = await Promise.all([
      api.adminListOrders(),
      api.adminListEnrollments(),
    ]);
    setOrders(o.orders);
    setEnrollments(e.enrollments);
  }, []);

  useEffect(() => {
    load().catch((err) =>
      setLoadError(err instanceof ApiError ? err.message : "Failed to load"),
    );
  }, [load]);

  async function openEnrollModal() {
    setEnrollFieldErrors({});
    setEnrollFormError(null);
    try {
      const [users, courseList, batchList] = await Promise.all([
        api.adminListUsers(),
        api.adminListCourses(),
        api.adminListBatches(),
      ]);
      setStudents(
        users.users
          .filter((u) => u.role === "STUDENT")
          .map((u) => ({ id: u.id, fullName: u.fullName, email: u.email })),
      );
      setCourses(courseList.courses.map((c) => ({ id: c.id, title: c.title })));
      setBatches(
        batchList.batches.map((b) => ({
          id: b.id,
          name: b.name,
          courseId: b.courseId,
        })),
      );
      setStudentId("");
      setCourseId("");
      setPaymentMethod("CASH");
      setPaymentMode("FULL");
      setBatchId("");
      setEnrollOpen(true);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to open enroll");
    }
  }

  async function openAssign(row: EnrollmentRow) {
    setAssignFieldErrors({});
    setAssignFormError(null);
    try {
      const batchList = await api.adminListBatches(row.courseId);
      setBatches(
        batchList.batches.map((b) => ({
          id: b.id,
          name: b.name,
          courseId: b.courseId,
        })),
      );
      setAssignBatchId(row.batchId ?? "");
      setAssignOpen(row);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load batches");
    }
  }

  const courseBatches = useMemo(
    () => batches.filter((b) => b.courseId === courseId),
    [batches, courseId],
  );

  async function onEnroll(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setEnrollFieldErrors({});
    setEnrollFormError(null);

    const parsed = parseWithSchema(AdminEnrollInputSchema, {
      studentId,
      courseId,
      paymentMethod,
      batchId: batchId || null,
      paymentMode,
    });
    if (!parsed.ok) {
      setEnrollFieldErrors(parsed.fieldErrors);
      setEnrollFormError(parsed.formError);
      setSaving(false);
      return;
    }

    try {
      await api.adminEnroll(parsed.data);
      setEnrollOpen(false);
      await load();
      toast.success("Student enrolled");
    } catch (err) {
      applyApiFormError(err, setEnrollFieldErrors, setEnrollFormError, "Enroll failed");
    } finally {
      setSaving(false);
    }
  }

  async function onAssign(e: FormEvent) {
    e.preventDefault();
    if (!assignOpen) return;
    setSaving(true);
    setAssignFieldErrors({});
    setAssignFormError(null);

    const parsed = parseWithSchema(AssignEnrollmentBatchInputSchema, {
      batchId: assignBatchId || null,
    });
    if (!parsed.ok) {
      setAssignFieldErrors(parsed.fieldErrors);
      setAssignFormError(parsed.formError);
      setSaving(false);
      return;
    }

    try {
      await api.adminAssignEnrollmentBatch(assignOpen.id, parsed.data.batchId);
      setAssignOpen(null);
      await load();
      toast.success(assignBatchId ? "Batch assigned" : "Batch cleared");
    } catch (err) {
      applyApiFormError(err, setAssignFieldErrors, setAssignFormError, "Assign failed");
    } finally {
      setSaving(false);
    }
  }

  const orderColumns = useMemo<ColumnDef<OrderRow>[]>(
    () => [
      {
        accessorKey: "tranId",
        header: "Ref",
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.tranId}</span>
        ),
      },
      {
        id: "student",
        header: "Student",
        accessorFn: (r) => r.user.fullName,
        cell: ({ row }) => (
          <div>
            <Link
              to={`/admin/students/${row.original.user.id}`}
              className="font-medium text-accent hover:underline"
            >
              {row.original.user.fullName}
            </Link>
            <div className="text-xs text-ink-muted">{row.original.user.email}</div>
          </div>
        ),
      },
      {
        id: "course",
        header: "Course",
        accessorFn: (r) => r.course.title,
      },
      {
        accessorKey: "amountBdt",
        header: "Amount",
        cell: ({ row }) => `৳${row.original.amountBdt.toLocaleString("en-BD")}`,
      },
      { accessorKey: "channel", header: "Channel" },
      {
        accessorKey: "paymentMethod",
        header: "Method",
        cell: ({ row }) => row.original.paymentMethod ?? row.original.provider ?? "—",
      },
      { accessorKey: "status", header: "Status" },
      {
        id: "batch",
        header: "Batch",
        cell: ({ row }) =>
          row.original.enrollment?.batch?.name ??
          (row.original.enrollment ? "Unassigned" : "—"),
      },
    ],
    [],
  );

  const enrollmentColumns = useMemo<ColumnDef<EnrollmentRow>[]>(
    () => [
      {
        id: "student",
        header: "Student",
        accessorFn: (r) => r.user.fullName,
        cell: ({ row }) => (
          <div>
            <Link
              to={`/admin/students/${row.original.user.id}`}
              className="text-accent hover:underline"
            >
              {row.original.user.fullName}
            </Link>
            <div className="text-xs text-ink-muted">{row.original.user.email}</div>
          </div>
        ),
      },
      {
        id: "course",
        header: "Course",
        accessorFn: (r) => r.course.title,
      },
      {
        id: "batch",
        header: "Batch",
        cell: ({ row }) => row.original.batch?.name ?? "Unassigned",
      },
      {
        id: "channel",
        header: "Via",
        cell: ({ row }) => row.original.order?.channel ?? "—",
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <button
            type="button"
            className="rounded-full border border-border px-3 py-1 text-xs font-medium hover:border-accent hover:text-accent"
            onClick={() => void openAssign(row.original)}
          >
            {row.original.batchId ? "Reassign" : "Assign batch"}
          </button>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Orders & enrollments"
        description="SSLCommerz orders and office enrollments. Assign batches here."
        actionLabel="Office enroll"
        onAction={() => void openEnrollModal()}
      />

      {loadError ? <p className="text-sm text-red-500">{loadError}</p> : null}

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Enrollments</h2>
        <DataTable
          data={enrollments}
          columns={enrollmentColumns}
          filterPlaceholder="Search enrollments…"
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Orders</h2>
        <DataTable
          data={orders}
          columns={orderColumns}
          filterPlaceholder="Search orders…"
        />
      </section>

      <Modal
        open={enrollOpen}
        onClose={() => setEnrollOpen(false)}
        title="Office enroll"
      >
        <form noValidate className="grid gap-3" onSubmit={onEnroll}>
          <Field label="Student" error={enrollFieldErrors.studentId}>
            <select
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            >
              <option value="">Select student…</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.email})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Course" error={enrollFieldErrors.courseId}>
            <select
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value);
                setBatchId("");
              }}
            >
              <option value="">Select course…</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Payment mode" error={enrollFieldErrors.paymentMode}>
            <select
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
              value={paymentMode}
              onChange={(e) =>
                setPaymentMode(e.target.value as AdminEnrollPaymentMode)
              }
            >
              <option value="FULL">Full payment</option>
              <option value="INSTALLMENT_3">3 months installment</option>
              <option value="INSTALLMENT_6">6 months installment</option>
            </select>
          </Field>
          <Field label="Payment method" error={enrollFieldErrors.paymentMethod}>
            <select
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value as AdminPaymentMethod)
              }
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
          {paymentMode !== "FULL" ? (
            <p className="text-xs text-ink-muted">
              First installment is recorded as paid now. Remaining dues are due on the
              1st of each following month (pay by the 10th).
            </p>
          ) : null}
          <Field label="Batch (optional)" error={enrollFieldErrors.batchId}>
            <select
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              disabled={!courseId}
            >
              <option value="">Assign later…</option>
              {courseBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>
          {enrollFormError ? (
            <p className="text-sm text-red-500">{enrollFormError}</p>
          ) : null}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg disabled:opacity-60"
          >
            {saving ? "Saving…" : "Create enrollment"}
          </button>
        </form>
      </Modal>

      <Modal
        open={Boolean(assignOpen)}
        onClose={() => setAssignOpen(null)}
        title={assignOpen?.batchId ? "Reassign batch" : "Assign batch"}
      >
        {assignOpen ? (
          <form noValidate className="grid gap-3" onSubmit={onAssign}>
            <p className="text-sm text-ink-muted">
              {assignOpen.user.fullName} · {assignOpen.course.title}
            </p>
            <Field label="Batch" error={assignFieldErrors.batchId}>
              <select
                className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                value={assignBatchId}
                onChange={(e) => setAssignBatchId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {batches
                  .filter((b) => b.courseId === assignOpen.courseId)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
              </select>
            </Field>
            {assignFormError ? (
              <p className="text-sm text-red-500">{assignFormError}</p>
            ) : null}
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
