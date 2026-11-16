import { describe, expect, it } from "vitest";
import { career, evals, profile, type Span } from "@/data/trace";

function walk(span: Span): Span[] {
  return [span, ...(span.children ?? []).flatMap(walk)];
}
const all = walk(career);
const byId = (id: string) => all.find((s) => s.id === id)!;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

describe("trace data", () => {
  it("lists the spans in the agreed order", () => {
    expect(all.map((s) => s.id)).toEqual([
      "career",
      "mu_sigma_trainee",
      "sixtysix_degrees",
      "intern_sam2",
      "associate_engineer",
      "it_hr_multi_agent",
      "lease_agent",
      "contact_centre_dashboard",
      "healthcare_voice_bot",
      "side_projects",
      "clintrace",
      "re_entry",
      "trellis",
      "revenant",
    ]);
  });

  it("has unique ids", () => {
    expect(new Set(all.map((s) => s.id)).size).toBe(all.length);
  });

  it("gives every non-group span a summary and description", () => {
    for (const s of all.filter((s) => s.kind !== "group")) {
      expect(s.summary?.trim(), s.id).toBeTruthy();
      expect(s.description?.trim(), s.id).toBeTruthy();
    }
  });

  it("gives roles and projects valid dates", () => {
    for (const s of all.filter((s) => s.kind === "role" || s.kind === "project")) {
      expect(s.start, s.id).toMatch(DATE);
      const start = new Date(s.start!).getTime();
      expect(Number.isNaN(start), s.id).toBe(false);
      if (s.end != null) {
        expect(s.end, s.id).toMatch(DATE);
        expect(new Date(s.end).getTime(), s.id).toBeGreaterThanOrEqual(start);
      }
    }
  });

  it("claims no dates for engagements", () => {
    for (const s of all.filter((s) => s.kind === "engagement")) {
      expect(s.start, s.id).toBeUndefined();
      expect(s.end, s.id).toBeUndefined();
    }
  });

  it("uses only https and mailto links", () => {
    for (const s of all) {
      for (const l of s.links ?? []) {
        expect(l.href, s.id).toMatch(/^(https:\/\/|mailto:)/);
      }
    }
  });

  it("keeps trellis unlinked and revenant marked in development", () => {
    expect(byId("trellis").links ?? []).toHaveLength(0);
    expect(byId("revenant").status).toBe("in development");
  });

  it("shows the agreed contact details and nothing excluded", () => {
    expect(profile.email).toBe("reubenalexa@gmail.com");
    const text = JSON.stringify({ career, evals, profile }).toLowerCase();
    expect(text).not.toContain("résumé");
    expect(text).not.toContain("resume");
    expect(text).not.toContain("christ university");
  });

  it("has five evals", () => {
    expect(evals).toHaveLength(5);
  });
});
