// Generates src/data/fixtures/resources.sample.json.
// Every record is FICTIONAL test data: 555-01xx phone numbers, example.org
// links, and "Sample" names. It must never appear in production (handoff §2).
import { writeFileSync } from "node:fs";

const SRC = { id: "src-sample", name: "FieldCompass sample fixtures", url: "https://example.org/fieldcompass-fixtures", rights: "Fictional test data. Not for publication." };
const tz = "America/Denver";
const weekdays = (opens, closes) => [1, 2, 3, 4, 5].map((day) => ({ day, opens, closes }));
const base = {
  description: null, documents: null, intake: null, keywords: [],
  sources: [SRC], source_updated_at: "2026-09-02T00:00:00Z", fetched_at: "2026-10-01T06:00:00Z",
  reviewed_at: "2026-10-03T17:00:00Z", record_version: 1, publication_status: "published",
  operating_status: "active", is_sample: true,
};
const phone = (n, label = null, notes = null) => ({ channel: "phone", value: `303-555-01${n}`, label, notes, source_id: SRC.id });
const web = (slug) => ({ channel: "website", value: `https://example.org/${slug}`, label: null, notes: null, source_id: SRC.id });
const addr = (id, street, city, zip, county) => ({ id, access: "physical", address_visibility: "public", address: { street, city, zip, county }, notes: null });

