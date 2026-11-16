import { EndOfTrace } from "@/components/EndOfTrace";
import { Evals } from "@/components/Evals";
import { HeaderStrip, Hero } from "@/components/TraceHeader";
import { TraceWorld } from "@/components/TraceWorld";
import { career, evals, profile } from "@/data/trace";
import { buildDay } from "@/lib/build";
import { countSpans, earliestStart, formatDuration, parseDay } from "@/lib/trace";

export default function Home() {
  const nowISO = buildDay();
  return (
    <main>
      <HeaderStrip
        profile={profile}
        spanCount={countSpans(career)}
        duration={formatDuration(earliestStart(career), parseDay(nowISO))}
      />
      <TraceWorld root={career} nowISO={nowISO} hero={<Hero profile={profile} />} />
      <div className="relative z-10 bg-bg">
        <Evals evals={evals} />
        <EndOfTrace profile={profile} />
      </div>
    </main>
  );
}
