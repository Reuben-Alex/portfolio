"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import type { Span } from "@/data/trace";
import {
  axisRange,
  axisYears,
  barFor,
  flatten,
  formatMonth,
  parseDay,
  pctOf,
  type Range,
} from "@/lib/trace";
import { SpanDetail } from "@/components/SpanDetail";

interface Props {
  root: Span;
  /** Build day, "YYYY-MM-DD". The time axis ends at this month. */
  nowISO: string;
  defaultId: string;
}

const ROW_GRID = "lg:grid lg:grid-cols-[minmax(0,46%)_minmax(0,1fr)] lg:items-stretch";

/** Bars narrower than this get their month written beside them. */
const SHORT_BAR_PCT = 5;

const subscribeNever = () => () => {};
/** False on the server and during hydration, true afterwards. */
function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}

/** A vertical line with a month label that follows the pointer across the timeline. */
function Crosshair({ range, hostRef }: { range: Range; hostRef: RefObject<HTMLElement | null> }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [pct, setPct] = useState<number | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const move = (e: PointerEvent) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) return setPct(null);
      const p = (e.clientX - rect.left) / rect.width;
      setPct(p >= 0 && p <= 1 ? p : null);
    };
    const leave = () => setPct(null);
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);
    return () => {
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
    };
  }, [hostRef]);

  const label =
    pct === null
      ? null
      : formatMonth(
          new Date(range.start.getTime() + pct * (range.end.getTime() - range.start.getTime())),
        );

  return (
    <div
      ref={trackRef}
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-[46%] right-4 z-10 hidden lg:block"
    >
      {pct !== null && (
        <>
          <span className="absolute inset-y-0 w-px bg-accent/50" style={{ left: `${pct * 100}%` }} />
          <span
            className="absolute top-2 -translate-x-1/2 whitespace-nowrap rounded bg-accent px-1.5 py-0.5 font-mono text-[10px] font-medium text-bg"
            style={{ left: `${pct * 100}%` }}
          >
            {label}
          </span>
        </>
      )}
    </div>
  );
}

