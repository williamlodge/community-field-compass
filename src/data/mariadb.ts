import { createPool, type Pool } from "mariadb";
import { readFileSync } from "node:fs";
import type { AppEnv } from "../config.js";
import { createMemoryRepository, type ResourceRepository } from "./repository.js";
import { parseResource } from "./schema.js";

export type QueryPool = Pick<Pool, "query">;

export function openResourcePool(env: NodeJS.ProcessEnv = process.env): Pool {
  for (const key of ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"]) {
    if (!env[key]?.trim()) throw new Error(`Missing ${key}`);
  }
  const local = ["localhost", "127.0.0.1", "::1"].includes(env.DB_HOST!);
  if (!local && env.DB_TLS !== "true") throw new Error("Remote MariaDB connections require DB_TLS=true");
  const port = Number(env.DB_PORT ?? 3306);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid DB_PORT");
  return createPool({
    host: env.DB_HOST, port, database: env.DB_NAME, user: env.DB_USER, password: env.DB_PASSWORD,
    connectionLimit: 5, connectTimeout: 5000, acquireTimeout: 5000,
    ssl: env.DB_TLS === "true" ? { rejectUnauthorized: true, ...(env.DB_CA_FILE ? { ca: readFileSync(env.DB_CA_FILE, "utf8") } : {}) } : undefined,
    multipleStatements: false,
  });
}

/** Pilot adapter: bounded read-through search; never writes to the user's DB. */
export function createMariaRepository(pool: QueryPool, env: AppEnv): ResourceRepository {
  return {
    hasSampleData: () => false, // Every sample is rejected, including outside production.
    async search(filters) {
      const rows = await pool.query({ sql: "SELECT id, publication_status, record_json FROM fc_resources WHERE publication_status = 'published' ORDER BY id LIMIT 10001", timeout: 5000 });
      if (rows.length > 10000) throw new Error("Pilot dataset limit exceeded; indexed search required");
      const records = rows.map(readRow);
      return createMemoryRepository(records, env).search(filters);
    },
    async get(id) {
      const rows = await pool.query({ sql: "SELECT id, publication_status, record_json FROM fc_resources WHERE id = ? LIMIT 1", timeout: 5000 }, [id]);
      if (!rows.length) return { status: "not_found" };
      return createMemoryRepository([readRow(rows[0])], env).get(id);
    },
  };
}

function readRow(row: { id: string; publication_status: string; record_json: unknown }) {
  const resource = parseResource(typeof row.record_json === "string" ? JSON.parse(row.record_json) : row.record_json);
  if (resource.id !== row.id || resource.publication_status !== row.publication_status) throw new Error("Resource envelope mismatch");
  if (resource.is_sample) throw new Error("Sample records cannot be served from MariaDB");
  return resource;
}
