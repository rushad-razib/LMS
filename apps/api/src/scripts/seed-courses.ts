import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { LAUNCH_COURSES } from "@arva/shared";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const defaults: Record<
  string,
  { overview: string; duration: string; priceBdt: number; outlineText: string }
> = {
  "Basic Computer": {
    overview:
      "Foundational computer literacy covering OS basics, office tools, internet safety, and everyday productivity skills.",
    duration: "2 months",
    priceBdt: 8000,
    outlineText:
      "- Computer hardware & OS\n- Typing & file management\n- MS Office essentials\n- Email & internet safety",
  },
  "Artificial Intelligence": {
    overview:
      "Practical introduction to AI concepts, tools, and applied workflows for beginners and career switchers.",
    duration: "3 months",
    priceBdt: 15000,
    outlineText:
      "- AI fundamentals\n- Prompting & productivity tools\n- Intro to ML concepts\n- Mini applied project",
  },
  "Web Development": {
    overview:
      "Hands-on web development from HTML/CSS/JS fundamentals to building and deploying modern websites.",
    duration: "4 months",
    priceBdt: 18000,
    outlineText:
      "- HTML & CSS\n- JavaScript essentials\n- Responsive UI\n- Intro to backend APIs\n- Deploy a project",
  },
  "Graphic Design": {
    overview:
      "Visual design fundamentals with practical work in layout, branding, and industry-standard design tools.",
    duration: "3 months",
    priceBdt: 12000,
    outlineText:
      "- Design principles\n- Typography & color\n- Branding basics\n- Portfolio pieces",
  },
  IELTS: {
    overview:
      "Structured IELTS preparation across listening, reading, writing, and speaking with practice tests.",
    duration: "2.5 months",
    priceBdt: 10000,
    outlineText:
      "- Listening strategies\n- Reading techniques\n- Writing Task 1 & 2\n- Speaking practice",
  },
  Freelancing: {
    overview:
      "How to start freelancing: profiles, proposals, client communication, delivery, and getting paid.",
    duration: "1.5 months",
    priceBdt: 7000,
    outlineText:
      "- Platform setup\n- Proposal writing\n- Pricing & negotiation\n- Delivery & reviews",
  },
};

async function main() {
  const { prisma } = await import("../db/prisma.js");

  for (const title of LAUNCH_COURSES) {
    const slug = slugify(title);
    const meta = defaults[title]!;
    await prisma.course.upsert({
      where: { slug },
      create: {
        title,
        slug,
        overview: meta.overview,
        duration: meta.duration,
        priceBdt: meta.priceBdt,
        outlineText: meta.outlineText,
        faqText:
          "Q: Do I need prior experience?\nA: Beginner-friendly batches are available.\n\nQ: Are classes live?\nA: Yes — live sessions are scheduled per batch after enrollment.",
        status: "PUBLISHED",
      },
      update: {
        title,
        overview: meta.overview,
        duration: meta.duration,
        priceBdt: meta.priceBdt,
        outlineText: meta.outlineText,
        status: "PUBLISHED",
      },
    });
    console.log(`Upserted course: ${title}`);
  }
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
