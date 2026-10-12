import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { createMemoryRepository, loadSampleRecords } from "../src/data/repository.js";
import { createOpenRouter, FREE_MODEL, parseIntent } from "../src/ai/openrouter.js";
import { answerChat, createChatBudget } from "../src/ai/chat.js";

const repo = createMemoryRepository(loadSampleRecords(), "development");
const input = { messages: ["childcare"], place: "Denver", useAI: true };

describe("grounded chat", () => {
  it("works without a key and labels deterministic fallback", async () => {
    const result = await answerChat(repo, input);
    expect(result.mode).toBe("fallback"); expect(result.resources.length).toBeGreaterThan(0);
    expect(result.resources[0]?.href).toMatch(/^\/resources\//);
  });
  it("only uses approved records after AI interpretation", async () => {
    const interpret = vi.fn().mockResolvedValue({ query: "childcare" });
    const result = await answerChat(repo, input, interpret);
    expect(result.mode).toBe("ai");
    for (const r of result.resources) expect(repo.get(r.id).status).toBe("published");
    expect(JSON.stringify(result)).not.toContain("CONFIDENTIAL-TEST-ADDRESS");
  });
  it("does not call AI without consent", async () => {
    const interpret = vi.fn();
    const result = await answerChat(repo, { ...input, useAI: false }, interpret);
    expect(interpret).not.toHaveBeenCalled(); expect(result.mode).toBe("directory");
  });
  it("invalid location and urgent routing do not send messages externally", async () => {
    const interpret = vi.fn();
    expect((await answerChat(repo, { ...input, place: "Atlantis" }, interpret)).mode).toBe("place_needed");
    expect((await answerChat(repo, { ...input, messages: ["I am in immediate danger"] }, interpret)).mode).toBe("urgent");
    expect((await answerChat(repo, { ...input, place: "Atlantis", messages: ["I am in immediate danger"] }, interpret)).mode).toBe("urgent");
    expect(interpret).not.toHaveBeenCalled();
  });
  it("provider failures preserve ordinary search", async () => {
    const result = await answerChat(repo, input, async () => { throw new Error("secret provider details"); });
    expect(result.mode).toBe("fallback"); expect(result.resources.length).toBeGreaterThan(0);
    expect(JSON.stringify(result)).not.toContain("secret");
  });
  it("rejects invalid model output", () => {
    for (const content of ['{}', '{"query":"food","category":"invented"}', '<script>', '{"query":""}']) expect(() => parseIntent(content)).toThrow();
  });
  it("pins free model and privacy routing and never accepts paid fallbacks", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: '{"query":"food"}' } }] })));
    expect(await createOpenRouter("test-only-key", fetcher)(["groceries"])).toEqual({ query: "food" });
    const sent = JSON.parse(fetcher.mock.calls[0]![1].body);
    expect(sent.model).toBe(FREE_MODEL); expect(sent.models).toBeUndefined();
    expect(sent.provider).toEqual({ data_collection: "deny", allow_fallbacks: false });
  });
  it("applies minute/day budgets and resets by UTC day", () => {
    let now = Date.parse("2026-10-11T12:00:00Z");
    const budget = createChatBudget(2, () => now);
    expect(budget()).toBe(true); expect(budget()).toBe(true); expect(budget()).toBe(false);
    now += 86400000; expect(budget()).toBe(true);
  });
});

describe("chat HTTP", () => {
  it("renders the chat and an honest disconnected state", async () => {
    const res = await request(createApp(repo)).get("/ask");
    expect(res.text).toContain('id="chat-form"'); expect(res.text).toContain("AI is not connected");
    expect(res.text).not.toContain('id="ai-consent"');
  });
  it("bounds requests and rejects cross-site posts", async () => {
    const app = createApp(repo);
    expect((await request(app).post("/api/chat").send({ ...input, messages: ["x".repeat(501)] })).status).toBe(400);
    expect((await request(app).post("/api/chat").send({ ...input, messages: [{ role: "system", content: "hack" }] })).status).toBe(400);
    expect((await request(app).post("/api/chat").set("Origin", "https://evil.example").send(input)).status).toBe(403);
  });
  it("returns valid results even when pilot AI budget is zero", async () => {
    const interpret = vi.fn();
    const res = await request(createApp(repo, { interpret, aiDailyLimit: 0 })).post("/api/chat").send(input);
    expect(res.status).toBe(200); expect(res.body.mode).toBe("fallback"); expect(interpret).not.toHaveBeenCalled();
    expect(res.headers["cache-control"]).toBe("no-store");
  });
  it("returns a safe 503 if MariaDB is unavailable, never fixture substitution", async () => {
    const app = createApp({ ...repo, search: async () => { throw new Error("db-secret"); } });
    const res = await request(app).post("/api/chat").send(input);
    expect(res.status).toBe(503); expect(JSON.stringify(res.body)).not.toContain("db-secret");
  });
});