export function TraceView({ root, nowISO, defaultId }: Props) {
  const now = useMemo(() => parseDay(nowISO), [nowISO]);
  const flat = useMemo(() => flatten(root), [root]);
  const range = useMemo(() => axisRange(root, now), [root, now]);
  const years = useMemo(() => axisYears(range), [range]);
  const yearPct = (y: number) => pctOf(new Date(Date.UTC(y, 0, 1)), range);

  const [selectedId, setSelectedId] = useState(defaultId);
  // Until the visitor picks a span, inline details stay closed (small screens start with none open).
  const [touched, setTouched] = useState(false);
  const [run, setRun] = useState(0);
  const paneRef = useRef<HTMLDivElement>(null);
  const selected = flat.find((f) => f.span.id === selectedId)?.span;

  // Stream-in: rows are plain and visible in the server HTML ("static"). Once the page is
  // live they wait off screen ("pending") and play when the trace scrolls into view ("run").
  const reduced = useReducedMotion();
  const isClient = useIsClient();
  const inView = useInView(paneRef, { once: true, amount: 0.1 });
  const phase = reduced || !isClient ? "static" : inView ? "run" : "pending";

  function select(id: string) {
    setSelectedId(id);
    setTouched(true);
  }

  function onKeyDown(e: KeyboardEvent<HTMLUListElement>) {
    const buttons = [
      ...e.currentTarget.querySelectorAll<HTMLButtonElement>("button[data-span]"),
    ];
    const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (at === -1) return;
    const target = {
      ArrowDown: Math.min(at + 1, buttons.length - 1),
      ArrowUp: Math.max(at - 1, 0),
      Home: 0,
      End: buttons.length - 1,
    }[e.key];
    if (target === undefined) return;
    e.preventDefault();
    buttons[target].focus();
  }

  function trackGlow(e: ReactPointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  const gridlines = years.map((y) => (
    <span key={y} className="absolute inset-y-0 w-px bg-line" style={{ left: `${yearPct(y)}%` }} />
  ));

  return (
    <div
      onPointerMove={trackGlow}
      className="glow-surface overflow-clip rounded-2xl border border-line bg-surface lg:grid lg:grid-cols-[minmax(0,1fr)_24rem]"
    >
      <div ref={paneRef} className="relative min-w-0">
        <div className="flex items-center gap-2 border-b border-line px-4 py-2.5 font-mono text-[11px] text-muted">
          <span className="text-accent" aria-hidden>
            ●
          </span>
          <span>recorded · {flat.length} spans</span>
          <span className="hidden sm:inline">· select a span to inspect it</span>
          {!reduced && (
            <button
              type="button"
              onClick={() => setRun((r) => r + 1)}
              className="ml-auto cursor-pointer rounded border border-line px-2 py-1 text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <span aria-hidden>↻ </span>replay
            </button>
          )}
        </div>

        <div
          className={`hidden border-b border-line font-mono text-[11px] text-muted ${ROW_GRID}`}
          aria-hidden
        >
          <div className="px-4 py-2.5">span</div>
          <div className="relative mr-4">
            {gridlines}
            {years.map((y) => (
              <span key={y} className="absolute top-2.5 pl-1.5" style={{ left: `${yearPct(y)}%` }}>
                {y}
              </span>
            ))}
          </div>
        </div>

        <div className="relative">
          <Crosshair range={range} hostRef={paneRef} />
          <ul key={run} data-phase={phase} onKeyDown={onKeyDown}>
            {flat.map((item, index) => {
              const { span, depth } = item;
              const indent = { paddingLeft: `${1 + depth * 1.1}rem` };
              const order = { "--i": index } as CSSProperties;

              if (span.kind === "group") {
                return (
                  <li key={span.id} className={`span-row ${ROW_GRID}`} style={order}>
                    <div
                      className="pb-1.5 pr-4 pt-3 font-mono text-[11px] uppercase tracking-wider text-muted"
                      style={indent}
                    >
                      {span.id}
                    </div>
                    <div className="relative mr-4 hidden lg:block" aria-hidden>
                      {gridlines}
                    </div>
                  </li>
                );
              }

              const bar = barFor(item, range, now);
              const isSelected = span.id === selectedId;
              const barTone = bar?.dashed
                ? `border border-dashed ${
                    isSelected ? "border-accent" : "border-accent/35 group-hover:border-accent/80"
                  }`
                : isSelected
                  ? "bg-accent shadow-[0_0_14px_rgb(124_247_196/0.55)]"
                  : span.kind === "project"
                    ? "bg-accent/55 group-hover:bg-accent"
                    : "bg-ink/30 group-hover:bg-ink/60";

              return (
                <li key={span.id} className="span-row" style={order}>
                  <button
                    type="button"
                    data-span={span.id}
                    aria-pressed={isSelected}
                    onClick={() => select(span.id)}
                    className={`group relative w-full cursor-pointer text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${ROW_GRID} ${
                      isSelected ? "bg-accent/[0.07]" : "hover:bg-ink/[0.04]"
                    }`}
                  >
                    <span
                      className={`absolute inset-y-0 left-0 w-0.5 ${isSelected ? "bg-accent" : "bg-transparent"}`}
                      aria-hidden
                    />
                    <span className="block min-w-0 py-2.5 pr-4" style={indent}>
                      <span
                        className={`block truncate font-mono text-sm transition-colors ${
                          isSelected ? "text-accent" : "text-ink group-hover:text-accent"
                        }`}
                      >
                        {span.id}
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-muted lg:truncate">
                        {span.summary}
                      </span>
                    </span>
                    <span className="relative mr-4 hidden lg:block" aria-hidden>
                      {gridlines}
                      {bar && !bar.dashed && bar.widthPct < SHORT_BAR_PCT && (
                        <span
                          className="absolute top-1/2 -translate-y-1/2 pr-2 font-mono text-[10px] text-muted"
                          style={{ right: `${100 - bar.leftPct}%` }}
                        >
                          {formatMonth(parseDay(span.start!))}
                        </span>
                      )}
                      {bar && (
                        <span
                          data-bar
                          className={`absolute top-1/2 h-2 -translate-y-1/2 rounded-full transition-colors ${barTone}`}
                          style={{ left: `${bar.leftPct}%`, width: `${bar.widthPct}%` }}
                        />
                      )}
                    </span>
                  </button>
                  <div
                    id={`detail-${span.id}`}
                    hidden={!(isSelected && touched)}
                    className="border-y border-line bg-bg/60 px-4 py-5 lg:hidden"
                  >
                    <SpanDetail span={span} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <section aria-label="Span detail" className="hidden border-l border-line lg:block">
        <div className="sticky top-14 p-6" aria-live="polite">
          <AnimatePresence initial={false}>
            {selected && (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduced ? 0 : 0.25, ease: "easeOut" }}
              >
                <SpanDetail span={selected} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
