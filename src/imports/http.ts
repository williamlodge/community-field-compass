// Polite HTTP client for source scrapers: identifies itself, enforces a
// minimum interval between requests, times out, and retries with backoff.
// Scrapers must never hammer community-resource sites — they are often
// hosted on small nonprofit infrastructure.

export interface HttpClientOptions {
  /** Minimum milliseconds between the start of two requests. Default 1500. */
  minIntervalMs?: number;
  /** Per-request timeout in milliseconds. Default 30000. */
  timeoutMs?: number;
  userAgent?: string;
  fetchImpl?: typeof fetch;
  /** Maximum retry attempts for retryable statuses (429, 5xx, network). Default 3. */
  maxRetries?: number;
}

const RETRYABLE = new Set([408, 429, 500, 502, 503, 504]);

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly url: string,
  ) {
    super(`HTTP ${status} for ${url}`);
    this.name = "HttpError";
  }
}

export interface HttpClient {
  get(url: string, headers?: Record<string, string>): Promise<Response>;
  post(url: string, json: unknown, headers?: Record<string, string>): Promise<Response>;
}

export function createHttpClient(options: HttpClientOptions = {}): HttpClient {
  const minIntervalMs = options.minIntervalMs ?? 1500;
  const timeoutMs = options.timeoutMs ?? 30000;
  const maxRetries = options.maxRetries ?? 3;
  const userAgent =
    options.userAgent ??
    "FieldCompassResourceBot/0.1 (+https://github.com/williamlodge/community-field-compass; community resource directory research; contact site owner before blocking)";
  const fetchImpl = options.fetchImpl ?? fetch;
  let lastStart = 0;

  async function request(method: string, url: string, init: RequestInit = {}): Promise<Response> {
    let attempt = 0;
    for (;;) {
      // Pace requests regardless of outcome.
      const wait = minIntervalMs - (Date.now() - lastStart);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      lastStart = Date.now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let response: Response;
      try {
        response = await fetchImpl(url, {
          ...init,
          method,
          signal: controller.signal,
          headers: { "user-agent": userAgent, accept: "application/json", ...init.headers },
        });
      } catch (err) {
        clearTimeout(timer);
        attempt++;
        if (attempt > maxRetries) throw err;
        await backoff(attempt);
        continue;
      }
      clearTimeout(timer);
      if (RETRYABLE.has(response.status)) {
        attempt++;
        if (attempt > maxRetries) throw new HttpError(response.status, url);
        await backoff(attempt);
        continue;
      }
      if (!response.ok) throw new HttpError(response.status, url);
      return response;
    }
  }

  return {
    get: (url, headers) => request("GET", url, { headers }),
    post: (url, json, headers) =>
      request("POST", url, { headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(json) }),
  };
}

async function backoff(attempt: number): Promise<void> {
  await new Promise((r) => setTimeout(r, Math.min(15000, 1000 * 2 ** attempt)));
}
