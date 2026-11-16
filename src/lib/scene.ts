import type { Span } from "@/data/trace";
import { axisRange, axisYears, barFor, flatten, pctOf } from "@/lib/trace";

/** World-space layout of the 3D trace. Time runs along X, rows go down Y, nesting comes forward on Z. */
export const WORLD = {
  width: 24,
  rowGap: 1.05,
  laneGap: 1.6,
  barHeight: 0.36,
  barDepth: 0.8,
  minBarWidth: 0.4,
} as const;

export type Vec3 = [number, number, number];

export interface SceneSpan {
  span: Span;
  /** Centre of the bar. */
  position: Vec3;
  /** Width (time), height, depth. */
  size: Vec3;
  /** Undated: drawn as an outline across the parent's period. */
  dashed: boolean;
  /** The parent span, when it is itself a bar (not a group heading). */
  parentId: string | null;
}

export interface Scene {
  spans: SceneSpan[];
  years: { year: number; x: number }[];
  /** Centre of all bars, for framing. */
  center: Vec3;
  /** Lowest row's Y. */
  bottom: number;
}

export interface Pose {
  position: Vec3;
  target: Vec3;
}

const xAt = (pct: number) => (pct / 100 - 0.5) * WORLD.width;

export function buildScene(root: Span, now: Date): Scene {
  const range = axisRange(root, now);
  const spans: SceneSpan[] = [];

  for (const item of flatten(root)) {
    const bar = barFor(item, range, now);
    if (!bar) continue;
    const width = Math.max(WORLD.minBarWidth, (bar.widthPct / 100) * WORLD.width);
    const left = Math.min(xAt(bar.leftPct), WORLD.width / 2 - width);
    spans.push({
      span: item.span,
      position: [left + width / 2, -spans.length * WORLD.rowGap, (item.depth - 1) * WORLD.laneGap],
      size: [width, WORLD.barHeight, WORLD.barDepth],
      dashed: bar.dashed,
      parentId: item.parent && item.parent.kind !== "group" ? item.parent.id : null,
    });
  }

  const bottom = -(spans.length - 1) * WORLD.rowGap;
  const maxZ = Math.max(...spans.map((s) => s.position[2]));
  return {
    spans,
    years: axisYears(range).map((year) => ({
      year,
      x: xAt(pctOf(new Date(Date.UTC(year, 0, 1)), range)),
    })),
    center: [0, bottom / 2, maxZ / 2],
    bottom,
  };
}

/** Fractional index of the section whose centre is at `y`, given every section's centre. */
export function progressFromCenters(centers: number[], y: number): number {
  if (centers.length < 2 || y <= centers[0]) return 0;
  const last = centers.length - 1;
  if (y >= centers[last]) return last;
  const i = centers.findIndex((c, k) => y >= c && y < centers[k + 1]);
  return i + (y - centers[i]) / (centers[i + 1] - centers[i]);
}

export function smoothstep(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

const mix = (a: Vec3, b: Vec3, t: number): Vec3 => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  return { position: mix(a.position, b.position, t), target: mix(a.target, b.target, t) };
}

/** Narrow screens need the camera further back to fit the same width. */
const pullBack = (aspect: number) => (aspect < 1 ? 1 / Math.max(aspect, 0.45) : 1);

/** The opening shot: the whole trace, seen from the "now" end, with room for the hero text. */
export function overviewPose(scene: Scene, aspect: number): Pose {
  const [cx, cy, cz] = scene.center;
  if (aspect < 1) {
    const dist = Math.min((WORLD.width * 1.4) / aspect, 62);
    return {
      position: [cx + dist * 0.3, cy + dist * 0.06, cz + dist],
      target: [cx, cy + dist * 0.16, cz],
    };
  }
  // Far enough that the trace fills a little over half the width, pushed to the right.
  const dist = Math.min(Math.max((WORLD.width * 2.4) / aspect, 26), 46);
  return {
    position: [cx + dist * 0.5, cy + dist * 0.18, cz + dist],
    target: [cx - WORLD.width * 0.3, cy + 0.5, cz],
  };
}

/** A close shot of one span, framed to leave room for its card (left on wide screens, bottom on tall ones). */
export function spanPose(s: SceneSpan, aspect: number): Pose {
  const [x, y, z] = s.position;
  const dist = (6 + s.size[0] * 0.7) * pullBack(aspect);
  if (aspect < 1) {
    return {
      position: [x + dist * 0.18, y + dist * 0.05, z + dist],
      target: [x, y - dist * 0.2, z],
    };
  }
  return {
    position: [x + dist * 0.3, y + dist * 0.2, z + dist],
    target: [x - dist * 0.3, y - dist * 0.03, z],
  };
}
