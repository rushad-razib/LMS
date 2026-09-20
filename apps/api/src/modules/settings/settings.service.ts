import type { UpdateSettingsInput } from "@arva/shared";
import { prisma } from "../../db/prisma.js";

export type WebsiteSettingsDto = {
  emailVerificationRequired: boolean;
  contactPhone: string | null;
  contactEmail: string | null;
  address: string | null;
  businessHours: string | null;
  whatsappNumber: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  mapEmbedHtml: string | null;
  announcementBar: string | null;
};

export function toSettingsDto(row: {
  emailVerificationRequired: boolean;
  contactPhone: string | null;
  contactEmail: string | null;
  address: string | null;
  businessHours: string | null;
  whatsappNumber: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  mapEmbedHtml: string | null;
  announcementBar: string | null;
}): WebsiteSettingsDto {
  return {
    emailVerificationRequired: row.emailVerificationRequired,
    contactPhone: row.contactPhone,
    contactEmail: row.contactEmail,
    address: row.address,
    businessHours: row.businessHours,
    whatsappNumber: row.whatsappNumber,
    facebookUrl: row.facebookUrl,
    instagramUrl: row.instagramUrl,
    youtubeUrl: row.youtubeUrl,
    mapEmbedHtml: row.mapEmbedHtml,
    announcementBar: row.announcementBar,
  };
}

export async function getSettings() {
  return prisma.websiteSettings.upsert({
    where: { id: "default" },
    create: { id: "default", emailVerificationRequired: true },
    update: {},
  });
}

export async function updateSettings(input: UpdateSettingsInput) {
  const data: Record<string, unknown> = {};
  if (input.emailVerificationRequired !== undefined) {
    data.emailVerificationRequired = input.emailVerificationRequired;
  }
  if (input.contactPhone !== undefined) data.contactPhone = input.contactPhone;
  if (input.contactEmail !== undefined) data.contactEmail = input.contactEmail;
  if (input.address !== undefined) data.address = input.address;
  if (input.businessHours !== undefined) data.businessHours = input.businessHours;
  if (input.whatsappNumber !== undefined) data.whatsappNumber = input.whatsappNumber;
  if (input.facebookUrl !== undefined) data.facebookUrl = input.facebookUrl;
  if (input.instagramUrl !== undefined) data.instagramUrl = input.instagramUrl;
  if (input.youtubeUrl !== undefined) data.youtubeUrl = input.youtubeUrl;
  if (input.mapEmbedHtml !== undefined) data.mapEmbedHtml = input.mapEmbedHtml;
  if (input.announcementBar !== undefined) data.announcementBar = input.announcementBar;

  return prisma.websiteSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      emailVerificationRequired: input.emailVerificationRequired ?? true,
      contactPhone: input.contactPhone ?? null,
      contactEmail: input.contactEmail ?? null,
      address: input.address ?? null,
      businessHours: input.businessHours ?? null,
      whatsappNumber: input.whatsappNumber ?? null,
      facebookUrl: input.facebookUrl ?? null,
      instagramUrl: input.instagramUrl ?? null,
      youtubeUrl: input.youtubeUrl ?? null,
      mapEmbedHtml: input.mapEmbedHtml ?? null,
      announcementBar: input.announcementBar ?? null,
    },
    update: data,
  });
}

export async function getPublicSettings() {
  const settings = await getSettings();
  return {
    contactPhone: settings.contactPhone,
    contactEmail: settings.contactEmail,
    address: settings.address,
    businessHours: settings.businessHours,
    whatsappNumber: settings.whatsappNumber,
    facebookUrl: settings.facebookUrl,
    instagramUrl: settings.instagramUrl,
    youtubeUrl: settings.youtubeUrl,
    mapEmbedHtml: settings.mapEmbedHtml,
    announcementBar: settings.announcementBar,
  };
}
