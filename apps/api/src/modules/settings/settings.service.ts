import type { UpdateSettingsInput } from "@arva/shared";
import { prisma } from "../../db/prisma.js";
import { getDownloadUrl } from "../media/media.service.js";

export type WebsiteSettingsDto = {
  emailVerificationRequired: boolean;
  siteName: string | null;
  headerLogoKey: string | null;
  headerLogoUrl: string | null;
  footerLogoKey: string | null;
  footerLogoUrl: string | null;
  footerCopyright: string | null;
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

type SettingsRow = {
  emailVerificationRequired: boolean;
  siteName: string | null;
  headerLogoKey: string | null;
  headerLogoUrl: string | null;
  footerLogoKey: string | null;
  footerLogoUrl: string | null;
  footerCopyright: string | null;
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

async function resolveLogoUrl(
  key: string | null,
  fallback: string | null,
): Promise<string | null> {
  if (!key) return fallback;
  try {
    return await getDownloadUrl(key);
  } catch (err) {
    console.error("resolveLogoUrl failed", err);
    return fallback;
  }
}

export async function toSettingsDto(row: SettingsRow): Promise<WebsiteSettingsDto> {
  const [headerLogoUrl, footerLogoUrl] = await Promise.all([
    resolveLogoUrl(row.headerLogoKey, row.headerLogoUrl),
    resolveLogoUrl(row.footerLogoKey, row.footerLogoUrl),
  ]);
  return {
    emailVerificationRequired: row.emailVerificationRequired,
    siteName: row.siteName,
    headerLogoKey: row.headerLogoKey,
    headerLogoUrl,
    footerLogoKey: row.footerLogoKey,
    footerLogoUrl,
    footerCopyright: row.footerCopyright,
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
  if (input.siteName !== undefined) data.siteName = input.siteName;
  if (input.footerCopyright !== undefined) data.footerCopyright = input.footerCopyright;
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
      siteName: input.siteName ?? null,
      footerCopyright: input.footerCopyright ?? null,
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
  const dto = await toSettingsDto(settings);
  return {
    siteName: dto.siteName,
    headerLogoUrl: dto.headerLogoUrl,
    footerLogoUrl: dto.footerLogoUrl,
    footerCopyright: dto.footerCopyright,
    contactPhone: dto.contactPhone,
    contactEmail: dto.contactEmail,
    address: dto.address,
    businessHours: dto.businessHours,
    whatsappNumber: dto.whatsappNumber,
    facebookUrl: dto.facebookUrl,
    instagramUrl: dto.instagramUrl,
    youtubeUrl: dto.youtubeUrl,
    mapEmbedHtml: dto.mapEmbedHtml,
    announcementBar: dto.announcementBar,
  };
}
