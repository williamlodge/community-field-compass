// Source registry. Every scraped record carries provenance (FC-23 source
// permission). Reuse rights are intentionally marked "review required" until
// a documented agreement with each source owner exists — records produced by
// scrapers must stay drafts until a human reviewer clears provenance.

import type { SourceRef } from "../domain/types.js";

export interface SourceDefinition {
  /** Stable identifier stored in Resource.sources[].id and contact.source_id. */
  id: string;
  name: string;
  url: string;
  rights: string;
}

export const SOURCES = {
  fbr: {
    id: "fbr",
    name: "Food Bank of the Rockies — Find Food directory",
    url: "https://foodbankrockies.org/find-food/",
    rights:
      "Fetched from the public Vivery/AccessFood directory API that powers the source's own locator. " +
      "Reuse and redistribution rights are not yet documented in an agreement with the source owner; " +
      "human review required before publishing (FC-23).",
  },
  co211: {
    id: "co211",
    name: "2-1-1 Colorado resource search (search.211colorado.org)",
    url: "https://search.211colorado.org/",
    rights:
      "Fetched from the public search endpoint of the source's own web application. " +
      "Referencing this directory does not prove authorization to reuse its data; " +
      "human review required before publishing (FC-23).",
  },
} satisfies Record<string, SourceDefinition>;

export function sourceRef(id: keyof typeof SOURCES): SourceRef {
  const s = SOURCES[id];
  return { id: s.id, name: s.name, url: s.url, rights: s.rights };
}
