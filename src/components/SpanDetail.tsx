import type { Span } from "@/data/trace";
import { parseDay } from "@/lib/trace";

const KIND_LABEL: Record<Span["kind"], string> = {
  group: "group",
  role: "role",
  engagement: "client engagement",
  project: "side project",
};

function month(day: string): string {
  return parseDay(day).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function dateRange(span: Span): string | null {
  if (!span.start) return null;
  const from = month(span.start);
  const to = span.end ? month(span.end) : "present";
  return from === to ? from : `${from} – ${to}`;
}

const chip = "rounded border border-line px-2 py-0.5 font-mono text-[11px] text-muted";
const label = "font-mono text-[11px] uppercase tracking-wider text-muted";

export function SpanDetail({ span }: { span: Span }) {
  const dates = dateRange(span);
  const steps = span.pipeline ?? [];
  return (
    <div>
      <p className="font-mono text-xs text-accent">{span.id}</p>
      <h3 className="mt-1 text-xl font-semibold tracking-tight">{span.title}</h3>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className={chip}>{KIND_LABEL[span.kind]}</span>
        {dates && <span className={chip}>{dates}</span>}
        {span.status && (
          <span className="rounded border border-amber-300/30 bg-amber-300/10 px-2 py-0.5 font-mono text-[11px] text-amber-200">
            {span.status}
          </span>
        )}
      </div>

      {span.metric && (
        <p className="mt-5 border-l-2 border-accent pl-3 font-mono text-base leading-snug text-accent">
          {span.metric}
        </p>
      )}

      <p className="mt-5 text-sm leading-relaxed text-ink/85">{span.description}</p>

      {steps.length > 0 && (
        <div className="mt-5">
          <p className={label}>pipeline</p>
          <ol className="mt-2 flex flex-wrap items-center gap-y-2 font-mono text-xs">
            {steps.map((step, i) => (
              <li key={step} className="flex items-center">
                {i > 0 && (
                  <span className="mx-1.5 text-muted" aria-hidden>
                    →
                  </span>
                )}
                <span
                  className="pipeline-step rounded border border-line bg-bg px-2 py-1 text-ink"
                  style={{
                    animationDelay: `${i * 0.7}s`,
                    animationDuration: `${steps.length * 0.7}s`,
                  }}
                >
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {span.stack && (
        <div className="mt-5">
          <p className={label}>stack</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {span.stack.map((s) => (
              <li key={s} className={chip}>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {span.caveat && (
        <p className="mt-5 rounded-lg border border-line bg-bg p-3 text-xs leading-relaxed text-muted">
          <span className="text-ink">Caveat:</span> {span.caveat}
        </p>
      )}

      {span.links && span.links.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-2">
          {span.links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-accent/40 px-3 py-1.5 font-mono text-xs text-accent transition-colors hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                {l.label} <span aria-hidden>↗</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
