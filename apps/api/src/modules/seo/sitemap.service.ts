import type { Env } from "../../config/env.js";
import { listPublishedCourses } from "../courses/courses.service.js";
import { listPublishedBlogPosts } from "../content/content.service.js";

const STATIC_PATHS = [
  "/",
  "/about",
  "/courses",
  "/trainers",
  "/gallery",
  "/blog",
  "/contact",
  "/faq",
  "/privacy",
  "/terms",
];

function siteOrigin(env: Env): string {
  const raw = (env.WEB_ORIGIN || "https://lms.rushadrazib.com").replace(/\/$/, "");
  // Local Vite origin is not useful in XML for crawlers; prefer production host in test/dev
  // when WEB_ORIGIN points at the Vite port — still fine for tests asserting path segments.
  return raw;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(loc: string, lastmod?: string | null): string {
  const last = lastmod
    ? `\n    <lastmod>${escapeXml(lastmod.slice(0, 10))}</lastmod>`
    : "";
  return `  <url>\n    <loc>${escapeXml(loc)}</loc>${last}\n  </url>`;
}

export async function buildSitemapXml(env: Env): Promise<string> {
  const origin = siteOrigin(env);
  const entries: string[] = [];

  for (const p of STATIC_PATHS) {
    const loc = p === "/" ? `${origin}/` : `${origin}${p}`;
    entries.push(urlEntry(loc));
  }

  const [courses, posts] = await Promise.all([
    listPublishedCourses(),
    listPublishedBlogPosts(),
  ]);

  for (const course of courses) {
    entries.push(
      urlEntry(`${origin}/courses/${course.slug}`, course.updatedAt),
    );
  }

  for (const post of posts) {
    entries.push(
      urlEntry(
        `${origin}/blog/${post.slug}`,
        post.updatedAt || post.publishedAt,
      ),
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>
`;
}
