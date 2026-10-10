import type { CategoryId } from "./types.js";

export interface Category {
  id: CategoryId;
  /** i18n key prefix: `category.<id>.name` / `.blurb` */
  icon: string;
  /** Search terms that imply this category (both languages, accent-free). */
  terms: string[];
}

// Organizing families from product scope §3 — not promises of local coverage.
export const CATEGORIES: Category[] = [
  { id: "food", icon: "basket", terms: ["food", "groceries", "grocery", "meals", "pantry", "diapers", "clothing", "hygiene", "comida", "despensa", "alimentos"] },
  { id: "housing-utilities", icon: "house", terms: ["housing", "rent", "shelter", "eviction", "utilities", "utility", "energy", "electric", "gas", "water", "bill", "bills", "vivienda", "renta", "alquiler", "luz", "servicios"] },
  { id: "health", icon: "pulse", terms: ["health", "clinic", "doctor", "dental", "dentist", "mental", "counseling", "recovery", "pregnancy", "salud", "clinica", "medico"] },
  { id: "children-families", icon: "family", terms: ["childcare", "daycare", "preschool", "afterschool", "parenting", "kids", "children", "child", "guarderia", "ninos", "cuidado"] },
  { id: "benefits", icon: "document", terms: ["benefits", "snap", "medicaid", "taxes", "tax", "financial", "beneficios", "impuestos"] },
  { id: "work-education", icon: "briefcase", terms: ["job", "jobs", "work", "training", "ged", "esl", "education", "trabajo", "empleo", "educacion"] },
  { id: "transportation", icon: "route", terms: ["transportation", "transit", "bus", "ride", "rides", "paratransit", "internet", "transporte", "viaje"] },
  { id: "aging-disability", icon: "hand", terms: ["senior", "seniors", "older", "aging", "disability", "caregiver", "mayores", "discapacidad"] },
  { id: "legal-safety", icon: "shield", terms: ["legal", "lawyer", "violence", "abuse", "safety", "abogado", "violencia"] },
  { id: "community", icon: "people", terms: ["veterans", "veteran", "immigrant", "refugee", "reentry", "youth", "veteranos", "inmigrante"] },
];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === "string" && (CATEGORY_IDS as string[]).includes(value);
}
