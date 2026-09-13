import { createHmac } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sharp from "sharp";
import { loadEnv } from "../../config/env.js";
import { AppError } from "../../common/errors.js";

const IMAGE_MIMES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);
const DOCUMENT_MIMES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/x-zip-compressed",
  "text/plain",
]);

const IMAGE_MAX_BYTES = 2 * 1024 * 1024;
const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
const SIGNED_TTL_SECONDS = 60 * 60;

export type StoredObject = {
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  fileName: string;
};

function uploadsRoot() {
  return path.resolve(process.cwd(), "uploads");
}

function s3Enabled() {
  const env = loadEnv();
  return Boolean(env.S3_BUCKET && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY);
}

function s3Client() {
  const env = loadEnv();
  return new S3Client({
    region: env.S3_REGION || "auto",
    endpoint: env.S3_ENDPOINT || undefined,
    forcePathStyle: Boolean(env.S3_ENDPOINT),
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
  });
}

function publicOrigin() {
  const env = loadEnv();
  return (env.API_ORIGIN || env.WEB_ORIGIN).replace(/\/$/, "");
}

function assertSafeKey(storageKey: string) {
  if (!storageKey || storageKey.includes("..") || path.isAbsolute(storageKey)) {
    throw new AppError(400, "Invalid storage key", "INVALID_STORAGE_KEY");
  }
}

function localPathFor(storageKey: string) {
  assertSafeKey(storageKey);
  const root = uploadsRoot();
  const full = path.resolve(root, storageKey);
  const relative = path.relative(root, full);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new AppError(400, "Invalid storage key", "INVALID_STORAGE_KEY");
  }
  return full;
}

function signPayload(storageKey: string, exp: number) {
  const env = loadEnv();
  return createHmac("sha256", env.JWT_ACCESS_SECRET)
    .update(`${storageKey}.${exp}`)
    .digest("hex");
}

function extFromName(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();
  return ext || "";
}

function basenameWithoutExt(fileName: string) {
  const ext = extFromName(fileName);
  return ext ? fileName.slice(0, -ext.length) : fileName;
}

function safeFileName(fileName: string) {
  const base = path.basename(fileName).replace(/[^\w.\- ]+/g, "_");
  return base.slice(0, 180) || "file";
}

export function classifyUpload(mimeType: string, sizeBytes: number) {
  const mime = mimeType.toLowerCase();
  if (IMAGE_MIMES.has(mime)) {
    if (sizeBytes > IMAGE_MAX_BYTES) {
      throw new AppError(400, "Images must be 2MB or smaller", "FILE_TOO_LARGE");
    }
    return "image" as const;
  }
  if (DOCUMENT_MIMES.has(mime)) {
    if (sizeBytes > DOCUMENT_MAX_BYTES) {
      throw new AppError(400, "Documents must be 10MB or smaller", "FILE_TOO_LARGE");
    }
    return "document" as const;
  }
  throw new AppError(400, "Unsupported file type", "UNSUPPORTED_FILE_TYPE");
}

async function putObject(storageKey: string, body: Buffer, mimeType: string) {
  if (s3Enabled()) {
    const env = loadEnv();
    await s3Client().send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: storageKey,
        Body: body,
        ContentType: mimeType,
      }),
    );
    return;
  }

  const dest = localPathFor(storageKey);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, body);
}

export async function storeMaterialFile(input: {
  batchId: string;
  originalName: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<StoredObject> {
  const kind = classifyUpload(input.mimeType, input.buffer.byteLength);
  const original = safeFileName(input.originalName);
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  if (kind === "image") {
    const webp = await sharp(input.buffer).webp({ quality: 82 }).toBuffer();
    const fileName = `${basenameWithoutExt(original) || "image"}.webp`;
    const storageKey = `batches/${input.batchId}/materials/${id}.webp`;
    await putObject(storageKey, webp, "image/webp");
    return {
      storageKey,
      mimeType: "image/webp",
      sizeBytes: webp.byteLength,
      fileName,
    };
  }

  const ext = extFromName(original) || ".bin";
  const storageKey = `batches/${input.batchId}/materials/${id}${ext}`;
  await putObject(storageKey, input.buffer, input.mimeType);
  return {
    storageKey,
    mimeType: input.mimeType,
    sizeBytes: input.buffer.byteLength,
    fileName: original,
  };
}

export async function deleteStoredObject(storageKey: string) {
  if (!storageKey || storageKey.startsWith("stubs/")) return;
  try {
    if (s3Enabled()) {
      const env = loadEnv();
      await s3Client().send(
        new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: storageKey }),
      );
      return;
    }
    await fs.unlink(localPathFor(storageKey));
  } catch (err) {
    console.error("deleteStoredObject failed", storageKey, err);
  }
}

export async function getDownloadUrl(storageKey: string) {
  assertSafeKey(storageKey);
  if (s3Enabled()) {
    const env = loadEnv();
    return getSignedUrl(
      s3Client(),
      new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: storageKey }),
      { expiresIn: SIGNED_TTL_SECONDS },
    );
  }

  const exp = Math.floor(Date.now() / 1000) + SIGNED_TTL_SECONDS;
  const sig = signPayload(storageKey, exp);
  const params = new URLSearchParams({
    key: storageKey,
    exp: String(exp),
    sig,
  });
  return `${publicOrigin()}/api/v1/media/download?${params.toString()}`;
}

export async function resolveMaterialUrl(material: {
  storageKey: string;
  url: string;
}) {
  if (!material.storageKey || material.storageKey.startsWith("stubs/")) {
    return material.url;
  }
  try {
    return await getDownloadUrl(material.storageKey);
  } catch (err) {
    console.error("resolveMaterialUrl failed", err);
    return material.url;
  }
}

export async function readLocalDownload(query: {
  key?: string;
  exp?: string;
  sig?: string;
}) {
  const storageKey = query.key ?? "";
  const exp = Number(query.exp);
  const sig = query.sig ?? "";
  if (!storageKey || !exp || !sig) {
    throw new AppError(400, "Invalid download link", "INVALID_DOWNLOAD");
  }
  if (exp < Math.floor(Date.now() / 1000)) {
    throw new AppError(410, "Download link expired", "DOWNLOAD_EXPIRED");
  }
  const expected = signPayload(storageKey, exp);
  if (expected.length !== sig.length) {
    throw new AppError(403, "Invalid download link", "INVALID_DOWNLOAD");
  }
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) {
    mismatch |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  if (mismatch !== 0) {
    throw new AppError(403, "Invalid download link", "INVALID_DOWNLOAD");
  }

  const filePath = localPathFor(storageKey);
  try {
    const body = await fs.readFile(filePath);
    return { body, fileName: path.basename(storageKey) };
  } catch {
    throw new AppError(404, "File not found", "NOT_FOUND");
  }
}
