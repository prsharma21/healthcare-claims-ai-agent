import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderApp } from "./renderApp";

function claimRows() {
  const table = screen.getByRole("table", { name: "Claims matching the current filters" });
  return within(table)
    .getAllByRole("row")
    .slice(1)
    .map((row) => row.getAttribute("aria-label") ?? "");
}

describe("claims list filters", () => {
  it("filters by status from the URL", async () => {
    renderApp("/claims?status=DENIED");
    await screen.findByRole("table", { name: "Claims matching the current filters" });

    const rows = claimRows();
    expect(rows).toHaveLength(2);
    expect(rows.join(" ")).toMatch(/CLM10002/);
    expect(rows.join(" ")).toMatch(/CLM10003/);
  });

  it("searches by patient name and clears filters", async () => {
    const { user, router } = renderApp("/claims");
    await screen.findByRole("table", { name: "Claims matching the current filters" });

    await user.type(screen.getByRole("searchbox"), "Priya");
    await waitFor(() => expect(claimRows()).toHaveLength(1));
    expect(claimRows()[0]).toMatch(/CLM10004/);
    expect(router.state.location.search).toContain("q=Priya");

    await user.click(screen.getByRole("button", { name: /Clear/ }));
    await waitFor(() => expect(claimRows().length).toBeGreaterThan(1));
  });

  it("filters by risk and payer", async () => {
    renderApp("/claims?risk=HIGH");
    await screen.findByRole("table", { name: "Claims matching the current filters" });
    const rows = claimRows();
    expect(rows).toHaveLength(2);
    expect(rows.join(" ")).toMatch(/CLM10007/);
    expect(rows.join(" ")).toMatch(/CLM10008/);
  });

  it("shows the empty state when nothing matches", async () => {
    const { user } = renderApp("/claims");
    await screen.findByRole("table", { name: "Claims matching the current filters" });
    await user.type(screen.getByRole("searchbox"), "zzzz-no-match");
    expect(await screen.findByText("No claims found.")).toBeInTheDocument();
  });

  it("opens claim details from the View button", async () => {
    const { user, router } = renderApp("/claims");
    await user.click(await screen.findByRole("button", { name: "View claim CLM10002" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/claims/CLM10002"));
  });
});
