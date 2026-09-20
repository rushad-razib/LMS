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

export async function sendLeadNotificationEmail(
  to: string,
  lead: {
    name: string;
    email: string;
    phone: string | null;
    subject: string;
    message: string;
  },
) {
  const env = loadEnv();
  await sendMail(
    to,
    `${env.APP_NAME} — Contact: ${lead.subject}`,
    `<p>New contact form submission.</p>
     <p><strong>Name:</strong> ${lead.name}</p>
     <p><strong>Email:</strong> ${lead.email}</p>
     <p><strong>Phone:</strong> ${lead.phone ?? "—"}</p>
     <p><strong>Subject:</strong> ${lead.subject}</p>
     <p>${lead.message.replace(/\n/g, "<br/>")}</p>`,
  );
}
