import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();

import { loadEnv } from "./config/env.js";
import { createApp } from "./app.js";

const env = loadEnv();
const app = createApp(env);

// cPanel / Passenger injects PORT; local/dev uses API_PORT
const port = Number(process.env.PORT) || env.API_PORT;

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
