import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Home from "@/app/page";
import { career, evals, profile } from "@/data/trace";
import { flatten } from "@/lib/trace";

// What a visitor without JavaScript receives.
const html = renderToStaticMarkup(<Home />);
const doc = document.createElement("div");
doc.innerHTML = html;
const text = doc.textContent ?? "";

describe("server-rendered page", () => {
  it("contains the hero", () => {
    expect(text).toContain(profile.name);
    expect(text).toContain(profile.tagline);
    expect(text).toContain("3rd of 245");
    expect(text).toContain("80%");
    expect(text).toContain("$600K");
  });

  it("contains every span id and result", () => {
    for (const { span } of flatten(career)) {
      expect(text).toContain(span.id);
      if (span.summary) expect(text).toContain(span.summary);
    }
  });

  it("contains every eval", () => {
    for (const e of evals) expect(text).toContain(e.name);
  });

  it("links to email, GitHub and LinkedIn", () => {
    const hrefs = [...doc.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("mailto:reubenalexa@gmail.com");
    expect(hrefs).toContain(profile.github);
    expect(hrefs).toContain(profile.linkedin);
  });

  it("leaves out what was excluded", () => {
    expect(text).not.toContain("Christ");
    expect(text.toLowerCase()).not.toContain("résumé");
  });
});
