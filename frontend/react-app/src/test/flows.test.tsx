import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderApp } from "./renderApp";

describe("claim processing", () => {
  it("runs the agent pipeline when opened with ?process=1", async () => {
    const { router } = renderApp("/claims/CLM10011?tab=ai-processing&process=1");

    expect(await screen.findByText("Claim processing started.")).toBeInTheDocument();
    expect(await screen.findByText("Claim processing completed.")).toBeInTheDocument();
    expect(router.state.location.search).not.toContain("process=1");
    expect(await screen.findByText(/7 of 7 steps completed/)).toBeInTheDocument();
  });

  it("explains the denial for the inactive policy claim", async () => {
    const { user } = renderApp("/claims/CLM10002");
    await screen.findByRole("heading", { level: 1, name: "Claim Details" });

    await user.click(screen.getByRole("tab", { name: /AI Processing/ }));
    const panel = await screen.findByRole("tabpanel");
    expect((await within(panel).findAllByText(/inactive/i)).length).toBeGreaterThan(0);
  });

  it("shows the duplicate match on the fraud tab", async () => {
    renderApp("/claims/CLM10007?tab=fraud-analysis");
    expect(await screen.findByText("0.94")).toBeInTheDocument();
    expect((await screen.findAllByText(/CLM09001/)).length).toBeGreaterThan(0);
  });
});

describe("evaluation", () => {
  it("runs the evaluation suite", async () => {
    const { user } = renderApp("/evaluation");
    await screen.findByRole("table", { name: "Evaluation test cases" });

    await user.click(screen.getByRole("button", { name: /Run Evaluation/ }));
    expect(await screen.findByText("Evaluation completed.")).toBeInTheDocument();
    expect(screen.getByText("TEST011")).toBeInTheDocument();
  });
});

describe("analytics", () => {
  it("renders every chart section", async () => {
    renderApp("/analytics");
    for (const title of [
      "Claims by Status",
      "Fraud Risk Distribution",
      "Claims Processing Trend",
      "Average Agent Processing Time",
      "Payer Distribution",
    ]) {
      expect(await screen.findByText(title)).toBeInTheDocument();
    }
    expect(screen.getAllByText("XYZ Insurance").length).toBeGreaterThan(0);
  });
});
