import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();

async function main() {
  const { prisma } = await import("../db/prisma.js");

  const batches = await prisma.batch.findMany({
    include: {
      course: { select: { title: true, slug: true } },
      _count: {
        select: { liveSessions: true, materials: true, announcements: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (batches.length === 0) {
    console.log("No batches found. Create a batch (admin) before seeding content.");
    return;
  }

  let seeded = 0;
  for (const batch of batches) {
    const hasContent =
      batch._count.liveSessions > 0 ||
      batch._count.materials > 0 ||
      batch._count.announcements > 0;
    if (hasContent) {
      console.log(`Skip ${batch.course.slug} / ${batch.name} (already has content)`);
      continue;
    }

    const start = new Date();
    start.setDate(start.getDate() + 3);
    start.setHours(19, 0, 0, 0);
    const end = new Date(start);
    end.setHours(20, 30, 0, 0);

    const past = new Date();
    past.setDate(past.getDate() - 7);
    past.setHours(19, 0, 0, 0);
    const pastEnd = new Date(past);
    pastEnd.setHours(20, 30, 0, 0);

    await prisma.liveSession.createMany({
      data: [
        {
          batchId: batch.id,
          title: "Orientation & toolkit setup",
          startsAt: past,
          endsAt: pastEnd,
          meetingUrl: "https://meet.google.com/lookup/arva-orientation",
          notes: "Recording available after class.",
        },
        {
          batchId: batch.id,
          title: "Live workshop",
          startsAt: start,
          endsAt: end,
          meetingUrl: "https://meet.google.com/lookup/arva-workshop",
          notes: "Join 5 minutes early.",
        },
      ],
    });

    await prisma.batchMaterial.create({
      data: {
        batchId: batch.id,
        title: "Course starter pack",
        fileName: "starter-pack.pdf",
        mimeType: "application/pdf",
        sizeBytes: 245_760,
        storageKey: `stubs/${batch.id}/starter-pack.pdf`,
        url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      },
    });

    await prisma.batchAnnouncement.create({
      data: {
        batchId: batch.id,
        title: "Welcome to your batch",
        body: `Welcome to ${batch.name} (${batch.course.title}). Check sessions and materials from your student portal.`,
      },
    });

    seeded += 1;
    console.log(`Seeded content for ${batch.course.slug} / ${batch.name}`);
  }

  console.log(`Done. Seeded ${seeded} batch(es).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    const { prisma } = await import("../db/prisma.js");
    await prisma.$disconnect();
  });
