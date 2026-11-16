import { EndOfTrace } from "@/components/EndOfTrace";
import { Evals } from "@/components/Evals";
import { TraceHeader } from "@/components/TraceHeader";
import { TraceView } from "@/components/TraceView";
import { career, DEFAULT_SPAN_ID, evals, profile } from "@/data/trace";
import { buildDay } from "@/lib/build";
import { countSpans, earliestStart, formatDuration, parseDay } from "@/lib/trace";

export default function Home() {
  const nowISO = buildDay();
  return (
    <main>
      <TraceHeader
        profile={profile}
        spanCount={countSpans(career)}
        duration={formatDuration(earliestStart(career), parseDay(nowISO))}
      />
      <section className="mx-auto max-w-7xl px-4 sm:px-6" aria-label="Career trace">
        <h2 className="mb-5 font-mono text-sm text-ink">
          <span className="text-accent">#</span> span waterfall
        </h2>
        <TraceView root={career} nowISO={nowISO} defaultId={DEFAULT_SPAN_ID} />
      </section>
      <Evals evals={evals} />
      <EndOfTrace profile={profile} />
    </main>
  );
}
