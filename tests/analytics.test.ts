import { describe, expect, it } from "vitest";
import { contentSecurityPolicy, loadAnalytics } from "../src/web/analytics.js";

const ID = "1b9f3c1e-2d4a-4f6b-8c7d-9e0f1a2b3c4d";

describe("analytics", () => {
  it("is off unless UMAMI_WEBSITE_ID is set", () => {
    expect(loadAnalytics({})).toBeNull();
    expect(contentSecurityPolicy(null)).toContain("script-src 'self';");
    expect(contentSecurityPolicy(null)).toContain("connect-src 'self';");
  });

  it("allows only the Umami origin for scripts and beacons", () => {
    const a = loadAnalytics({ UMAMI_WEBSITE_ID: ID, UMAMI_ORIGIN: "https://stats.example.com/ignored/path" });
    expect(a).toEqual({ origin: "https://stats.example.com", websiteId: ID });
    const csp = contentSecurityPolicy(a);
    expect(csp).toContain("script-src 'self' https://stats.example.com;");
    expect(csp).toContain("connect-src 'self' https://stats.example.com;");
    expect(csp).toContain("default-src 'self';");
  });

  it("rejects a malformed website id", () => {
    expect(() => loadAnalytics({ UMAMI_WEBSITE_ID: '"><script>' })).toThrow(/UUID/);
  });
});
