import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();

async function main() {
  const { loadEnv } = await import("../config/env.js");
  const { prisma } = await import("../db/prisma.js");
  const env = loadEnv();

  await prisma.websiteSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      // Dev-friendly default; turn on in production via admin settings
      emailVerificationRequired: env.NODE_ENV === "production",
    },
    update: {},
  });

  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    console.log("Skip admin seed (set ADMIN_EMAIL and ADMIN_PASSWORD).");
    return;
  }

  const email = env.ADMIN_EMAIL.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
  await prisma.user.create({
    data: {
      email,
      fullName: env.ADMIN_NAME,
      role: "ADMIN",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      passwordHash,
    },
  });
  console.log(`Seeded admin: ${email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("../db/prisma.js");
    await prisma.$disconnect();
  });
