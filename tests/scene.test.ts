import { describe, expect, it } from "vitest";
import { career } from "@/data/trace";
import {
  WORLD,
  buildScene,
  lerpPose,
  overviewPose,
  progressFromCenters,
  smoothstep,
  spanPose,
} from "@/lib/scene";

const now = new Date("2026-11-16T00:00:00Z");
const scene = buildScene(career, now);
const get = (id: string) => scene.spans.find((s) => s.span.id === id)!;
const left = (id: string) => get(id).position[0] - get(id).size[0] / 2;
const right = (id: string) => get(id).position[0] + get(id).size[0] / 2;

describe("buildScene", () => {
  it("places the eleven selectable spans in trace order, one row each", () => {
    expect(scene.spans.map((s) => s.span.id)).toEqual([
      "mu_sigma_trainee",
      "intern_sam2",
      "associate_engineer",
      "it_hr_multi_agent",
      "lease_agent",
      "contact_centre_dashboard",
      "healthcare_voice_bot",
      "clintrace",
      "re_entry",
      "trellis",
      "revenant",
    ]);
    scene.spans.forEach((s, row) => {
      expect(s.position[1]).toBeCloseTo(-row * WORLD.rowGap);
      for (const n of [...s.position, ...s.size]) expect(Number.isFinite(n)).toBe(true);
    });
  });

  it("maps time onto the X axis", () => {
    expect(left("mu_sigma_trainee")).toBeCloseTo(-WORLD.width / 2);
    expect(right("associate_engineer")).toBeGreaterThan(WORLD.width / 2 - 0.5);
    expect(right("associate_engineer")).toBeLessThanOrEqual(WORLD.width / 2);
    expect(left("intern_sam2")).toBeCloseTo(right("mu_sigma_trainee"), 1);
  });

  it("draws undated engagements as outlines across their parent's period, one lane forward", () => {
    const parent = get("associate_engineer");
    for (const id of ["it_hr_multi_agent", "lease_agent", "contact_centre_dashboard", "healthcare_voice_bot"]) {
      const s = get(id);
      expect(s.dashed).toBe(true);
      expect(s.position[0]).toBeCloseTo(parent.position[0]);
      expect(s.size[0]).toBeCloseTo(parent.size[0]);
      expect(s.position[2]).toBeCloseTo(parent.position[2] + WORLD.laneGap);
      expect(s.parentId).toBe("associate_engineer");
    }
    expect(parent.dashed).toBe(false);
    expect(parent.parentId).toBeNull();
  });

  it("keeps very short projects visible", () => {
    expect(get("trellis").size[0]).toBe(WORLD.minBarWidth);
    expect(right("trellis")).toBeLessThanOrEqual(WORLD.width / 2 + 1e-9);
  });

  it("marks each year on the axis", () => {
    expect(scene.years.map((y) => y.year)).toEqual([2023, 2024, 2025, 2026]);
    expect(scene.years[0].x).toBeCloseTo(-WORLD.width / 2);
  });
});

describe("scroll progress", () => {
  const centers = [100, 300, 500];
  it("is the fractional index of the section under the viewport centre", () => {
    expect(progressFromCenters(centers, 100)).toBe(0);
    expect(progressFromCenters(centers, 200)).toBeCloseTo(0.5);
    expect(progressFromCenters(centers, 450)).toBeCloseTo(1.75);
  });
  it("clamps before the first and after the last section", () => {
    expect(progressFromCenters(centers, -50)).toBe(0);
    expect(progressFromCenters(centers, 900)).toBe(2);
  });
  it("copes with a single section", () => {
    expect(progressFromCenters([100], 400)).toBe(0);
  });
});

describe("camera poses", () => {
  it("eases between poses", () => {
    expect(smoothstep(0)).toBe(0);
    expect(smoothstep(0.5)).toBeCloseTo(0.5);
    expect(smoothstep(1)).toBe(1);
    const mid = lerpPose(
      { position: [0, 0, 0], target: [0, 0, 0] },
      { position: [2, 4, 6], target: [-2, 0, 2] },
      0.5,
    );
    expect(mid.position).toEqual([1, 2, 3]);
    expect(mid.target).toEqual([-1, 0, 1]);
  });

  it("looks at a span from in front, leaving room for the card", () => {
    const s = get("clintrace");
    const wide = spanPose(s, 16 / 9);
    expect(wide.position[2]).toBeGreaterThan(s.position[2]);
    // Landscape: the card sits on the left, so the span is framed right of centre.
    expect(wide.target[0]).toBeLessThan(s.position[0]);
    const tall = spanPose(s, 9 / 19);
    // Portrait: the card sits at the bottom, so the span is framed above centre.
    expect(tall.target[1]).toBeLessThan(s.position[1]);
    expect(tall.target[0]).toBeCloseTo(s.position[0]);
  });

  it("pulls back further for longer spans and narrower screens", () => {
    const dist = (id: string, aspect: number) => {
      const p = spanPose(get(id), aspect);
      return p.position[2] - get(id).position[2];
    };
    expect(dist("mu_sigma_trainee", 16 / 9)).toBeGreaterThan(dist("clintrace", 16 / 9));
    expect(dist("clintrace", 9 / 19)).toBeGreaterThan(dist("clintrace", 16 / 9));
  });

  it("frames the whole trace in the overview", () => {
    const p = overviewPose(scene, 16 / 9);
    expect(p.position[2]).toBeGreaterThan(WORLD.width * 0.6);
  });
});
