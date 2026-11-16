import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TraceView } from "@/components/TraceView";
import { career, DEFAULT_SPAN_ID, type Span } from "@/data/trace";
import { flatten } from "@/lib/trace";

const selectable = flatten(career)
  .map((f) => f.span)
  .filter((s: Span) => s.kind !== "group");

function setup() {
  const view = render(<TraceView root={career} nowISO="2026-11-16" defaultId={DEFAULT_SPAN_ID} />);
  const row = (id: string) =>
    view.container.querySelector<HTMLButtonElement>(`button[data-span="${id}"]`)!;
  const inline = (id: string) => view.container.querySelector<HTMLElement>(`#detail-${id}`)!;
  const panel = () => screen.getByRole("region", { name: "Span detail" });
  return { ...view, row, inline, panel, user: userEvent.setup() };
}

describe("TraceView", () => {
  it("renders one button per selectable span, each showing its result", () => {
    const { container, row } = setup();
    expect(container.querySelectorAll("button[data-span]")).toHaveLength(11);
    for (const s of selectable) expect(row(s.id)).toHaveTextContent(s.summary!);
  });

  it("selects clintrace at load", () => {
    const { row } = setup();
    expect(row("clintrace")).toHaveAttribute("aria-pressed", "true");
  });

  it("moves the selection when another span is clicked", async () => {
    const { row, panel, user } = setup();
    await user.click(row("re_entry"));
    expect(row("re_entry")).toHaveAttribute("aria-pressed", "true");
    expect(row("clintrace")).toHaveAttribute("aria-pressed", "false");
    expect(panel()).toHaveTextContent(/agent-generated 5 of 13/i);
  });

  it("moves focus with arrow keys and skips group headings", async () => {
    const { row, user } = setup();
    row("mu_sigma_trainee").focus();
    await user.keyboard("{ArrowUp}");
    expect(row("mu_sigma_trainee")).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(row("intern_sam2")).toHaveFocus();
    await user.keyboard("{End}");
    expect(row("revenant")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(row("mu_sigma_trainee")).toHaveFocus();
  });

  it("selects the focused span with Enter", async () => {
    const { row, user } = setup();
    row("trellis").focus();
    await user.keyboard("{Enter}");
    expect(row("trellis")).toHaveAttribute("aria-pressed", "true");
  });

  it("gives trellis no link and marks revenant in development", () => {
    const { inline } = setup();
    expect(within(inline("trellis")).queryAllByRole("link", { hidden: true })).toHaveLength(0);
    expect(inline("revenant")).toHaveTextContent("in development");
  });

  it("shows no dates for an engagement", async () => {
    const { row, panel, user } = setup();
    await user.click(row("lease_agent"));
    expect(panel().textContent).not.toMatch(/20\d\d/);
  });

  it("keeps inline details closed until the visitor selects something", async () => {
    const { row, inline, user } = setup();
    expect(inline("clintrace")).not.toBeVisible();
    await user.click(row("re_entry"));
    expect(inline("re_entry")).toBeVisible();
    expect(inline("clintrace")).not.toBeVisible();
  });

  it("labels short project bars with their month", () => {
    const { row } = setup();
    expect(row("clintrace")).toHaveTextContent("Jun 2026");
    expect(row("associate_engineer")).not.toHaveTextContent(/20dd/);
  });
});
