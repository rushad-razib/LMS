import { loadEnv } from "../../config/env.js";

async function sendMail(to: string, subject: string, html: string) {
  const env = loadEnv();
  if (!env.RESEND_API_KEY) {
    console.log("\n[email:dev-fallback]");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    console.log("[/email:dev-fallback]\n");
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(env.RESEND_API_KEY);
  await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
  });
}

export async function sendOrderPaidEmail(
  to: string,
  fullName: string,
  courseTitle: string,
) {
  const env = loadEnv();
  const link = `${env.WEB_ORIGIN}/student`;
  await sendMail(
    to,
    `${env.APP_NAME} — Payment confirmed`,
    `<p>Hi ${fullName},</p>
     <p>Your payment for <strong>${courseTitle}</strong> was successful.</p>
     <p>An admin will assign your batch shortly. You can check your portal here:</p>
     <p><a href="${link}">${link}</a></p>`,
  );
}

export async function sendAdminEnrolledEmail(
  to: string,
  fullName: string,
  courseTitle: string,
) {
  const env = loadEnv();
  const link = `${env.WEB_ORIGIN}/student`;
  await sendMail(
    to,
    `${env.APP_NAME} — You are enrolled`,
    `<p>Hi ${fullName},</p>
     <p>You have been enrolled in <strong>${courseTitle}</strong>.</p>
     <p>An admin will assign your batch if not already assigned. Portal:</p>
     <p><a href="${link}">${link}</a></p>`,
  );
}

export async function sendBatchAssignedEmail(
  to: string,
  fullName: string,
  courseTitle: string,
  batchName: string,
  reassigned: boolean,
) {
  const env = loadEnv();
  const link = `${env.WEB_ORIGIN}/student`;
  const subject = reassigned
    ? `${env.APP_NAME} — Batch reassigned`
    : `${env.APP_NAME} — Batch assigned`;
  const intro = reassigned
    ? `Your batch for <strong>${courseTitle}</strong> was changed to <strong>${batchName}</strong>.`
    : `You have been assigned to batch <strong>${batchName}</strong> for <strong>${courseTitle}</strong>.`;
  await sendMail(
    to,
    subject,
    `<p>Hi ${fullName},</p><p>${intro}</p><p><a href="${link}">Open student portal</a></p>`,
  );
}

export async function sendInstallmentDueStudentEmail(
  to: string,
  fullName: string,
  courseTitle: string,
  amountBdt: number,
  payByDate: string,
) {
  const env = loadEnv();
  await sendMail(
    to,
    `${env.APP_NAME} — Installment due`,
    `<p>Hi ${fullName},</p>
     <p>Your installment of <strong>৳${amountBdt.toLocaleString("en-BD")}</strong> for <strong>${courseTitle}</strong> is due.</p>
     <p>Please clear the due amount by <strong>${payByDate}</strong>.</p>
     <p>Contact the academy office to make your payment.</p>`,
  );
}

export async function sendInstallmentDueAdminEmail(
  to: string,
  adminName: string,
  studentName: string,
  studentEmail: string,
  courseTitle: string,
  amountBdt: number,
  payByDate: string,
) {
  const env = loadEnv();
  await sendMail(
    to,
    `${env.APP_NAME} — Student installment due`,
    `<p>Hi ${adminName},</p>
     <p><strong>${studentName}</strong> (${studentEmail}) has an installment due for <strong>${courseTitle}</strong>.</p>
     <p>Amount: <strong>৳${amountBdt.toLocaleString("en-BD")}</strong></p>
     <p>Pay by: <strong>${payByDate}</strong></p>`,
  );
}
