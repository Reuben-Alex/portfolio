import type { Eval } from "@/data/trace";

export function Evals({ evals }: { evals: Eval[] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="flex items-baseline justify-between">
        <h2 className="font-mono text-sm text-ink">
          <span className="text-accent">#</span> evals
        </h2>
        <p className="font-mono text-xs text-muted">
          {evals.length}/{evals.length} passing
        </p>
      </div>
      <ul className="mt-5 overflow-hidden rounded-2xl border border-line bg-surface">
        {evals.map((e) => (
          <li
            key={e.name}
            className="flex items-start gap-3 border-b border-line px-4 py-3.5 transition-colors last:border-b-0 hover:bg-ink/[0.04] sm:items-center"
          >
            <span className="shrink-0 rounded border border-accent/30 bg-accent/10 px-1.5 py-0.5 font-mono text-[11px] text-accent">
              PASS
            </span>
            <span className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between sm:gap-4">
              <span className="block text-sm text-ink">{e.name}</span>
              <span className="mt-0.5 block font-mono text-xs text-muted sm:mt-0">{e.issuer}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
