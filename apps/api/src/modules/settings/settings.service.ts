import { prisma } from "../../db/prisma.js";

export async function getSettings() {
  return prisma.websiteSettings.upsert({
    where: { id: "default" },
    create: { id: "default", emailVerificationRequired: true },
    update: {},
  });
}

export async function updateSettings(input: { emailVerificationRequired: boolean }) {
  return prisma.websiteSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      emailVerificationRequired: input.emailVerificationRequired,
    },
    update: {
      emailVerificationRequired: input.emailVerificationRequired,
    },
  });
}
