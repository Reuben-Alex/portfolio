import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { TraceWorld } from "@/components/TraceWorld";
import { VideoEmbed } from "@/components/VideoEmbed";
import { career, type Span } from "@/data/trace";
import { flatten } from "@/lib/trace";

const all = flatten(career).map((f) => f.span);
const byId = (id: string) => all.find((s: Span) => s.id === id)!;
const world = <TraceWorld root={career} nowISO="2026-11-16" hero={<h1>Hero</h1>} />;

describe("project videos", () => {
  it("are attached to ClinTrace and Re-entry", () => {
    expect(byId("clintrace").video?.id).toBe("hKs4fqzKKHw");
    expect(byId("re_entry").video?.id).toBe("LTIwdPee_do");
    expect(all.filter((s) => s.video)).toHaveLength(2);
  });
});

describe("VideoEmbed", () => {
  it("loads the player only when asked, and always links to YouTube", async () => {
    const { container } = render(<VideoEmbed id="hKs4fqzKKHw" title="ClinTrace demo" />);
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("link", { name: /watch on youtube/i })).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=hKs4fqzKKHw",
    );
    await userEvent.click(screen.getByRole("button", { name: "Play video: ClinTrace demo" }));
    const frame = container.querySelector("iframe")!;
    expect(frame.getAttribute("src")).toContain("https://www.youtube-nocookie.com/embed/hKs4fqzKKHw");
    expect(frame).toHaveAttribute("title", "ClinTrace demo");
  });
});

describe("TraceWorld", () => {
  const html = renderToStaticMarkup(world);
  const doc = document.createElement("div");
  doc.innerHTML = html;

  it("server-renders the hero and one readable section per span", () => {
    const stops = doc.querySelectorAll("[data-stop]");
    expect(stops).toHaveLength(12);
    expect(stops[0]).toHaveTextContent("Hero");
    const text = doc.textContent ?? "";
    for (const s of all) {
      expect(text).toContain(s.id);
      if (s.summary) expect(text).toContain(s.summary);
      if (s.description) expect(text).toContain(s.description);
    }
  });

  it("server-renders no canvas and nothing hidden", () => {
    expect(doc.querySelector("canvas")).toBeNull();
    expect(html).not.toContain("opacity:0");
    expect(doc.querySelectorAll("[hidden]")).toHaveLength(0);
  });

  it("falls back to the 2D waterfall where WebGL is unavailable", () => {
    const { container } = render(world);
    expect(container.querySelector("canvas")).toBeNull();
    expect(container.querySelectorAll("button[data-span]")).toHaveLength(11);
  });

  it("offers a jump link to every span", () => {
    render(world);
    const nav = screen.getByRole("navigation", { name: "Spans" });
    expect(nav.querySelectorAll("a")).toHaveLength(11);
    expect(nav.querySelector('a[href="#span-clintrace"]')).not.toBeNull();
  });
});
