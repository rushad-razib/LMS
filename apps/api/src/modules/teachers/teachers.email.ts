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

export async function sendBatchAnnouncementEmail(
  to: string,
  fullName: string,
  courseTitle: string,
  batchName: string,
  title: string,
  body: string,
) {
  const env = loadEnv();
  const link = `${env.WEB_ORIGIN}/student`;
  const preview = body.length > 400 ? `${body.slice(0, 400)}…` : body;
  await sendMail(
    to,
    `${env.APP_NAME} — ${title}`,
    `<p>Hi ${fullName},</p>
     <p>A new announcement was posted in <strong>${batchName}</strong> (${courseTitle}).</p>
     <p><strong>${title}</strong></p>
     <p>${preview.replace(/\n/g, "<br/>")}</p>
     <p><a href="${link}">Open student portal</a></p>`,
  );
}
