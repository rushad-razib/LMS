import { randomBytes } from "node:crypto";
import type {
  AdminEnrollInput,
  AdminPaymentMethod,
  AssignEnrollmentBatchInput,
  CheckoutInput,
  MarkInstallmentPaidInput,
  SetEnrollmentAccessInput,
} from "@arva/shared";
import { prisma } from "../../db/prisma.js";
import { AppError } from "../../common/errors.js";
import { loadEnv } from "../../config/env.js";
import { getSettings } from "../settings/settings.service.js";
import { studentCanAccessPortal } from "../auth/access.js";
import { assertBatchHasSeat } from "../courses/courses.service.js";
import {
  initSslcommerzSession,
  isSslcommerzConfigured,
  validateSslcommerzPayment,
} from "./sslcommerz.client.js";
import {
  sendAdminEnrolledEmail,
  sendBatchAssignedEmail,
  sendInstallmentDueAdminEmail,
  sendInstallmentDueStudentEmail,
  sendOrderPaidEmail,
} from "./purchases.email.js";
import {
  addCalendarDays,
  firstOfMonthAhead,
  splitInstallmentAmounts,
  startOfUtcDay,
} from "./installments.util.js";

function publicApiOrigin() {
  const env = loadEnv();
  const origin = (env.API_ORIGIN || env.WEB_ORIGIN).replace(/\/$/, "");
  return origin;
}

function callbackUrl(path: string) {
  return `${publicApiOrigin()}/api/v1/purchases/${path}`;
}

function newTranId() {
  return `ARVA-${randomBytes(12).toString("hex")}`;
}

async function assertNoActiveEnrollment(userId: string, courseId: string) {
  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (existing && existing.status === "ACTIVE") {
    throw new AppError(
      409,
      "You are already enrolled in this course",
      "ALREADY_ENROLLED",
    );
  }
  return existing;
}

async function createPaidEnrollment(opts: {
  userId: string;
  courseId: string;
  orderId: string;
  batchId?: string | null;
}) {
  return prisma.enrollment.upsert({
    where: {
      userId_courseId: { userId: opts.userId, courseId: opts.courseId },
    },
    create: {
      userId: opts.userId,
      courseId: opts.courseId,
      orderId: opts.orderId,
      batchId: opts.batchId ?? null,
      status: "ACTIVE",
    },
    update: {
      orderId: opts.orderId,
      status: "ACTIVE",
      batchId: opts.batchId === undefined ? undefined : opts.batchId,
    },
    include: {
      course: { select: { id: true, title: true, slug: true } },
      batch: { select: { id: true, name: true } },
      order: true,
    },
  });
}

export async function checkoutCourse(userId: string, input: CheckoutInput) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { studentProfile: true },
  });
  if (!user || user.role !== "STUDENT" || user.status === "DISABLED") {
    throw new AppError(403, "Student access only", "FORBIDDEN");
  }

  const settings = await getSettings();
  if (
    !studentCanAccessPortal({
      emailVerifiedAt: user.emailVerifiedAt,
      emailVerificationRequired: settings.emailVerificationRequired,
    })
  ) {
    throw new AppError(403, "Email verification required", "EMAIL_NOT_VERIFIED");
  }

  const course = await prisma.course.findUnique({ where: { id: input.courseId } });
  if (!course || course.status !== "PUBLISHED") {
    throw new AppError(404, "Course not found", "NOT_FOUND");
  }

  await assertNoActiveEnrollment(userId, course.id);

  // Free course — enroll immediately, no gateway
  if (course.priceBdt === 0) {
    const order = await prisma.order.create({
      data: {
        userId,
        courseId: course.id,
        amountBdt: 0,
        channel: "ONLINE",
        status: "PAID",
        provider: "FREE",
        tranId: newTranId(),
      },
    });
    const enrollment = await createPaidEnrollment({
      userId,
      courseId: course.id,
      orderId: order.id,
    });
    try {
      await sendOrderPaidEmail(user.email, user.fullName, course.title);
    } catch (err) {
      console.error("sendOrderPaidEmail failed", err);
    }
    return {
      kind: "enrolled" as const,
      order,
      enrollment,
      gatewayUrl: null,
    };
  }

  if (!isSslcommerzConfigured()) {
    throw new AppError(
      503,
      "Online payments are not configured",
      "PAYMENT_NOT_CONFIGURED",
    );
  }

  const tranId = newTranId();
  const order = await prisma.order.create({
    data: {
      userId,
      courseId: course.id,
      amountBdt: course.priceBdt,
      channel: "ONLINE",
      status: "PENDING",
      provider: "SSLCOMMERZ",
      tranId,
    },
  });

  const session = await initSslcommerzSession({
    tranId,
    amountBdt: course.priceBdt,
    courseTitle: course.title,
    customerName: user.fullName,
    customerEmail: user.email,
    customerPhone: user.studentProfile?.phone,
    successUrl: callbackUrl("success"),
    failUrl: callbackUrl("fail"),
    cancelUrl: callbackUrl("cancel"),
    ipnUrl: callbackUrl("ipn"),
  });

  return {
    kind: "redirect" as const,
    order,
    enrollment: null,
    gatewayUrl: session.gatewayUrl,
  };
}