const resources = [
  {
    ...base, id: "res-evening-childcare", organization_id: "org-larkspur", organization_name: "Larkspur Family Services (Sample)",
    name: "Evening and Overnight Childcare (Sample)",
    summary: "Licensed childcare with evening and overnight hours for parents who work late shifts.",
    description: "Care for children ages 6 weeks to 12 years. Evening care runs past midnight on weekdays.",
    category_ids: ["children-families"], keywords: ["childcare", "evening", "night shift", "overnight", "infant", "toddler", "school age"],
    service_area: { type: "counties", counties: ["Denver"] }, modes: ["in_person"],
    locations: [addr("loc-larkspur-1", "1200 Example Ave", "Denver", "80205", "Denver")],
    contacts: [phone("10", "Enrollment"), web("larkspur-evening-care")],
    eligibility: "Children ages 6 weeks to 12 years. Parent or guardian must be working or in school during care hours.",
    cost: { kind: "sliding_scale", details: "Weekly fee based on household size and income. Accepts CCCAP." },
    documents: ["Child's immunization record", "Proof of work or school schedule"],
    intake: "Call enrollment to ask about current openings and schedule a visit.",
    languages: ["en", "es"], accessibility: { wheelchair: "yes", notes: "Step-free entrance on the north side." },
    schedule: { time_zone: tz, regular: weekdays("15:00", "00:30"), exceptions: [{ date: "2026-11-26", closed: true, hours: null, label: "Thanksgiving" }], intake_cutoff_note: "Enrollment calls answered until 8:00 PM.", source_id: SRC.id },
  },
  {
    ...base, id: "res-childcare-cost-help", organization_id: "org-plains", organization_name: "High Plains Family Resource Center (Sample)",
    name: "Childcare Cost Assistance Navigation (Sample)",
    summary: "Help checking eligibility for childcare financial assistance and completing the application.",
    category_ids: ["children-families", "benefits"], keywords: ["cccap", "childcare assistance", "subsidy", "pay for childcare", "financial help"],
    // Office is in Arapahoe County but the documented service area includes Denver (T02).
    service_area: { type: "counties", counties: ["Arapahoe", "Adams", "Denver"] }, modes: ["in_person", "phone"],
    locations: [addr("loc-plains-1", "45 Sample Pkwy", "Aurora", "80012", "Arapahoe")],
    contacts: [phone("22"), web("high-plains-childcare-help")],
    eligibility: "Families living in Adams, Arapahoe, or Denver County. Program staff check income guidelines with you.",
    cost: { kind: "free", details: null },
    documents: ["Recent pay stubs or proof of income", "Child's birth certificate or other proof of age", "Proof of address"],
    intake: "Walk in during listed hours or call to book a phone appointment.",
    languages: ["en", "es"], accessibility: { wheelchair: "yes", notes: null },
    schedule: { time_zone: tz, regular: weekdays("09:00", "17:00"), exceptions: [], intake_cutoff_note: "Walk-ins accepted until 4:00 PM.", source_id: SRC.id },
  },
  {
    // Deliberately incomplete record for T03: unknowns must stay unknown.
    ...base, id: "res-family-home-care", organization_id: "org-northfield", organization_name: "Northfield Family Childcare Home (Sample)",
    name: "Northfield Family Childcare Home (Sample)",
    summary: "Small home-based childcare program.",
    category_ids: ["children-families"], keywords: ["childcare", "home daycare"],
    service_area: { type: "counties", counties: ["Denver"] }, modes: ["in_person"],
    locations: [addr("loc-northfield-1", "88 Placeholder St", "Denver", "80207", "Denver")],
    contacts: [phone("31")],
    eligibility: null, cost: { kind: "unknown", details: null }, languages: null,
    accessibility: { wheelchair: "unknown", notes: null }, schedule: null, reviewed_at: null,
  },
  {
    ...base, id: "res-energy-bill-help", organization_id: "org-frontrange-energy", organization_name: "Front Range Energy Assistance Line (Sample)",
    name: "Home Energy Bill Help Line (Sample)",
    summary: "Phone help for people behind on gas or electric bills, including shutoff notices.",
    description: "Staff explain energy assistance programs, help you prepare an application, and can tell you what to do if you have a shutoff notice.",
    category_ids: ["housing-utilities", "benefits"], keywords: ["utilities", "electric", "gas", "heating", "shutoff", "disconnect", "energy assistance"],
    service_area: { type: "statewide" }, modes: ["phone", "virtual"],
    locations: [{ id: "loc-energy-virtual", access: "virtual", address_visibility: "public", address: null, notes: "Phone and online only." }],
    contacts: [phone("40", "Help line"), web("energy-bill-help")],
    eligibility: "Colorado households. Income limits apply to most assistance programs; staff can check with you.",
    cost: { kind: "free", details: null },
    documents: ["Most recent utility bill", "Any shutoff or past-due notice", "Proof of household income"],
    intake: "Call the help line. Have your bill nearby.",
    languages: ["en", "es"], accessibility: { wheelchair: "unknown", notes: "Phone service; relay calls accepted." },
    schedule: { time_zone: tz, regular: weekdays("08:00", "17:00"), exceptions: [], intake_cutoff_note: null, source_id: SRC.id },
  },
  {
    ...base, id: "res-water-hardship", organization_id: "org-citywater", organization_name: "Metro Water Customer Care (Sample)",
    name: "Water Bill Hardship Program (Sample)",
    summary: "Payment plans and one-time credits for residential water customers facing hardship.",
    category_ids: ["housing-utilities"], keywords: ["water bill", "payment plan", "utilities", "credit"],
    service_area: { type: "zips", zips: ["80202", "80203", "80204", "80205", "80206", "80211", "80218", "80219", "80220"] }, modes: ["phone", "virtual"],
    locations: [{ id: "loc-water-virtual", access: "virtual", address_visibility: "public", address: null, notes: null }],
    contacts: [phone("47"), web("water-hardship")],
    eligibility: "Residential account holders in the listed service ZIP codes.",
    cost: { kind: "free", details: null }, documents: ["Water account number"],
    intake: "Apply online or by phone.",
    languages: ["en"], accessibility: { wheelchair: "unknown", notes: null },
    schedule: { time_zone: tz, regular: weekdays("07:30", "18:00"), exceptions: [], intake_cutoff_note: null, source_id: SRC.id },
  },
  {
    ...base, id: "res-food-pantry-east", organization_id: "org-eastside", organization_name: "Eastside Neighbors (Sample)",
    name: "Eastside Community Food Pantry (Sample)",
    summary: "Groceries, fresh produce, and diapers once a week. No appointment needed.",
    category_ids: ["food"], keywords: ["food", "groceries", "pantry", "produce", "diapers"],
    service_area: { type: "counties", counties: ["Denver", "Adams"] }, modes: ["in_person"],
    locations: [addr("loc-eastside-1", "300 Sample Blvd", "Denver", "80220", "Denver")],
    contacts: [phone("55")],
    eligibility: "Open to anyone in Denver or Adams County.", cost: { kind: "free", details: null }, documents: [],
    intake: "Arrive during distribution hours. Bring your own bags if you can.",
    languages: ["en", "es", "vi"], accessibility: { wheelchair: "yes", notes: null },
    schedule: { time_zone: tz, regular: [{ day: 3, opens: "16:00", closes: "19:00" }, { day: 6, opens: "09:00", closes: "12:00" }], exceptions: [], intake_cutoff_note: null, source_id: SRC.id },
  },
  {
    ...base, id: "res-accessible-rides", organization_id: "org-peakride", organization_name: "PeakRide Community Transit (Sample)",
    name: "Accessible Rides to Medical Appointments (Sample)",
    summary: "Door-to-door wheelchair-accessible rides to medical and benefits appointments for older adults and people with disabilities.",
    category_ids: ["transportation", "aging-disability"], keywords: ["rides", "transportation", "wheelchair", "medical appointment", "seniors", "older adults"],
    service_area: { type: "counties", counties: ["Jefferson", "Denver"] }, modes: ["in_person", "phone"],
    locations: [addr("loc-peakride-1", "9 Demo Way", "Lakewood", "80226", "Jefferson")],
    contacts: [phone("63", "Ride booking")],
    eligibility: "Adults 60 and older, or people of any age with a disability that limits use of regular transit.",
    cost: { kind: "fee", details: "Suggested donation per ride; no one is turned away for inability to pay." },
    documents: null, intake: "Book at least 2 business days ahead by phone.",
    languages: ["en"], accessibility: { wheelchair: "yes", notes: "Lift-equipped vans." },
    schedule: { time_zone: tz, regular: weekdays("07:00", "16:00"), exceptions: [], intake_cutoff_note: "Booking line closes at 3:00 PM.", source_id: SRC.id },
  },
  {
    // Confidential address for T16. Address must never reach public output.
    ...base, id: "res-safe-shelter", organization_id: "org-safeharbor", organization_name: "Safe Harbor Services (Sample)",
    name: "Confidential Family Safety Shelter (Sample)",
    summary: "Confidential emergency shelter and advocacy for people experiencing domestic violence.",
    category_ids: ["legal-safety", "housing-utilities"], keywords: ["domestic violence", "safe shelter", "advocacy", "abuse"],
    service_area: { type: "counties", counties: ["Denver", "Arapahoe", "Adams", "Jefferson"] }, modes: ["phone", "in_person"],
    locations: [{ id: "loc-safeharbor-secret", access: "physical", address_visibility: "confidential", address: { street: "CONFIDENTIAL-TEST-ADDRESS 1 Hidden Ln", city: "Denver", zip: "80204", county: "Denver" }, notes: null }],
    contacts: [phone("70", "Hotline", "The source lists this hotline as answered 24 hours a day.")],
    eligibility: "Adults and families experiencing domestic violence.", cost: { kind: "free", details: null }, documents: [],
    intake: "Call the hotline. Location is shared only by staff.",
    languages: ["en", "es"], accessibility: { wheelchair: "unknown", notes: null }, schedule: null,
  },
  {
    ...base, id: "res-benefits-coaching", organization_id: "org-benefitsco", organization_name: "Colorado Benefits Coaching Network (Sample)",
    name: "Virtual Benefits Application Coaching (Sample)",
    summary: "Video or phone coaching to prepare applications for food, health coverage, and cash assistance.",
    category_ids: ["benefits"], keywords: ["snap", "medicaid", "health first colorado", "application", "benefits"],
    service_area: { type: "remote" }, modes: ["virtual", "phone"],
    locations: [{ id: "loc-benefits-virtual", access: "virtual", address_visibility: "public", address: null, notes: null }],
    contacts: [phone("81"), web("benefits-coaching")],
    eligibility: "Colorado residents.", cost: { kind: "free", details: null },
    documents: ["Photo ID if you have one", "Proof of income", "Proof of address"],
    intake: "Book an appointment online or by phone.",
    languages: ["es", "en"], accessibility: { wheelchair: "unknown", notes: null },
    schedule: { time_zone: tz, regular: [...weekdays("10:00", "19:00"), { day: 6, opens: "10:00", closes: "14:00" }], exceptions: [], intake_cutoff_note: null, source_id: SRC.id },
  },
  {
    ...base, id: "res-shutoff-clinic", organization_id: "org-adamslegal", organization_name: "Adams Tenant and Utility Clinic (Sample)",
    name: "Utility Shutoff Prevention Clinic (Sample)",
    summary: "Walk-in clinic for people with utility disconnection notices.",
    category_ids: ["housing-utilities", "legal-safety"], keywords: ["shutoff", "disconnect", "utilities", "notice"],
    service_area: { type: "counties", counties: ["Adams"] }, modes: ["in_person"],
    locations: [addr("loc-adamslegal-1", "12 Sample Ct", "Thornton", "80229", "Adams")],
    contacts: [phone("88")],
    eligibility: "Adams County residents.", cost: { kind: "free", details: null }, documents: ["Disconnection notice"],
    intake: "Walk in during clinic hours.", languages: ["en", "es"], accessibility: { wheelchair: "yes", notes: null },
    operating_status: "temporarily_closed",
    schedule: { time_zone: tz, regular: [{ day: 2, opens: "13:00", closes: "17:00" }], exceptions: [], intake_cutoff_note: null, source_id: SRC.id },
  },
  {
    // Withdrawn: detail returns "no longer listed"; saved plans flag it (T13).
    ...base, id: "res-former-rent-fund", organization_id: "org-former", organization_name: "Former Rent Relief Fund (Sample)",
    name: "Former Rent Relief Fund (Sample)", summary: "Program ended.",
    category_ids: ["housing-utilities"], keywords: ["rent"], service_area: { type: "counties", counties: ["Denver"] }, modes: ["phone"],
    locations: [], contacts: [phone("95")], eligibility: null, cost: { kind: "unknown", details: null }, languages: null,
    accessibility: { wheelchair: "unknown", notes: null }, schedule: null, publication_status: "withdrawn", record_version: 3,
  },
  {
    ...base, id: "res-draft-unreviewed", organization_id: "org-draft", organization_name: "Draft Record (Sample)",
    name: "Unreviewed Draft Listing (Sample)", summary: "Staged record awaiting review. Must not be public.",
    category_ids: ["food"], keywords: ["food"], service_area: { type: "statewide" }, modes: ["phone"],
    locations: [], contacts: [phone("99")], eligibility: null, cost: { kind: "free", details: null }, languages: ["en"],
    accessibility: { wheelchair: "unknown", notes: null }, schedule: null, publication_status: "draft", reviewed_at: null,
  },
];

writeFileSync(new URL("../src/data/fixtures/resources.sample.json", import.meta.url), JSON.stringify(resources, null, 2) + "\n");
console.log(`Wrote ${resources.length} sample records.`);
