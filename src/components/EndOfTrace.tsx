import type { profile as Profile } from "@/data/trace";

const link =
  "text-muted underline-offset-4 transition-colors hover:text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent";

export function EndOfTrace({ profile }: { profile: typeof Profile }) {
  return (
    <footer className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6">
      <div className="flex items-center gap-4 font-mono text-xs text-muted" aria-hidden>
        <span className="h-px flex-1 bg-line" />
        end of trace
        <span className="h-px flex-1 bg-line" />
      </div>
      <div className="mt-14 text-center">
        <p className="mx-auto max-w-xl text-2xl leading-snug sm:text-3xl">
          If you are hiring for agentic AI work, I would like to hear from you.
        </p>
        <a
          href={`mailto:${profile.email}`}
          className="mt-8 inline-block break-all rounded-xl border border-accent/40 bg-accent/10 px-5 py-3 font-mono text-sm text-accent transition-colors hover:bg-accent/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent sm:text-base"
        >
          {profile.email}
        </a>
        <p className="mt-6 flex justify-center gap-6 font-mono text-xs">
          <a className={link} href={profile.github} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <a className={link} href={profile.linkedin} target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
        </p>
      </div>
    </footer>
  );
}