/** Idempotent: mark order PAID and ensure enrollment exists. */
export async function fulfillOnlineOrder(opts: {
  tranId: string;
  providerRef?: string | null;
  amountBdt?: number | null;
}) {
  const order = await prisma.order.findUnique({
    where: { tranId: opts.tranId },
    include: {
      user: true,
      course: true,
      enrollment: true,
    },
  });
  if (!order) {
    throw new AppError(404, "Order not found", "NOT_FOUND");
  }
  if (order.channel !== "ONLINE") {
    throw new AppError(400, "Not an online order", "INVALID_ORDER");
  }

  if (order.status === "PAID" && order.enrollment) {
    return { order, enrollment: order.enrollment, created: false };
  }

  if (opts.amountBdt != null && Number(opts.amountBdt) !== order.amountBdt) {
    throw new AppError(400, "Amount mismatch", "AMOUNT_MISMATCH");
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        providerRef: opts.providerRef ?? order.providerRef,
      },
    });
    const enrollment = await tx.enrollment.upsert({
      where: {
        userId_courseId: { userId: order.userId, courseId: order.courseId },
      },
      create: {
        userId: order.userId,
        courseId: order.courseId,
        orderId: order.id,
        batchId: null,
        status: "ACTIVE",
      },
      update: {
        orderId: order.id,
        status: "ACTIVE",
      },
    });
    return { order: updated, enrollment };
  });

  try {
    await sendOrderPaidEmail(order.user.email, order.user.fullName, order.course.title);
  } catch (err) {
    console.error("sendOrderPaidEmail failed", err);
  }

  return { ...result, created: true };
}

export async function handleSslcommerzIpn(body: Record<string, unknown>) {
  const valId = typeof body.val_id === "string" ? body.val_id : "";
  const tranId = typeof body.tran_id === "string" ? body.tran_id : "";
  const status = typeof body.status === "string" ? body.status : "";

  if (!tranId) {
    throw new AppError(400, "Missing tran_id", "VALIDATION_ERROR");
  }

  if (status && !["VALID", "VALIDATED", "SUCCESS"].includes(status.toUpperCase())) {
    await prisma.order.updateMany({
      where: { tranId, status: "PENDING" },
      data: { status: status.toUpperCase() === "FAILED" ? "FAILED" : "CANCELLED" },
    });
    return { ok: true as const, fulfilled: false };
  }

  if (!valId) {
    throw new AppError(400, "Missing val_id", "VALIDATION_ERROR");
  }

  const validated = await validateSslcommerzPayment(valId);
  const okStatuses = new Set(["VALID", "VALIDATED"]);
  if (!okStatuses.has(validated.status.toUpperCase())) {
    await prisma.order.updateMany({
      where: { tranId: validated.tranId || tranId, status: "PENDING" },
      data: { status: "FAILED" },
    });
    return { ok: true as const, fulfilled: false };
  }

  await fulfillOnlineOrder({
    tranId: validated.tranId || tranId,
    providerRef: validated.valId,
    amountBdt: Number(validated.amount),
  });
  return { ok: true as const, fulfilled: true };
}

