import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { createMemoryRepository, loadSampleRecords } from "./data/repository.js";
import { createMariaRepository, openResourcePool } from "./data/mariadb.js";
import { createOpenRouter } from "./ai/openrouter.js";

// Built-in env loader; never expose these values to the browser.
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
if (existsSync(".env")) loadEnvFile(".env");

const config = loadConfig();
const source = process.env.RESOURCE_SOURCE ?? "sample";
if (!["sample", "mariadb"].includes(source)) throw new Error("Invalid RESOURCE_SOURCE");
const pool = source === "mariadb" ? openResourcePool() : undefined;
const repo = pool ? createMariaRepository(pool, config.env) : createMemoryRepository(loadSampleRecords(), config.env);
const aiDailyLimit = Number(process.env.AI_DAILY_LIMIT ?? 40);
if (!Number.isInteger(aiDailyLimit) || aiDailyLimit < 0 || aiDailyLimit > 1000) throw new Error("Invalid AI_DAILY_LIMIT");
const interpret = process.env.OPENROUTER_API_KEY && process.env.AI_ENABLED === "true"
  ? createOpenRouter(process.env.OPENROUTER_API_KEY) : undefined;
const app = createApp(repo, { interpret, aiDailyLimit });

const server = app.listen(config.port, "127.0.0.1", () => {
  console.log(`FieldCompass (${config.env}) listening on http://localhost:${config.port}`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) process.on(signal, () => {
  server.close(() => { void pool?.end().finally(() => process.exit(0)); if (!pool) process.exit(0); });
});
