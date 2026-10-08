// Inline line icons (24px grid, 1.75 stroke). Decorative: always aria-hidden.
import { raw, type SafeHtml } from "./html.js";

const paths: Record<string, string> = {
  basket: '<path d="M4 10h16l-1.6 8.1a2 2 0 0 1-2 1.6H7.6a2 2 0 0 1-2-1.6L4 10Z"/><path d="m8 10 3-6M16 10l-3-6M3 10h18"/>',
  house: '<path d="M4 11.5 12 5l8 6.5V20H4z"/><path d="M10 20v-5h4v5"/>',
  pulse: '<path d="M3 12h4l2-5 4 10 2-5h6"/>',
  family: '<circle cx="8" cy="7" r="2.5"/><circle cx="16.5" cy="9" r="2"/><path d="M3.5 20v-3.5A4.5 4.5 0 0 1 8 12a4.5 4.5 0 0 1 4.5 4.5V20M13 20v-3a3.5 3.5 0 0 1 7 0v3"/>',
  document: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/>',
  briefcase: '<rect x="3.5" y="7" width="17" height="12" rx="1.5"/><path d="M9 7V5h6v2M3.5 12h17"/>',
  route: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h7.5a3 3 0 0 0 0-6h-7a3 3 0 0 1 0-6H16"/>',
  hand: '<path d="M7 13V6.5a1.5 1.5 0 0 1 3 0V12M10 11V5a1.5 1.5 0 0 1 3 0v6M13 11V6.5a1.5 1.5 0 0 1 3 0V13"/><path d="M16 10.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-.5A6.5 6.5 0 0 1 5 14.5L4 12a1.5 1.5 0 0 1 2.6-1.4L7 11"/>',
  shield: '<path d="M12 3 5 6v5c0 4.5 3 8.2 7 10 4-1.8 7-5.5 7-10V6z"/>',
  people: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 5.5a3 3 0 0 1 0 5.5M18 20a6 6 0 0 0-2.5-4.9"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.4-4.4"/>',
  pin: '<path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
  phone: '<path d="M5 4h3.5l1.5 4-2 1.5a11 11 0 0 0 6.5 6.5l1.5-2 4 1.5V19a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3A4 4 0 0 0 13 5.3l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  back: '<path d="m15 6-6 6 6 6"/>',
  alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
};

export function icon(name: string, cls = "icon"): SafeHtml {
  const p = paths[name] ?? paths.info!;
  return raw(
    `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${p}</svg>`,
  );
}

/** FieldCompass mark: a compass needle set in a field line. */
export function brandMark(): SafeHtml {
  return raw(
    '<svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><rect x="1" y="1" width="30" height="30" rx="5" fill="var(--ink)"/><path d="M4 22.5h24" stroke="var(--paper)" stroke-width="1.5" opacity=".35"/><path d="M16 5 20 16h-8z" fill="var(--signal)"/><path d="M16 27 12 16h8z" fill="var(--paper)"/></svg>',
  );
}
