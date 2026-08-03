import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
dotenv.config({ path: path.join(rootDir, ".env") });

process.env.NODE_ENV = "test";
process.env.RESEND_API_KEY = "";
