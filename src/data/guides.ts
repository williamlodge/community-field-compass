import { z } from "zod";
import type { QueryPool } from "./mariadb.js";

const step = z.object({ title: z.string().min(1).max(255), body: z.string().min(1).max(12000) });
const guide = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(128),
  title: z.string().min(1).max(255), summary: z.string().max(12000).nullable(),
  category: z.string().max(64), minutes: z.number().int().min(1).max(120),
  steps: z.array(step).min(1).max(50), updatedAt: z.string(),
});

export type PublicGuide = z.infer<typeof guide>;

export async function listPublishedGuides(pool: QueryPool): Promise<PublicGuide[]> {
  const rows = await pool.query({ sql: "SELECT slug, title, summary, category, minutes, steps, updated_at FROM guides WHERE active = 1 ORDER BY title LIMIT 1001", timeout: 5000 }) as Array<Record<string, unknown>>;
  if (rows.length > 1000) throw new Error("Guide list limit exceeded");
  let invalid = 0;
  const guides = rows.flatMap(row => {
    try {
      return [guide.parse({ ...row, steps: typeof row.steps === "string" ? JSON.parse(row.steps) : row.steps,
        updatedAt: new Date(row.updated_at as string | Date).toISOString() })];
    } catch { invalid++; return []; }
  });
  if (invalid) console.warn(`Skipped ${invalid} invalid published guides`);
  return guides;
}
