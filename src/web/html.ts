// Minimal auto-escaping HTML templating. Interpolated values are escaped unless
// they are SafeHtml (produced by `html` itself or `raw`).

export class SafeHtml {
  constructor(readonly value: string) {}
  toString() {
    return this.value;
  }
}

type Value = SafeHtml | string | number | boolean | null | undefined | Value[];

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function render(v: Value): string {
  if (v === null || v === undefined || v === false || v === true) return "";
  if (Array.isArray(v)) return v.map(render).join("");
  if (v instanceof SafeHtml) return v.value;
  return escapeHtml(String(v));
}

export function html(strings: TemplateStringsArray, ...values: Value[]): SafeHtml {
  let out = strings[0] ?? "";
  values.forEach((v, i) => {
    out += render(v) + (strings[i + 1] ?? "");
  });
  return new SafeHtml(out);
}

/** Only for trusted, already-escaped markup (e.g. inline SVG constants). */
export function raw(s: string): SafeHtml {
  return new SafeHtml(s);
}
