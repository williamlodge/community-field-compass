import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import express, { type NextFunction, type Request, type Response } from "express";
import { isCategoryId } from "./domain/categories.js";
import { resolvePlace } from "./domain/geography.js";
import type { SearchFilters } from "./domain/search.js";
import type { AccessMode, CategoryId } from "./domain/types.js";
import type { ResourceRepository } from "./data/repository.js";
import { isLang, t, type Lang } from "./i18n/index.js";
import type { PageContext } from "./web/layout.js";
import { detailPage, goneOrMissingPage } from "./web/pages/detail.js";
import { discoverPage } from "./web/pages/discover.js";
import { searchPage, type SearchView } from "./web/pages/search.js";
import { askPage, guidesPage, messagePage, savedPage, urgentPage } from "./web/pages/simple.js";

const MODES: AccessMode[] = ["in_person", "virtual", "phone"];
const PUBLIC_DIR = fileURLToPath(new URL("../public", import.meta.url));

declare module "express-serve-static-core" {
  interface Request {
    id: string;
    lang: Lang;
  }
}

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function readLangCookie(header: string | undefined): Lang | null {
  const m = /(?:^|;\s*)fc_lang=(en|es)\b/.exec(header ?? "");
  return m ? (m[1] as Lang) : null;
}

/** Parse and bound search input shared by the page and the API. */
export function parseSearch(query: Request["query"]): Omit<SearchView, "result"> {
  const params = {
    q: str(query.q, 200),
    place: str(query.place, 60),
    category: (isCategoryId(query.category) ? query.category : "") as CategoryId | "",
    language: query.language === "en" || query.language === "es" ? query.language : "",
    free: query.free === "1" || query.free === "true",
    mode: MODES.includes(query.mode as AccessMode) ? (query.mode as AccessMode) : "",
    wheelchair: query.wheelchair === "1" || query.wheelchair === "true",
  };
  const place = resolvePlace(params.place);
  const filters: SearchFilters = {
    q: params.q || undefined,
    place,
    category: params.category || undefined,
    language: params.language || undefined,
    free: params.free || undefined,
    mode: (params.mode || undefined) as AccessMode | undefined,
    wheelchair: params.wheelchair || undefined,
  };
  return { params, filters, placeUnrecognized: !!params.place && !place };
}

export function createApp(repo: ResourceRepository) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", "loopback");

  app.use((req, res, next) => {
    req.id = randomUUID();
    res.setHeader("X-Request-Id", req.id);
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "geolocation=(self), microphone=(), camera=()");

    const fromQuery = isLang(req.query.lang) ? req.query.lang : null;
    req.lang = fromQuery ?? readLangCookie(req.headers.cookie) ?? "en";
    if (fromQuery) res.cookie("fc_lang", fromQuery, { sameSite: "lax", httpOnly: true, maxAge: 365 * 864e5 });
    next();
  });

  app.use("/static", express.static(PUBLIC_DIR, { maxAge: "1h" }));

  const ctx = (req: Request): PageContext => ({
    lang: req.lang,
    url: req.originalUrl,
    showSampleBanner: repo.hasSampleData(),
  });

  // ---- Public pages -------------------------------------------------------

  app.get("/", (req, res) => {
    res.send(discoverPage(ctx(req)));
  });

  app.get("/search", (req, res) => {
    const parsed = parseSearch(req.query);
    const result = repo.search(parsed.filters);
    res.send(searchPage(ctx(req), { ...parsed, result }));
  });

  app.get("/resources/:id", (req, res) => {
    const found = repo.get(str(req.params.id, 80));
    if (found.status === "published") {
      const ref = req.get("referer");
      const back = ref && /^https?:\/\/[^/]+\/search\?/.test(ref) && new URL(ref).host === req.get("host") ? new URL(ref).pathname + new URL(ref).search : null;
      res.send(detailPage(ctx(req), found.resource, back));
      return;
    }
    res.status(found.status === "withdrawn" ? 410 : 404).send(goneOrMissingPage(ctx(req), found.status));
  });

  app.get("/saved", (req, res) => res.send(savedPage(ctx(req))));
  app.get("/ask", (req, res) => res.send(askPage(ctx(req))));
  app.get("/guides", (req, res) => res.send(guidesPage(ctx(req))));
  app.get("/urgent", (req, res) => res.send(urgentPage(ctx(req))));

  // ---- JSON API (handoff §5) ---------------------------------------------

  const api = express.Router();
  api.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });

  api.get("/resources", (req, res) => {
    const parsed = parseSearch(req.query);
    const page = Math.max(1, Math.min(50, Number(req.query.page) || 1));
    const pageSize = Math.max(1, Math.min(50, Number(req.query.page_size) || 20));
    const result = repo.search(parsed.filters);
    const slice = result.hits.slice((page - 1) * pageSize, page * pageSize);
    res.json({
      request_id: req.id,
      query: { ...parsed.params, place_resolved: parsed.filters.place ?? null, place_unrecognized: parsed.placeUnrecognized },
      total: result.total,
      page,
      page_size: pageSize,
      relaxations: result.relaxations,
      results: slice.map((h) => ({ resource: h.resource, reasons: h.reasons, unconfirmed: h.unconfirmed })),
    });
  });

  api.get("/resources/:id", (req, res) => {
    const found = repo.get(str(req.params.id, 80));
    if (found.status === "published") {
      res.json({ request_id: req.id, status: "published", resource: found.resource });
    } else if (found.status === "withdrawn") {
      res.status(410).json({ request_id: req.id, status: "withdrawn", id: found.id, record_version: found.record_version });
    } else {
      res.status(404).json({ request_id: req.id, status: "not_found", error: "No published resource with that ID." });
    }
  });

  api.use((req, res) => {
    res.status(404).json({ request_id: req.id, error: "Unknown API route." });
  });

  app.use("/api", api);

  app.get("/healthz", (_req, res) => {
    res.json({ ok: true });
  });

  // ---- Fallbacks ----------------------------------------------------------

  app.use((req, res) => {
    res.status(404).send(messagePage(ctx(req), t(req.lang, "notFound.title")));
  });

  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    // Log the request ID and error type only; no query text or personal data.
    console.error(`[${req.id}] ${err instanceof Error ? err.name + ": " + err.message : "unknown error"}`);
    if (req.path.startsWith("/api/")) {
      res.status(500).json({ request_id: req.id, error: "Something went wrong. Please try again." });
      return;
    }
    res.status(500).send(messagePage(ctx(req), t(req.lang ?? "en", "error.title"), t(req.lang ?? "en", "error.body")));
  });

  return app;
}
