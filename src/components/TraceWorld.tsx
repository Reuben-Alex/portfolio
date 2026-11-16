"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { useInView, useReducedMotion } from "motion/react";
import type { Span } from "@/data/trace";
import { buildScene, progressFromCenters } from "@/lib/scene";
import { flatten, parseDay } from "@/lib/trace";
import { useIsClient } from "@/lib/use-is-client";
import { SpanDetail } from "@/components/SpanDetail";
import { TraceView } from "@/components/TraceView";

// The WebGL scene is client-only and loaded on demand; the page is complete without it.
const TraceScene = dynamic(() => import("@/components/TraceScene"), { ssr: false });

interface Props {
  root: Span;
  /** Build day, "YYYY-MM-DD". */
  nowISO: string;
  /** Server-rendered hero, shown over the opening shot. */
  hero: ReactNode;
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * The trace as a scroll-driven 3D world. Each span is a full-height section holding its card;
 * a sticky canvas behind them flies the camera from span to span as the page scrolls.
 * Without WebGL, with reduced motion, or without JavaScript, the same sections read as a
 * plain list (plus the 2D waterfall where scripts run).
 */
export function TraceWorld({ root, nowISO, hero }: Props) {
  const now = useMemo(() => parseDay(nowISO), [nowISO]);
  const scene = useMemo(() => buildScene(root, now), [root, now]);
  const paths = useMemo(() => {
    const map = new Map<string, string[]>();
    const walk = (span: Span, trail: string[]) => {
      map.set(span.id, trail);
      for (const child of span.children ?? []) walk(child, [...trail, span.id]);
    };
    walk(root, []);
    return map;
  }, [root]);
  const defaultId = useMemo(
    () => flatten(root).find((f) => f.span.video)?.span.id ?? scene.spans[0].span.id,
    [root, scene],
  );

  const isClient = useIsClient();
  const reduced = Boolean(useReducedMotion()) && isClient;
  const webgl = useMemo(() => isClient && hasWebGL(), [isClient]);
  const mode = !isClient ? "server" : webgl && !reduced ? "3d" : "2d";
  const is3d = mode === "3d";

  const trackRef = useRef<HTMLDivElement>(null);
  const sections = useRef<(HTMLElement | null)[]>([]);
  const progress = useRef(0);
  const [active, setActive] = useState(0);
  const onScreen = useInView(trackRef);

  useEffect(() => {
    if (!is3d) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const centers = sections.current.map((el) =>
        el ? el.getBoundingClientRect().top + window.scrollY + el.offsetHeight / 2 : 0,
      );
      const p = progressFromCenters(centers, window.scrollY + window.innerHeight / 2);
      progress.current = p;
      setActive(Math.round(p));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [is3d]);

  function jump(stop: number) {
    sections.current[stop]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function onRailClick(e: MouseEvent<HTMLAnchorElement>, stop: number) {
    e.preventDefault();
    jump(stop);
  }

  return (
    <div ref={trackRef} className="relative" data-mode={mode}>
      {is3d && (
        <div className="sticky top-0 z-0 h-[100svh] w-full overflow-hidden" aria-hidden>
          <TraceScene
            scene={scene}
            progress={progress}
            active={active}
            running={onScreen}
            onSelect={jump}
          />
          {/* Keeps the hero text readable over the opening shot; fades once the walk begins. */}
          <div
            className={`pointer-events-none absolute inset-0 bg-gradient-to-r from-bg via-bg/75 to-transparent transition-opacity duration-700 lg:via-bg/60 ${
              active === 0 ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>
      )}

      <div className={is3d ? "relative z-10 -mt-[100svh]" : "relative"}>
        <section
          data-stop={0}
          ref={(el) => {
            sections.current[0] = el;
          }}
          className={is3d ? "flex min-h-[100svh] items-center" : ""}
        >
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
            {hero}
            {is3d && (
              <p className="scroll-hint pb-10 font-mono text-xs text-muted">
                <span className="text-accent" aria-hidden>
                  ↓{" "}
                </span>
                scroll to walk the trace, or click any span
              </p>
            )}
            {mode === "2d" && (
              <div className="pb-10">
                <TraceView root={root} nowISO={nowISO} defaultId={defaultId} />
              </div>
            )}
          </div>
        </section>

        {scene.spans.map(({ span }, i) => (
          <section
            key={span.id}
            id={`span-${span.id}`}
            data-stop={i + 1}
            ref={(el) => {
              sections.current[i + 1] = el;
            }}
            className={
              is3d
                ? "flex min-h-[100svh] items-end pb-6 pt-[42svh] lg:items-center lg:py-20"
                : "py-4"
            }
          >
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
              <article
                className={`w-full rounded-2xl border bg-surface/85 p-5 backdrop-blur-md transition-[border-color,box-shadow] duration-500 sm:p-6 lg:max-w-[27rem] ${
                  is3d && active === i + 1
                    ? "border-accent/50 shadow-[0_0_60px_-20px_rgb(255_179_71/0.5)]"
                    : "border-line"
                }`}
              >
                <p className="font-mono text-[11px] text-muted">
                  {paths.get(span.id)!.join(" / ")} /
                </p>
                <div className="mt-1">
                  <SpanDetail span={span} withSummary />
                </div>
              </article>
            </div>
          </section>
        ))}
      </div>

      <nav
        aria-label="Spans"
        className={`fixed right-3 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-end gap-0.5 transition-opacity duration-300 lg:flex ${
          onScreen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {scene.spans.map(({ span }, i) => {
          const current = is3d && active === i + 1;
          return (
            <a
              key={span.id}
              href={`#span-${span.id}`}
              onClick={(e) => onRailClick(e, i + 1)}
              aria-current={current ? "true" : undefined}
              className="group flex items-center gap-2 rounded py-1 pl-2 font-mono text-[11px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <span
                className={`transition-all ${
                  current
                    ? "text-accent opacity-100"
                    : "text-muted opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                }`}
              >
                {span.id}
              </span>
              <span
                aria-hidden
                className={`h-0.5 rounded-full transition-all ${
                  current
                    ? "w-7 bg-accent"
                    : span.kind === "project"
                      ? "w-4 bg-ice/50 group-hover:bg-ice"
                      : "w-4 bg-muted/50 group-hover:bg-ink"
                }`}
              />
            </a>
          );
        })}
      </nav>
    </div>
  );
}
