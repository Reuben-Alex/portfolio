import type { Span } from "@/data/trace";

export interface FlatSpan {
  span: Span;
  depth: number;
  parent: Span | null;
}

export interface Range {
  start: Date;
  end: Date;
}

export interface Bar {
  leftPct: number;
  widthPct: number;
  dashed: boolean;
}

export const MIN_BAR_PCT = 1.5;

/** Dates in the data are plain days; read them as UTC so layout never shifts by timezone. */
export function parseDay(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

export function formatMonth(date: Date): string {
  return date.toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
}

export function flatten(root: Span, depth = 0, parent: Span | null = null): FlatSpan[] {
  return [
    { span: root, depth, parent },
    ...(root.children ?? []).flatMap((child) => flatten(child, depth + 1, root)),
  ];
}

export function countSpans(root: Span): number {
  return flatten(root).length;
}

export function formatDuration(start: Date, end: Date): string {
  let months =
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + (end.getUTCMonth() - start.getUTCMonth());
  if (end.getUTCDate() < start.getUTCDate()) months -= 1;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return [years ? `${years}y` : "", rest ? `${rest}m` : ""].filter(Boolean).join(" ") || "0m";
}

export function earliestStart(root: Span): Date {
  const starts = flatten(root)
    .filter((f) => f.span.start)
    .map((f) => parseDay(f.span.start!).getTime());
  return new Date(Math.min(...starts));
}

export function axisRange(root: Span, now: Date): Range {
  return {
    start: new Date(Date.UTC(earliestStart(root).getUTCFullYear(), 0, 1)),
    end: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)),
  };
}

export function axisYears(range: Range): number[] {
  const years: number[] = [];
  const last = new Date(range.end.getTime() - 1).getUTCFullYear();
  for (let y = range.start.getUTCFullYear(); y <= last; y++) years.push(y);
  return years;
}

/** Position of a moment on the axis, as a percentage from the left. */
export function pctOf(date: Date, range: Range): number {
  const span = range.end.getTime() - range.start.getTime();
  return ((date.getTime() - range.start.getTime()) / span) * 100;
}

function datedBar(span: Span, range: Range, now: Date): Bar {
  const left = Math.max(0, pctOf(parseDay(span.start!), range));
  const right = Math.min(100, pctOf(span.end ? parseDay(span.end) : now, range));
  const widthPct = Math.max(MIN_BAR_PCT, right - left);
  return { leftPct: Math.min(left, 100 - widthPct), widthPct, dashed: false };
}

export function barFor(item: FlatSpan, range: Range, now: Date): Bar | null {
  const { span, parent } = item;
  if (span.kind === "group") return null;
  if (span.start) return datedBar(span, range, now);
  if (parent?.start) return { ...datedBar(parent, range, now), dashed: true };
  return null;
}
