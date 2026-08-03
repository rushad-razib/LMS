import { Resend } from "resend";
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

  const resend = new Resend(env.RESEND_API_KEY);
  await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
  });
}

export async function sendVerificationEmail(to: string, token: string) {
  const env = loadEnv();
  const link = `${env.WEB_ORIGIN}/verify-email?token=${encodeURIComponent(token)}`;
  await sendMail(
    to,
    `${env.APP_NAME} — Verify your email`,
    `<p>Welcome to ${env.APP_NAME}.</p><p><a href="${link}">Verify your email</a></p><p>Or use this link: ${link}</p>`,
  );
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const env = loadEnv();
  const link = `${env.WEB_ORIGIN}/reset-password?token=${encodeURIComponent(token)}`;
  await sendMail(
    to,
    `${env.APP_NAME} — Reset your password`,
    `<p>Reset your password:</p><p><a href="${link}">Choose a new password</a></p><p>${link}</p>`,
  );
}

export async function sendSetPasswordEmail(to: string, token: string) {
  const env = loadEnv();
  const link = `${env.WEB_ORIGIN}/set-password?token=${encodeURIComponent(token)}`;
  await sendMail(
    to,
    `${env.APP_NAME} — Set your password`,
    `<p>An account was created for you.</p><p><a href="${link}">Set your password</a></p><p>${link}</p>`,
  );
}
