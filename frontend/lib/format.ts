/** Pure helpers for units and values. Covered by lib/format.test.ts. */

export type Units = "metric" | "imperial";

export const haToAcres = (ha: number) => ha * 2.47105;
export const cToF = (c: number) => (c * 9) / 5 + 32;
export const kmhToMph = (kmh: number) => kmh * 0.621371;

export function convertArea(ha: number, units: Units): number {
  return units === "imperial" ? haToAcres(ha) : ha;
}

export function convertTemp(c: number, units: Units): number {
  return units === "imperial" ? cToF(c) : c;
}

export function convertSpeed(kmh: number, units: Units): number {
  return units === "imperial" ? kmhToMph(kmh) : kmh;
}

export type HealthStatus = "healthy" | "attention" | "critical" | "unknown";

// Same thresholds as the backend (app/domain/ndvi.py).
export const NDVI_ATTENTION = 0.4;
export const NDVI_HEALTHY = 0.6;

export function healthFromNdvi(value: number | null | undefined): HealthStatus {
  if (value === null || value === undefined || Number.isNaN(value)) return "unknown";
  if (value >= NDVI_HEALTHY) return "healthy";
  return value >= NDVI_ATTENTION ? "attention" : "critical";
}

function mix(a: number[], b: number[], t: number) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}

// The usual NDVI ramp (red, amber, yellow, green), anchored on the app's own state colours:
// red #D95757 sits in the critical range, amber #E8A23A where attention starts, and greens
// above 0.6. It is continuous, so weaker spots stay visible inside a field whose values
// all fall in one state.
const NDVI_STOPS: [number, number[]][] = [
  [0.15, [142, 42, 42]],
  [0.35, [217, 87, 87]],
  [0.45, [232, 162, 58]],
  [0.55, [233, 205, 91]],
  [0.65, [140, 194, 105]],
  [0.85, [23, 76, 56]],
];

/** Where the NDVI colour scale starts and ends. Values outside are clamped. */
export const NDVI_SCALE = { min: NDVI_STOPS[0][0], max: NDVI_STOPS[NDVI_STOPS.length - 1][0] };

export function ndviColor(value: number): string {
  const v = Math.min(NDVI_SCALE.max, Math.max(NDVI_SCALE.min, value));
  const i = Math.max(1, NDVI_STOPS.findIndex(([stop]) => stop >= v));
  const [from, low] = NDVI_STOPS[i - 1];
  const [to, high] = NDVI_STOPS[i];
  return `rgb(${mix(low, high, (v - from) / (to - from)).join(",")})`;
}

/** CSS gradient for a legend bar running from NDVI_SCALE.min to NDVI_SCALE.max. */
export function ndviLegendGradient(): string {
  const stops = NDVI_STOPS.map(([value, rgb]) =>
    `rgb(${rgb.join(",")}) ${(((value - NDVI_SCALE.min) / (NDVI_SCALE.max - NDVI_SCALE.min)) * 100).toFixed(2)}%`);
  return `linear-gradient(90deg, ${stops.join(", ")})`;
}

/**
 * Cells with no reading that lie inside the field (sensor dropouts), as "row,col" keys.
 * Empty cells joined to the grid's edge are outside the field boundary instead.
 */
export function interiorGaps(values: (number | null)[][]): Set<string> {
  const rows = values.length;
  const cols = values[0]?.length ?? 0;
  const outside = new Set<string>();
  const queue: [number, number][] = [];
  const visit = (r: number, c: number) => {
    const key = `${r},${c}`;
    if (r < 0 || c < 0 || r >= rows || c >= cols || values[r][c] !== null || outside.has(key)) return;
    outside.add(key);
    queue.push([r, c]);
  };
  for (let r = 0; r < rows; r++) { visit(r, 0); visit(r, cols - 1); }
  for (let c = 0; c < cols; c++) { visit(0, c); visit(rows - 1, c); }
  while (queue.length) {
    const [r, c] = queue.pop()!;
    visit(r + 1, c); visit(r - 1, c); visit(r, c + 1); visit(r, c - 1);
  }
  const gaps = new Set<string>();
  values.forEach((row, r) => row.forEach((value, c) => {
    if (value === null && !outside.has(`${r},${c}`)) gaps.add(`${r},${c}`);
  }));
  return gaps;
}

// Browsers commonly ship without Kazakh date data and fall back to forms like "М11 7".
const KK_MONTHS = ["қаң", "ақп", "нау", "сәу", "мам", "мау", "шіл", "там", "қыр", "қаз", "қар", "жел"];

const pad = (value: number) => String(value).padStart(2, "0");

export function kkDate(date: Date, style: "short" | "long" | "time"): string {
  const dayMonth = `${date.getDate()} ${KK_MONTHS[date.getMonth()]}`;
  if (style === "long") return `${dayMonth} ${date.getFullYear()}`;
  if (style === "time") return `${dayMonth}, ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return dayMonth;
}

export type Elapsed = { unit: "now" | "minutes" | "hours" | "yesterday" | "days"; n: number };

export function elapsed(from: Date, now: Date): Elapsed {
  const minutes = Math.floor((now.getTime() - from.getTime()) / 60_000);
  if (minutes < 1) return { unit: "now", n: 0 };
  if (minutes < 60) return { unit: "minutes", n: minutes };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { unit: "hours", n: hours };
  const days = Math.floor(hours / 24);
  return days === 1 ? { unit: "yesterday", n: 1 } : { unit: "days", n: days };
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}
