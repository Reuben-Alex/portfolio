import { describe, expect, it } from "vitest";
import { career, type Span } from "@/data/trace";
import {
  MIN_BAR_PCT,
  axisRange,
  axisYears,
  barFor,
  countSpans,
  flatten,
  formatDuration,
} from "@/lib/trace";

const d = (s: string) => new Date(`${s}T00:00:00Z`);
const now = d("2026-11-16");

const tree: Span = {
  id: "root",
  title: "Root",
  kind: "group",
  children: [
    {
      id: "job",
      title: "Job",
      kind: "role",
      start: "2020-01-01",
      end: "2021-01-01",
      children: [{ id: "gig", title: "Gig", kind: "engagement" }],
    },
    { id: "proj", title: "Proj", kind: "project", start: "2021-06-01", end: "2021-06-02" },
  ],
};

describe("flatten and count", () => {
  it("flattens depth-first with depth and parent", () => {
    const flat = flatten(tree);
    expect(flat.map((f) => [f.span.id, f.depth, f.parent?.id ?? null])).toEqual([
      ["root", 0, null],
      ["job", 1, "root"],
      ["gig", 2, "job"],
      ["proj", 1, "root"],
    ]);
  });

  it("counts every node of the real tree", () => {
    expect(countSpans(career)).toBe(14);
  });
});

describe("formatDuration", () => {
  it("formats years and months", () => {
    expect(formatDuration(d("2023-01-01"), d("2026-11-16"))).toBe("3y 10m");
  });
  it("omits zero years", () => {
    expect(formatDuration(d("2025-01-01"), d("2025-11-01"))).toBe("10m");
  });
  it("omits zero months", () => {
    expect(formatDuration(d("2023-01-01"), d("2025-01-01"))).toBe("2y");
  });
});

describe("axis", () => {
  it("runs from January of the earliest year to the month after now", () => {
    const range = axisRange(career, now);
    expect(range.start.toISOString().slice(0, 10)).toBe("2023-01-01");
    expect(range.end.toISOString().slice(0, 10)).toBe("2026-12-01");
    expect(axisYears(range)).toEqual([2023, 2024, 2025, 2026]);
  });
});

describe("barFor", () => {
  const range = { start: d("2020-01-01"), end: d("2022-01-01") };
  const flat = flatten(tree);
  const item = (id: string) => flat.find((f) => f.span.id === id)!;

  it("maps a dated span onto the range", () => {
    const bar = barFor(item("job"), range, now)!;
    expect(bar.leftPct).toBe(0);
    expect(Math.abs(bar.widthPct - 50)).toBeLessThan(1);
    expect(bar.dashed).toBe(false);
  });

  it("gives very short spans the minimum width", () => {
    const bar = barFor(item("proj"), range, now)!;
    expect(bar.widthPct).toBe(MIN_BAR_PCT);
    expect(bar.dashed).toBe(false);
  });

  it("draws an engagement as a dashed copy of its parent's bar", () => {
    const parent = barFor(item("job"), range, now)!;
    expect(barFor(item("gig"), range, now)).toEqual({ ...parent, dashed: true });
  });

  it("gives groups no bar", () => {
    expect(barFor(item("root"), range, now)).toBeNull();
  });

  it("still fits when the site is built months later", () => {
    const later = d("2027-08-10");
    const laterRange = axisRange(career, later);
    const role = flatten(career).find((f) => f.span.id === "associate_engineer")!;
    const bar = barFor(role, laterRange, later)!;
    expect(bar.leftPct + bar.widthPct).toBeGreaterThan(97);
    expect(bar.leftPct + bar.widthPct).toBeLessThanOrEqual(100);
    expect(axisYears(laterRange).at(-1)).toBe(2027);
  });
});