export async function handleSslcommerzBrowserReturn(
  kind: "success" | "fail" | "cancel",
  body: Record<string, unknown>,
) {
  const env = loadEnv();
  const tranId = typeof body.tran_id === "string" ? body.tran_id : "";
  const valId = typeof body.val_id === "string" ? body.val_id : "";

  if (kind === "success" && valId && tranId) {
    try {
      const validated = await validateSslcommerzPayment(valId);
      if (["VALID", "VALIDATED"].includes(validated.status.toUpperCase())) {
        await fulfillOnlineOrder({
          tranId: validated.tranId || tranId,
          providerRef: validated.valId,
          amountBdt: Number(validated.amount),
        });
      }
    } catch (err) {
      console.error("success callback fulfill failed", err);
    }
    return `${env.WEB_ORIGIN}/checkout/success?tran_id=${encodeURIComponent(tranId)}`;
  }

  if (kind === "fail") {
    if (tranId) {
      await prisma.order.updateMany({
        where: { tranId, status: "PENDING" },
        data: { status: "FAILED" },
      });
    }
    return `${env.WEB_ORIGIN}/checkout/fail?tran_id=${encodeURIComponent(tranId)}`;
  }

  if (tranId) {
    await prisma.order.updateMany({
      where: { tranId, status: "PENDING" },
      data: { status: "CANCELLED" },
    });
  }
  return `${env.WEB_ORIGIN}/checkout/cancel?tran_id=${encodeURIComponent(tranId)}`;
}

export async function adminEnroll(input: AdminEnrollInput) {
  const student = await prisma.user.findUnique({ where: { id: input.studentId } });
  if (!student || student.role !== "STUDENT" || student.status === "DISABLED") {
    throw new AppError(400, "Invalid student", "INVALID_STUDENT");
  }

  const course = await prisma.course.findUnique({ where: { id: input.courseId } });
  if (!course) {
    throw new AppError(404, "Course not found", "NOT_FOUND");
  }

  await assertNoActiveEnrollment(student.id, course.id);

  let batchId: string | null = input.batchId ?? null;
  if (batchId) {
    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch || batch.courseId !== course.id) {
      throw new AppError(400, "Batch does not belong to this course", "INVALID_BATCH");
    }
    await assertBatchHasSeat(batchId);
  }

  const paymentMode = input.paymentMode ?? "FULL";
  const installmentMonths =
    paymentMode === "INSTALLMENT_3" ? 3 : paymentMode === "INSTALLMENT_6" ? 6 : null;

  if (installmentMonths && course.priceBdt <= 0) {
    throw new AppError(
      400,
      "Installments require a paid course",
      "INSTALLMENT_NOT_ALLOWED",
    );
  }

  const graceDays = 10;
  const now = new Date();
  const amounts = installmentMonths
    ? splitInstallmentAmounts(course.priceBdt, installmentMonths)
    : [course.priceBdt];
  const firstAmount = amounts[0]!;

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId: student.id,
        courseId: course.id,
        amountBdt: firstAmount,
        channel: "ADMIN",
        status: "PAID",
        paymentMethod: input.paymentMethod,
        provider: "ADMIN",
        tranId: newTranId(),
      },
    });
    const enrollment = await tx.enrollment.upsert({
      where: {
        userId_courseId: { userId: student.id, courseId: course.id },
      },
      create: {
        userId: student.id,
        courseId: course.id,
        orderId: order.id,
        batchId,
        status: "ACTIVE",
        accessBlocked: false,
      },
      update: {
        orderId: order.id,
        status: "ACTIVE",
        batchId,
        accessBlocked: false,
      },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        batch: { select: { id: true, name: true } },
        user: { select: { id: true, fullName: true, email: true } },
        order: true,
      },
    });

    let plan = null;
    if (installmentMonths) {
      plan = await tx.installmentPlan.create({
        data: {
          enrollmentId: enrollment.id,
          userId: student.id,
          courseId: course.id,
          totalBdt: course.priceBdt,
          months: installmentMonths,
          graceDays,
          status: "ACTIVE",
          installments: {
            create: amounts.map((amountBdt, index) => {
              const sequence = index + 1;
              if (sequence === 1) {
                const due = startOfUtcDay(now);
                return {
                  sequence,
                  amountBdt,
                  dueDate: due,
                  payByDate: due,
                  status: "PAID" as const,
                  paidAt: now,
                  paymentMethod: input.paymentMethod,
                  orderId: order.id,
                };
              }
              const dueDate = firstOfMonthAhead(now, sequence - 1);
              const payByDate = addCalendarDays(dueDate, graceDays - 1);
              return {
                sequence,
                amountBdt,
                dueDate,
                payByDate,
                status: "DUE" as const,
              };
            }),
          },
        },
        include: { installments: { orderBy: { sequence: "asc" } } },
      });
    }

    return { order, enrollment, plan };
  });

  try {
    await sendAdminEnrolledEmail(student.email, student.fullName, course.title);
    if (batchId && result.enrollment.batch) {
      await sendBatchAssignedEmail(
        student.email,
        student.fullName,
        course.title,
        result.enrollment.batch.name,
        false,
      );
    }
  } catch (err) {
    console.error("admin enroll email failed", err);
  }

  return result;
}

