import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Express } from "express";
import { prisma } from "../../db/prisma.js";
import {
  api,
  buildTestApp,
  cleanupCoursesBySlugPrefix,
} from "../../test/helpers.js";

const SLUG_PREFIX = "phase7-seo-";

describe("Phase 7 — sitemap", () => {
  let app: Express;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  beforeEach(async () => {
    await cleanupCoursesBySlugPrefix(SLUG_PREFIX);
    await prisma.blogPost.deleteMany({ where: { slug: { startsWith: SLUG_PREFIX } } });
  });

  afterAll(async () => {
    await cleanupCoursesBySlugPrefix(SLUG_PREFIX);
    await prisma.blogPost.deleteMany({ where: { slug: { startsWith: SLUG_PREFIX } } });
    await prisma.$disconnect();
  });

  it("returns sitemap.xml with static routes and published course/blog URLs", async () => {
    const course = await prisma.course.create({
      data: {
        title: "Phase7 Sitemap Course",
        slug: `${SLUG_PREFIX}course`,
        overview: "Overview for sitemap test",
        duration: "4 weeks",
        priceBdt: 1000,
        status: "PUBLISHED",
      },
    });

    const post = await prisma.blogPost.create({
      data: {
        title: "Phase7 Sitemap Post",
        slug: `${SLUG_PREFIX}post`,
        excerpt: "Excerpt",
        bodyHtml: "<p>Hello</p>",
        published: true,
        publishedAt: new Date(),
      },
    });

    const res = await api(app).get("/sitemap.xml");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/xml/);
    expect(res.text).toContain("<urlset");
    expect(res.text).toContain("/about");
    expect(res.text).toContain("/courses");
    expect(res.text).toContain("/blog");
    expect(res.text).toContain(`/courses/${course.slug}`);
    expect(res.text).toContain(`/blog/${post.slug}`);
    expect(res.text).not.toContain("/admin");
    expect(res.text).not.toContain("/login");
  });
});
