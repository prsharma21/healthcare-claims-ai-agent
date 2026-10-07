import { fireEvent, screen, within } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { FAKE_BUCKET, mockApi, mockClaimsBackend } from "./mockApi";
import { renderApp } from "./renderApp";

function pdf(name: string) {
  return new File(["%PDF-1.7 test"], name, { type: "application/pdf" });
}

function fileInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error("File input not found");
  return input;
}

async function fillClaimForm(user: UserEvent, container: HTMLElement, fileName = "claim_10001.pdf") {
  await user.type(await screen.findByLabelText("Patient ID"), "PAT10001");
  await user.type(screen.getByLabelText("Provider ID"), "PRV10001");
  await user.type(screen.getByLabelText("Payer ID"), "PAY10001");
  await user.selectOptions(screen.getByLabelText("Claim Type"), "OUTPATIENT");
  await user.upload(fileInput(container), pdf(fileName));
}

function uploadButton() {
  return screen.getByRole("button", { name: /Upload Claim/ });
}

describe("upload claim (POST /claims/upload)", () => {
  it("uploads claim PDFs and shows the generated IDs, status and S3 object", async () => {
    const { requests } = mockClaimsBackend();
    const { user, container } = renderApp("/upload");

    expect(await screen.findByText("No claims created yet.")).toBeInTheDocument();
    await fillClaimForm(user, container);
    await user.click(uploadButton());

    expect(await screen.findByRole("heading", { name: "Claim Created Successfully" })).toBeInTheDocument();
    const card = screen.getByRole("status");
    expect(within(card).getByText("CLM10001")).toBeInTheDocument();
    expect(within(card).getByText("UPLOADED")).toBeInTheDocument();
    expect(within(card).getByText("incoming/CLM10001/claim_10001.pdf")).toBeInTheDocument();
    expect(within(card).getByText(FAKE_BUCKET)).toBeInTheDocument();
    expect(await screen.findByText("Claim document uploaded.")).toBeInTheDocument();

    const post = requests.find((request) => request.url === "/claims/upload");
    expect(post?.method).toBe("post");
    const form = post?.data as FormData;
    expect(form).toBeInstanceOf(FormData);
    expect((form.get("file") as File).name).toBe("claim_10001.pdf");
    expect(Object.fromEntries([...form.entries()].filter(([name]) => name !== "file"))).toEqual({
      patient_id: "PAT10001",
      provider_id: "PRV10001",
      payer_id: "PAY10001",
      claim_type: "OUTPATIENT",
    });

    const table = await screen.findByRole("table", { name: "Claims stored by the claims API" });
    expect(await within(table).findByText("CLM10001")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Upload Another Claim/ }));
    await fillClaimForm(user, container, "claim_10002.pdf");
    await user.click(uploadButton());

    expect(await screen.findByText("incoming/CLM10002/claim_10002.pdf")).toBeInTheDocument();
    expect(within(screen.getByRole("status")).getByText("CLM10002")).toBeInTheDocument();
    expect(await within(table).findByText("CLM10002")).toBeInTheDocument();
    expect(within(table).getByText("CLM10001")).toBeInTheDocument();
  });

  it("requires the claim details and a PDF before calling the API", async () => {
    const { requests } = mockClaimsBackend();
    const { user } = renderApp("/upload");

    await screen.findByLabelText("Patient ID");
    await user.click(uploadButton());

    expect(await screen.findByText("Patient ID is required.")).toBeInTheDocument();
    expect(screen.getByText("Claim Type is required.")).toBeInTheDocument();
    expect(screen.getByText("Select the claim PDF to upload.")).toBeInTheDocument();
    expect(requests.some((request) => request.method === "post")).toBe(false);
  });

  it("shows API validation errors (422) next to the fields", async () => {
    mockApi((config) =>
      config.method === "post"
        ? {
            status: 422,
            data: {
              detail: [
                { loc: ["body", "patient_id"], msg: "Value error, must look like PAT10001", type: "value_error" },
                { loc: ["body", "claim_type"], msg: "Input should be 'INPATIENT', 'OUTPATIENT', 'EMERGENCY' or 'PHARMACY'" },
              ],
            },
          }
        : { status: 200, data: { claims: [], total: 0 } },
    );
    const { user, container } = renderApp("/upload");

    await fillClaimForm(user, container);
    await user.click(uploadButton());

    expect(await screen.findByText("Patient ID must look like PAT10001.")).toBeInTheDocument();
    expect(screen.getByLabelText("Patient ID")).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByRole("heading", { name: "Claim Created Successfully" })).not.toBeInTheDocument();
  });

  it.each([
    ["non-PDF rejection (400)", { status: 400, data: { detail: "Only PDF files are supported" } }, "Only PDF files are supported."],
    ["S3 failure (500)", { status: 500, data: { detail: "Failed to upload claim document to S3" } }, "Unable to upload claim document. Please try again."],
    ["missing storage configuration (503)", { status: 503, data: { detail: "Claim document storage is not configured" } }, "Unable to upload claim document. Please try again."],
    ["network error", "network-error" as const, "Cannot reach the claims API at http://localhost:8000. Make sure the backend is running."],
  ])("shows a friendly message for a %s", async (_name, reply, message) => {
    mockApi((config) => (config.method === "post" ? reply : { status: 200, data: { claims: [], total: 0 } }));
    const { user, container } = renderApp("/upload");

    await fillClaimForm(user, container);
    await user.click(uploadButton());

    expect(await screen.findByText(message, { selector: '[role="alert"] p' })).toBeInTheDocument();
    expect(screen.queryByText(/Failed to upload claim document to S3|not configured/)).not.toBeInTheDocument();
  });

  it("only accepts PDF files in the file picker", async () => {
    const { container } = renderApp("/upload");
    await screen.findByLabelText("Patient ID");

    fireEvent.change(fileInput(container), { target: { files: [new File(["x"], "notes.txt", { type: "text/plain" })] } });
    expect(await screen.findByText("Only PDF files are accepted.")).toBeInTheDocument();
  });

  it("shows an error with retry when GET /claims fails", async () => {
    mockApi(() => "network-error");
    renderApp("/upload");

    expect(await screen.findByText("Unable to load claims from the API.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