export async function assignEnrollmentBatch(
  enrollmentId: string,
  input: AssignEnrollmentBatchInput,
) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      user: true,
      course: true,
      batch: true,
    },
  });
  if (!enrollment || enrollment.status !== "ACTIVE") {
    throw new AppError(404, "Enrollment not found", "NOT_FOUND");
  }

  const previousBatchId = enrollment.batchId;
  let batchName: string | null = null;

  if (input.batchId) {
    const batch = await prisma.batch.findUnique({ where: { id: input.batchId } });
    if (!batch || batch.courseId !== enrollment.courseId) {
      throw new AppError(400, "Batch does not belong to this course", "INVALID_BATCH");
    }
    if (input.batchId !== previousBatchId) {
      await assertBatchHasSeat(input.batchId, enrollmentId);
    }
    batchName = batch.name;
  }

  const updated = await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { batchId: input.batchId },
    include: {
      course: { select: { id: true, title: true, slug: true } },
      batch: { select: { id: true, name: true } },
      user: { select: { id: true, fullName: true, email: true } },
      order: true,
    },
  });

  if (input.batchId && batchName && input.batchId !== previousBatchId) {
    try {
      await sendBatchAssignedEmail(
        enrollment.user.email,
        enrollment.user.fullName,
        enrollment.course.title,
        batchName,
        Boolean(previousBatchId),
      );
    } catch (err) {
      console.error("batch assign email failed", err);
    }
  }

  return updated;
}

export async function markInstallmentPaid(
  installmentId: string,
  input: MarkInstallmentPaidInput,
) {
  await refreshOverdueInstallments();

  const installment = await prisma.installment.findUnique({
    where: { id: installmentId },
    include: {
      plan: {
        include: {
          user: true,
          course: true,
          enrollment: true,
        },
      },
    },
  });
  if (!installment) {
    throw new AppError(404, "Installment not found", "NOT_FOUND");
  }
  if (installment.status === "PAID") {
    throw new AppError(409, "Installment already paid", "ALREADY_PAID");
  }

  const now = new Date();
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId: installment.plan.userId,
        courseId: installment.plan.courseId,
        amountBdt: installment.amountBdt,
        channel: "ADMIN",
        status: "PAID",
        paymentMethod: input.paymentMethod,
        provider: "ADMIN",
        tranId: newTranId(),
      },
    });

    const updated = await tx.installment.update({
      where: { id: installment.id },
      data: {
        status: "PAID",
        paidAt: now,
        paymentMethod: input.paymentMethod,
        orderId: order.id,
      },
    });

    const remaining = await tx.installment.count({
      where: {
        planId: installment.planId,
        status: { not: "PAID" },
      },
    });

    if (remaining === 0) {
      await tx.installmentPlan.update({
        where: { id: installment.planId },
        data: { status: "COMPLETED" },
      });
    }

    return { order, installment: updated };
  });

  return result;
}

export async function setEnrollmentAccess(
  enrollmentId: string,
  input: SetEnrollmentAccessInput,
) {
  const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
  if (!enrollment || enrollment.status !== "ACTIVE") {
    throw new AppError(404, "Enrollment not found", "NOT_FOUND");
  }
  return prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { accessBlocked: input.accessBlocked },
    include: {
      course: { select: { id: true, title: true, slug: true } },
      batch: { select: { id: true, name: true } },
      user: { select: { id: true, fullName: true, email: true } },
      order: true,
      installmentPlan: {
        include: { installments: { orderBy: { sequence: "asc" } } },
      },
    },
  });
}

export async function refreshOverdueInstallments(now = new Date()) {
  await prisma.installment.updateMany({
    where: {
      status: "DUE",
      payByDate: { lt: startOfUtcDay(now) },
    },
    data: { status: "OVERDUE" },
  });
}

function serializeInstallment(inst: {
  id: string;
  sequence: number;
  amountBdt: number;
  dueDate: Date;
  payByDate: Date;
  status: string;
  paidAt: Date | null;
  paymentMethod: AdminPaymentMethod | null;
  orderId: string | null;
}) {
  return {
    id: inst.id,
    sequence: inst.sequence,
    amountBdt: inst.amountBdt,
    dueDate: inst.dueDate.toISOString(),
    payByDate: inst.payByDate.toISOString(),
    status: inst.status,
    paidAt: inst.paidAt?.toISOString() ?? null,
    paymentMethod: inst.paymentMethod,
    orderId: inst.orderId,
  };
}

