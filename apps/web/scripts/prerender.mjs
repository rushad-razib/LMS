/**
 * Post-build prerender for static marketing routes (Phase 7).
 * Serves apps/web/dist, visits each route with Puppeteer, writes HTML snapshots.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist");

const ROUTES = [
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

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  if (filePath.endsWith(".json")) return "application/json";
  if (filePath.endsWith(".txt")) return "text/plain; charset=utf-8";
  if (filePath.endsWith(".webp")) return "image/webp";
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".ico")) return "image/x-icon";
  return "application/octet-stream";
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
      const candidate = path.join(distDir, urlPath === "/" ? "index.html" : urlPath);
      const filePath = candidate.startsWith(distDir) ? candidate : null;

      if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        res.writeHead(200, { "Content-Type": contentType(filePath) });
        fs.createReadStream(filePath).pipe(res);
        return;
      }

      // SPA fallback for client routes during prerender
      const indexHtml = path.join(distDir, "index.html");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      fs.createReadStream(indexHtml).pipe(res);
    });

    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") {
        reject(new Error("Failed to bind prerender server"));
        return;
      }
      resolve({ server, port: addr.port });
    });
    server.on("error", reject);
  });
}

function outPathForRoute(route) {
  if (route === "/") return path.join(distDir, "index.html");
  const dir = path.join(distDir, route.replace(/^\//, ""));
  return path.join(dir, "index.html");
}

async function main() {
  if (!fs.existsSync(path.join(distDir, "index.html"))) {
    throw new Error(`Missing ${distDir}/index.html — run vite build first`);
  }

  const { server, port } = await startStaticServer();
  const base = `http://127.0.0.1:${port}`;
  console.log(`[prerender] serving ${distDir} at ${base}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    for (const route of ROUTES) {
      const page = await browser.newPage();
      const url = `${base}${route}`;
      await page.goto(url, { waitUntil: "networkidle0", timeout: 60_000 });
      // Allow Helmet to flush title/meta
      await page.waitForFunction(() => document.title.length > 0, { timeout: 10_000 });
      // Give Helmet a tick in StrictMode, then collapse duplicate head tags using
      // the browser's effective document.title / last meta values.
      await new Promise((r) => setTimeout(r, 150));
      await page.evaluate(() => {
        const effectiveTitle = document.title;
        document.querySelectorAll("title").forEach((n) => n.remove());
        const titleEl = document.createElement("title");
        titleEl.textContent = effectiveTitle;
        document.head.insertBefore(titleEl, document.head.firstChild);

        const collapseMeta = (attr, key) => {
          const nodes = [...document.querySelectorAll(`meta[${attr}="${key}"]`)];
          if (nodes.length <= 1) return;
          const content = nodes[nodes.length - 1].getAttribute("content");
          nodes.forEach((n) => n.remove());
          const meta = document.createElement("meta");
          meta.setAttribute(attr, key);
          if (content) meta.setAttribute("content", content);
          document.head.appendChild(meta);
        };
        collapseMeta("name", "description");
        collapseMeta("name", "robots");
        collapseMeta("property", "og:title");
        collapseMeta("property", "og:description");
        collapseMeta("property", "og:url");
        collapseMeta("property", "og:type");
        collapseMeta("property", "og:site_name");
        collapseMeta("name", "twitter:card");
        collapseMeta("name", "twitter:title");
        collapseMeta("name", "twitter:description");

        const links = [...document.querySelectorAll('link[rel="canonical"]')];
        if (links.length > 1) {
          const href = links[links.length - 1].getAttribute("href");
          links.forEach((n) => n.remove());
          const link = document.createElement("link");
          link.setAttribute("rel", "canonical");
          if (href) link.setAttribute("href", href);
          document.head.appendChild(link);
        }
      });
      const html = await page.content();
      const out = outPathForRoute(route);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, html, "utf8");
      console.log(`[prerender] wrote ${path.relative(distDir, out)}`);
      await page.close();
    }
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }

  console.log("[prerender] done");
}

main().catch((err) => {
  console.error("[prerender] failed:", err);
  process.exit(1);
});
