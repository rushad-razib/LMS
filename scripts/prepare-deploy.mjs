/**
 * Builds a cPanel-friendly deploy tree under ./deploy
 * that can be rsynced and installed with npm (no pnpm workspaces on the server).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const deployRoot = path.join(root, "deploy");

function rmrf(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyDir(src, dest) {
  mkdirp(dest);
  fs.cpSync(src, dest, { recursive: true });
}

function assertExists(p, label) {
  if (!fs.existsSync(p)) {
    throw new Error(`Missing ${label}: ${p}. Run pnpm build first.`);
  }
}

const apiPkg = JSON.parse(
  fs.readFileSync(path.join(root, "apps/api/package.json"), "utf8"),
);
const sharedPkg = JSON.parse(
  fs.readFileSync(path.join(root, "packages/shared/package.json"), "utf8"),
);

assertExists(path.join(root, "apps/api/dist/server.js"), "API build");
assertExists(path.join(root, "apps/web/dist/index.html"), "Web build");
assertExists(path.join(root, "packages/shared/dist/index.js"), "Shared build");

rmrf(deployRoot);
mkdirp(deployRoot);

copyDir(path.join(root, "apps/api/dist"), path.join(deployRoot, "apps/api/dist"));
copyDir(path.join(root, "apps/api/prisma"), path.join(deployRoot, "apps/api/prisma"));
copyDir(path.join(root, "apps/web/dist"), path.join(deployRoot, "apps/web/dist"));
copyDir(
  path.join(root, "packages/shared/dist"),
  path.join(deployRoot, "packages/shared/dist"),
);

const deploySharedPkg = {
  name: sharedPkg.name,
  version: sharedPkg.version,
  private: true,
  type: "module",
  main: "./dist/index.js",
  exports: {
    ".": "./dist/index.js",
  },
  dependencies: {
    zod: sharedPkg.dependencies.zod,
  },
};
fs.writeFileSync(
  path.join(deployRoot, "packages/shared/package.json"),
  `${JSON.stringify(deploySharedPkg, null, 2)}\n`,
);

const deps = { ...apiPkg.dependencies };
deps["@arva/shared"] = "file:./packages/shared";
// prisma CLI needed on server for migrate deploy / generate
deps.prisma = apiPkg.devDependencies.prisma;

const deployPkg = {
  name: "lms-cpanel-deploy",
  private: true,
  type: "module",
  engines: { node: ">=20" },
  dependencies: deps,
};
fs.writeFileSync(
  path.join(deployRoot, "package.json"),
  `${JSON.stringify(deployPkg, null, 2)}\n`,
);

mkdirp(path.join(deployRoot, "tmp"));
fs.writeFileSync(path.join(deployRoot, "tmp/.gitkeep"), "");

console.log(`Deploy tree ready at ${deployRoot}`);
