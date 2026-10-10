// Location resolution for the Denver-area pilot (FC-01).
// The data model supports every Colorado county; this seed table only covers
// pilot places and is NOT an authoritative ZIP/county crosswalk. Replace with
// a licensed or official dataset during W03.

export const PILOT_COUNTIES = [
  "Adams",
  "Arapahoe",
  "Boulder",
  "Broomfield",
  "Denver",
  "Douglas",
  "Jefferson",
] as const;

const CITY_COUNTIES: Record<string, string[]> = {
  denver: ["Denver"],
  aurora: ["Arapahoe", "Adams", "Douglas"],
  lakewood: ["Jefferson"],
  golden: ["Jefferson"],
  arvada: ["Jefferson", "Adams"],
  westminster: ["Adams", "Jefferson"],
  thornton: ["Adams"],
  "commerce city": ["Adams"],
  englewood: ["Arapahoe"],
  littleton: ["Arapahoe", "Jefferson", "Douglas"],
  centennial: ["Arapahoe"],
  "castle rock": ["Douglas"],
  boulder: ["Boulder"],
  longmont: ["Boulder"],
  broomfield: ["Broomfield"],
};

// ZIP codes can cross county lines, so a ZIP resolves to a set.
const ZIP_COUNTIES: Record<string, string[]> = {
  "80202": ["Denver"], "80203": ["Denver"], "80204": ["Denver"], "80205": ["Denver"],
  "80206": ["Denver"], "80207": ["Denver"], "80209": ["Denver"], "80210": ["Denver"],
  "80211": ["Denver"], "80212": ["Denver", "Jefferson"], "80216": ["Denver", "Adams"],
  "80218": ["Denver"], "80219": ["Denver"], "80220": ["Denver"], "80223": ["Denver"],
  "80224": ["Denver"], "80239": ["Denver"], "80249": ["Denver"],
  "80010": ["Arapahoe", "Adams"], "80011": ["Arapahoe", "Adams"], "80012": ["Arapahoe"],
  "80013": ["Arapahoe"], "80014": ["Arapahoe"], "80015": ["Arapahoe"],
  "80022": ["Adams"], "80229": ["Adams"], "80233": ["Adams"], "80260": ["Adams"],
  "80401": ["Jefferson"], "80214": ["Jefferson"], "80215": ["Jefferson"], "80226": ["Jefferson"],
  "80110": ["Arapahoe"], "80120": ["Arapahoe"], "80122": ["Arapahoe"],
  "80104": ["Douglas"], "80108": ["Douglas"], "80109": ["Douglas"],
  "80301": ["Boulder"], "80302": ["Boulder"], "80303": ["Boulder"], "80501": ["Boulder"],
  "80020": ["Broomfield"], "80023": ["Broomfield"],
};

export function countiesForZip(zip: string): string[] {
  return ZIP_COUNTIES[zip] ?? [];
}

export interface ResolvedPlace {
  /** What the person typed, trimmed, for display. */
  label: string;
  kind: "city" | "zip" | "county";
  counties: string[];
  zip?: string;
}

/** Resolve a city, ZIP, or county name. Returns null when not recognized. */
export function resolvePlace(input: string | undefined | null): ResolvedPlace | null {
  if (!input) return null;
  const raw = input.trim().slice(0, 60);
  if (!raw) return null;
  const key = raw.toLowerCase().replace(/,?\s*(co|colorado)$/i, "").replace(/\s+county$/, "").trim();

  if (/^\d{5}$/.test(key)) {
    const counties = ZIP_COUNTIES[key];
    return counties ? { label: key, kind: "zip", counties, zip: key } : null;
  }
  const county = PILOT_COUNTIES.find((c) => c.toLowerCase() === key);
  if (county && !/county$/i.test(raw) && CITY_COUNTIES[key]) {
    // "Denver", "Boulder", "Broomfield" are both city and county.
    return { label: titleCase(key), kind: "city", counties: CITY_COUNTIES[key]! };
  }
  if (county) return { label: `${county} County`, kind: "county", counties: [county] };
  const cityCounties = CITY_COUNTIES[key];
  if (cityCounties) return { label: titleCase(key), kind: "city", counties: cityCounties };
  return null;
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
