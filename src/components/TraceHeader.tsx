import { CountUp } from "@/components/CountUp";
import type { profile as Profile } from "@/data/trace";

interface Props {
  profile: typeof Profile;
  spanCount: number;
  duration: string;
}

const linkClass =
  "rounded px-2 py-1 text-muted transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent";

export function HeaderStrip({ profile, spanCount, duration }: Props) {
  return (
      <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 font-mono text-xs sm:px-6">
          <span className="hidden text-muted sm:inline">trace</span>
          <span className="hidden truncate text-ink sm:inline">reuben-alex/career</span>
          <span className="flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-accent">
            <span className="status-dot h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
            OK
          </span>
          <span className="hidden text-muted md:inline">{duration}</span>
          <span className="hidden text-muted md:inline">{spanCount} spans</span>
          <nav aria-label="Profiles" className="ml-auto flex items-center">
            <a className={linkClass} href={profile.github} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <a className={linkClass} href={profile.linkedin} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
            <a className={linkClass} href={`mailto:${profile.email}`}>
              Email
            </a>
          </nav>
        </div>
      </header>
  );
}

export function Hero({ profile }: Pick<Props, "profile">) {
  return (
      <div className="pb-14 pt-16 sm:pt-24">
        <p className="font-mono text-xs text-muted">
          <span className="text-accent">root span</span> · {profile.location}
        </p>
        <h1 className="mt-4 font-display text-6xl font-semibold tracking-tight sm:text-8xl">{profile.name}</h1>
        <p className="mt-3 text-lg text-muted">{profile.role}</p>
        <p className="mt-8 max-w-2xl font-display text-2xl leading-snug text-ink sm:text-4xl sm:leading-tight">
          {profile.tagline}
        </p>
        <dl className="mt-12 grid max-w-3xl gap-3 sm:grid-cols-[1fr_1fr_1.5fr]">
          {profile.headline.map((h) => (
            <div
              key={h.label}
              className="rounded-xl border border-line bg-surface/70 p-5 backdrop-blur-md transition-colors hover:border-accent/40"
            >
              <dt className="font-mono text-3xl text-accent sm:text-4xl">
                <CountUp value={h.value} count={h.count} />
              </dt>
              <dd className="mt-2 text-sm text-muted">{h.label}</dd>
            </div>
          ))}
        </dl>
      </div>
  );
}
