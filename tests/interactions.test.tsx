import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { career, DEFAULT_SPAN_ID, profile } from "@/data/trace";

const reduced = vi.hoisted(() => ({ value: false }));
vi.mock("motion/react", async (original) => ({
  ...(await original<typeof import("motion/react")>()),
  useReducedMotion: () => reduced.value,
}));

import { TraceView } from "@/components/TraceView";
import { CountUp } from "@/components/CountUp";
import { siteMetadata } from "@/lib/site";

afterEach(() => {
  reduced.value = false;
});

const view = () =>
  render(<TraceView root={career} nowISO="2026-11-16" defaultId={DEFAULT_SPAN_ID} />);
const rows = (c: HTMLElement) => c.querySelectorAll("button[data-span]");
const list = (c: HTMLElement) => c.querySelector("ul[data-phase]")!;

describe("stream-in", () => {
  it("plays once the trace is on screen", () => {
    const { container } = view();
    expect(list(container)).toHaveAttribute("data-phase", "run");
  });

  it("is skipped for visitors who prefer reduced motion", () => {
    reduced.value = true;
    const { container } = view();
    expect(list(container)).toHaveAttribute("data-phase", "static");
    for (const row of rows(container)) {
      expect(row).toBeVisible();
      expect(row.closest("li")!.getAttribute("style") ?? "").not.toContain("opacity");
    }
  });

  it("is not baked into the server HTML", () => {
    const html = renderToStaticMarkup(
      <TraceView root={career} nowISO="2026-11-16" defaultId={DEFAULT_SPAN_ID} />,
    );
    expect(html).toContain('data-phase="static"');
    expect(html).not.toContain("opacity:0");
  });

  it("replays on request and keeps every row", async () => {
    const { container } = view();
    const before = list(container);
    await userEvent.click(screen.getByRole("button", { name: /replay/i }));
    expect(list(container)).not.toBe(before);
    expect(rows(container)).toHaveLength(11);
  });
});

describe("server HTML under reduced motion", () => {
  it("still contains the replay button, so hydration matches", () => {
    reduced.value = true;
    const html = renderToStaticMarkup(
      <TraceView root={career} nowISO="2026-11-16" defaultId={DEFAULT_SPAN_ID} />,
    );
    expect(html).toContain("replay</button>");
  });
});

describe("CountUp", () => {
  it("renders the final value on the server", () => {
    for (const h of profile.headline) {
      expect(renderToStaticMarkup(<CountUp value={h.value} count={h.count} />)).toContain(h.value);
    }
  });

  it("shows the final value immediately under reduced motion", () => {
    reduced.value = true;
    render(<CountUp value="3rd of 245" count={245} />);
    expect(screen.getByText("3rd of 245")).toBeInTheDocument();
  });
});

describe("metadata", () => {
  it("names him and carries the sourced hackathon wording", () => {
    expect(String(siteMetadata.title)).toContain("Reuben Alex");
    expect(siteMetadata.description).toContain(
      "3rd of 245 final-round submissions in the Arize track of the Google Cloud Rapid Agent Hackathon",
    );
    expect(profile.headline[2].label).toContain("final-round submissions");
  });
});
