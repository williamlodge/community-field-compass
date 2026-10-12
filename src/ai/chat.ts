import type { ResourceRepository } from "../data/repository.js";
import { resolvePlace } from "../domain/geography.js";
import type { Interpret } from "./openrouter.js";

export interface ChatInput { messages: string[]; place: string; useAI: boolean }

export function parseChatInput(body: unknown): ChatInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (!Array.isArray(b.messages) || !b.messages.length || b.messages.length > 6 ||
      b.messages.some((m) => typeof m !== "string" || !m.trim() || m.length > 500) ||
      typeof b.place !== "string" || b.place.length > 60 || typeof b.useAI !== "boolean") return null;
  return { messages: b.messages.map((m: string) => m.trim()), place: b.place.trim(), useAI: b.useAI };
}

/** No generated prose is published: all resource details come from the directory. */
export async function answerChat(repo: ResourceRepository, input: ChatInput, interpret?: Interpret) {
  const last = input.messages.at(-1)!;
  // A narrow routing aid, not a safety classifier. Urgent help remains visible at all times.
  if (/\b(suicid\w*|kill myself|end my life|overdose|immediate danger|can't breathe|cannot breathe|matarme|suicidio|peligro inmediato)\b/i.test(last)) {
    return { mode: "urgent", resources: [], query: "", total: 0 };
  }
  const place = resolvePlace(input.place);
  if (input.place && !place) return { mode: "place_needed", resources: [], query: last, total: 0 };
  let intent = { query: last.slice(0, 200) };
  let mode = input.useAI ? "fallback" : "directory";
  if (input.useAI && interpret) {
    try { intent = await interpret(input.messages); mode = "ai"; }
    catch { /* Deliberately no provider errors or prompt text in logs. */ }
  }
  const result = await repo.search({ q: intent.query, place });
  return {
    mode, query: intent.query, total: result.total,
    resources: result.hits.slice(0, 3).map(({ resource: r, unconfirmed }) => ({
      id: r.id, name: r.name, summary: r.summary, eligibility: r.eligibility,
      intake: r.intake, documents: r.documents, operating_status: r.operating_status,
      reviewed_at: r.reviewed_at, is_sample: r.is_sample, unconfirmed,
      sources: r.sources.map(({ name, url }) => ({ name, url })),
      // All navigation URLs are constructed by the server, never the model.
      href: `/resources/${encodeURIComponent(r.id)}`,
    })),
  };
}

/** Single-process pilot budget. Shared/durable limiting required before scaling. */
export function createChatBudget(limit = 40, now: () => number = Date.now) {
  let day = ""; let daily = 0; let minute = 0; let perMinute = 0;
  return () => {
    const time = now(); const nextDay = new Date(time).toISOString().slice(0, 10);
    if (day !== nextDay) { day = nextDay; daily = 0; }
    const nextMinute = Math.floor(time / 60000);
    if (minute !== nextMinute) { minute = nextMinute; perMinute = 0; }
    if (daily >= limit || perMinute >= 15) return false;
    daily++; perMinute++; return true;
  };
}
