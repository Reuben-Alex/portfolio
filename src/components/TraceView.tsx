"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { Span } from "@/data/trace";
import { axisRange, axisYears, barFor, flatten, parseDay, pctOf } from "@/lib/trace";
import { SpanDetail } from "@/components/SpanDetail";

interface Props {
  root: Span;
  /** Build day, "YYYY-MM-DD". The time axis ends at this month. */
  nowISO: string;
  defaultId: string;
}

const ROW_GRID = "lg:grid lg:grid-cols-[minmax(0,46%)_minmax(0,1fr)] lg:items-stretch";

export function TraceView({ root, nowISO, defaultId }: Props) {
  const now = useMemo(() => parseDay(nowISO), [nowISO]);
  const flat = useMemo(() => flatten(root), [root]);
  const range = useMemo(() => axisRange(root, now), [root, now]);
  const years = useMemo(() => axisYears(range), [range]);
  const yearPct = (y: number) => pctOf(new Date(Date.UTC(y, 0, 1)), range);

  const [selectedId, setSelectedId] = useState(defaultId);
  // Until the visitor picks a span, inline details stay closed (small screens start with none open).
  const [touched, setTouched] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const selected = flat.find((f) => f.span.id === selectedId)?.span;

  function select(id: string) {
    setSelectedId(id);
    setTouched(true);
  }

  function onKeyDown(e: KeyboardEvent<HTMLUListElement>) {
    const buttons = [
      ...(listRef.current?.querySelectorAll<HTMLButtonElement>("button[data-span]") ?? []),
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

  const gridlines = years.map((y) => (
    <span key={y} className="absolute inset-y-0 w-px bg-line" style={{ left: `${yearPct(y)}%` }} />
  ));

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface lg:grid lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="min-w-0">
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

        <ul ref={listRef} onKeyDown={onKeyDown}>
          {flat.map((item) => {
            const { span, depth } = item;
            const indent = { paddingLeft: `${1 + depth * 1.1}rem` };

            if (span.kind === "group") {
              return (
                <li key={span.id} className={ROW_GRID}>
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
              <li key={span.id}>
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
                      className={`block truncate font-mono text-sm ${isSelected ? "text-accent" : "text-ink"}`}
                    >
                      {span.id}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted lg:truncate">
                      {span.summary}
                    </span>
                  </span>
                  <span className="relative mr-4 hidden lg:block" aria-hidden>
                    {gridlines}
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

      <section aria-label="Span detail" className="hidden border-l border-line lg:block">
        <div className="sticky top-14 p-6" aria-live="polite">
          {selected && <SpanDetail span={selected} />}
        </div>
      </section>
    </div>
  );
}
