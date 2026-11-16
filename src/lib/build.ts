import { career } from "@/data/trace";
import { flatten } from "@/lib/trace";

/**
 * The day the site was built ("YYYY-MM-DD"), set in next.config.ts.
 * Outside a build (tests), falls back to the latest date in the content.
 */
export function buildDay(): string {
  const latest = flatten(career)
    .flatMap((f) => [f.span.start, f.span.end])
    .filter((d): d is string => Boolean(d))
    .sort()
    .at(-1)!;
  return process.env.NEXT_PUBLIC_BUILD_DAY ?? latest;
}
