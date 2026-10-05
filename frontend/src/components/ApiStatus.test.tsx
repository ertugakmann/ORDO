import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ApiStatus from "@/components/ApiStatus";
import { mockApi, renderWithQuery } from "@/test/utils";

describe("ApiStatus", () => {
  it("shows a loading message, then the status", async () => {
    mockApi({ "GET /health": { body: { status: "ok" } } });
    renderWithQuery(<ApiStatus />);

    expect(screen.getByText("Checking connection...")).toBeInTheDocument();
    expect(
      await screen.findByText("Server status: online"),
    ).toBeInTheDocument();
  });

  it("shows an error when the server cannot be reached", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    renderWithQuery(<ApiStatus />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to reach the ORDO server.",
    );
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
  });
});
