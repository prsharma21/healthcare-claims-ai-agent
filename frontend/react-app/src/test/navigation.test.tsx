import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderApp } from "./renderApp";

describe("routing and navigation", () => {
  it("redirects / to the dashboard and shows metrics and recent claims", async () => {
    const { router } = renderApp("/");

    expect(await screen.findByRole("heading", { level: 1, name: "Healthcare Claims Dashboard" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/dashboard");
    expect(await screen.findByRole("link", { name: /Total Claims: 1,248/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Fraud Review: 38/ })).toHaveAttribute("href", "/claims?status=FRAUD_REVIEW");
    expect(await screen.findByRole("row", { name: /Open claim CLM10007/ })).toBeInTheDocument();
  });

  it.each([
    ["/claims", "Claims"],
    ["/upload", "Submit New Claim"],
    ["/analytics", "Analytics"],
    ["/ai-processing", "AI Processing"],
    ["/evaluation", "AI Evaluation Dashboard"],
    ["/settings", "Settings"],
    ["/claims/CLM10001", "Claim Details"],
    ["/does-not-exist", "Page not found"],
  ])("renders %s", async (path, heading) => {
    renderApp(path);
    expect(await screen.findByRole("heading", { level: 1, name: heading })).toBeInTheDocument();
  });

  it("navigates with the sidebar", async () => {
    const { user, router } = renderApp("/dashboard");
    const nav = await screen.findByRole("navigation", { name: "Main navigation" });

    await user.click(within(nav).getByRole("link", { name: "Analytics" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Analytics" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/analytics");

    await user.click(within(nav).getByRole("link", { name: "Settings" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Settings" })).toBeInTheDocument();
  });

  it("opens claim details from a dashboard row", async () => {
    const { user, router } = renderApp("/dashboard");

    await user.click(await screen.findByRole("row", { name: /Open claim CLM10001/ }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/claims/CLM10001"));
    expect(await screen.findByRole("heading", { level: 1, name: "Claim Details" })).toBeInTheDocument();
  });

  it("shows an error state with retry for an unknown claim", async () => {
    renderApp("/claims/CLM99999");
    expect(await screen.findByText("Unable to load claim.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