export async function getAdminStudentDetail(userId: string) {
  await refreshOverdueInstallments();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { studentProfile: true },
  });
  if (!user || user.role !== "STUDENT") {
    throw new AppError(404, "Student not found", "NOT_FOUND");
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { userId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    include: {
      course: { select: { id: true, title: true, slug: true, priceBdt: true } },
      batch: { select: { id: true, name: true } },
      installmentPlan: {
        include: { installments: { orderBy: { sequence: "asc" } } },
      },
      order: true,
    },
  });

  return {
    student: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      status: user.status,
      phone: user.studentProfile?.phone ?? null,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
    },
    enrollments: enrollments.map((e) => {
      const plan = e.installmentPlan;
      const installments = plan?.installments ?? [];
      const paidBdt = installments
        .filter((i) => i.status === "PAID")
        .reduce((sum, i) => sum + i.amountBdt, 0);
      const totalBdt = plan?.totalBdt ?? e.order?.amountBdt ?? e.course.priceBdt;
      const dueBdt = totalBdt - paidBdt;
      return {
        id: e.id,
        createdAt: e.createdAt.toISOString(),
        accessBlocked: e.accessBlocked,
        batch: e.batch,
        course: e.course,
        totalBdt,
        dueBdt,
        paidBdt,
        paymentMode: plan ? (`INSTALLMENT_${plan.months}` as const) : ("FULL" as const),
        plan: plan
          ? {
              id: plan.id,
              months: plan.months,
              status: plan.status,
              graceDays: plan.graceDays,
              installments: installments.map(serializeInstallment),
            }
          : null,
      };
    }),
  };
}

export async function sendInstallmentDueReminders(now = new Date()) {
  await refreshOverdueInstallments(now);

  const today = startOfUtcDay(now);
  const tomorrow = addCalendarDays(today, 1);

  // Only fire student/admin due emails on the 1st (due date day)
  if (today.getUTCDate() !== 1) {
    return { sent: 0, skipped: true as const };
  }

  const dueInstallments = await prisma.installment.findMany({
    where: {
      status: { in: ["DUE", "OVERDUE"] },
      dueDate: { gte: today, lt: tomorrow },
    },
    include: {
      plan: {
        include: {
          user: true,
          course: true,
        },
      },
    },
  });

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", status: { not: "DISABLED" } },
    select: { email: true, fullName: true },
  });

  let sent = 0;
  for (const inst of dueInstallments) {
    const payBy = inst.payByDate.toISOString().slice(0, 10);
    try {
      await sendInstallmentDueStudentEmail(
        inst.plan.user.email,
        inst.plan.user.fullName,
        inst.plan.course.title,
        inst.amountBdt,
        payBy,
      );
      for (const admin of admins) {
        await sendInstallmentDueAdminEmail(
          admin.email,
          admin.fullName,
          inst.plan.user.fullName,
          inst.plan.user.email,
          inst.plan.course.title,
          inst.amountBdt,
          payBy,
        );
      }
      sent += 1;
    } catch (err) {
      console.error("installment reminder failed", inst.id, err);
    }
  }

  return { sent, skipped: false as const };
}

export async function adminListOrders() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      course: { select: { id: true, title: true, slug: true } },
      enrollment: {
        include: {
          batch: { select: { id: true, name: true } },
        },
      },
    },
  });
  return orders;
}

export async function adminListEnrollments(unassignedOnly = false) {
  return prisma.enrollment.findMany({
    where: {
      status: "ACTIVE",
      ...(unassignedOnly ? { batchId: null } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      course: { select: { id: true, title: true, slug: true } },
      batch: { select: { id: true, name: true } },
      order: true,
    },
  });
}

export async function adminDashboardCounts() {
  const [students, orders, batches, unassignedEnrollments] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.order.count(),
    prisma.batch.count(),
    prisma.enrollment.count({ where: { status: "ACTIVE", batchId: null } }),
  ]);
  return { students, orders, batches, unassignedEnrollments };
}

export async function listStudentOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      course: { select: { id: true, title: true, slug: true } },
      enrollment: {
        include: { batch: { select: { id: true, name: true } } },
      },
    },
  });
}
