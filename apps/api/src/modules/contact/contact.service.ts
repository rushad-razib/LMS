import type { ContactLeadInput } from "@arva/shared";
import { prisma } from "../../db/prisma.js";
import { AppError } from "../../common/errors.js";
import { loadEnv } from "../../config/env.js";
import { getSettings } from "../settings/settings.service.js";
import { sendLeadNotificationEmail } from "./contact.email.js";

function serialize(lead: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...lead,
    readAt: lead.readAt?.toISOString() ?? null,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  };
}

export async function submitLead(input: ContactLeadInput) {
  const lead = await prisma.lead.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      subject: input.subject,
      message: input.message,
    },
  });

  const settings = await getSettings();
  const env = loadEnv();
  const inbox = settings.contactEmail || env.ADMIN_EMAIL;
  if (inbox) {
    try {
      await sendLeadNotificationEmail(inbox, {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        subject: lead.subject,
        message: lead.message,
      });
    } catch (err) {
      console.error("Lead notification email failed", err);
    }
  } else {
    console.log(
      "\n[email:dev-fallback] Lead saved but no contactEmail/ADMIN_EMAIL configured\n",
      lead.email,
      lead.subject,
    );
  }

  return { ok: true as const, leadId: lead.id };
}

export async function adminListLeads() {
  const rows = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(serialize);
}

export async function markLeadRead(id: string) {
  const existing = await prisma.lead.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Lead not found", "NOT_FOUND");
  const lead = await prisma.lead.update({
    where: { id },
    data: { readAt: existing.readAt ?? new Date() },
  });
  return serialize(lead);
}

export async function unreadLeadCount() {
  return prisma.lead.count({ where: { readAt: null } });
}
