/** Optional self-hosted Umami analytics (cookie-free, no personal data). Off unless UMAMI_WEBSITE_ID is set. */
export interface Analytics {
  origin: string;
  websiteId: string;
}

export function loadAnalytics(env: NodeJS.ProcessEnv = process.env): Analytics | null {
  const websiteId = env.UMAMI_WEBSITE_ID?.trim();
  if (!websiteId) return null;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(websiteId)) {
    throw new Error(`UMAMI_WEBSITE_ID must be a UUID (got "${websiteId}")`);
  }
  const origin = new URL(env.UMAMI_ORIGIN ?? "https://stats.williamlodge.com").origin;
  return { origin, websiteId };
}

export const analytics = loadAnalytics();

export function contentSecurityPolicy(a: Analytics | null = analytics): string {
  const extra = a ? ` ${a.origin}` : "";
  return `default-src 'self'; script-src 'self'${extra}; style-src 'self'; img-src 'self' data:; connect-src 'self'${extra}; frame-ancestors 'none'; base-uri 'none'; form-action 'self'`;
}
