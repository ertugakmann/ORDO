import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import PartyLeaderView from "@/components/PartyLeaderView";
import { menu, party } from "@/test/fixtures";
import { mockApi, renderWithQuery } from "@/test/utils";

const partyPath = "GET /api/v1/parties/join/ABX72K";

describe("PartyLeaderView", () => {
  it("shows an error for an unknown party", async () => {
    mockApi({
      "GET /api/v1/parties/join/NOPE": {
        status: 404,
        body: { detail: "Invalid join code" },
      },
    });
    renderWithQuery(<PartyLeaderView joinCode="NOPE" />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid join code",
    );
  });

  it("asks for a menu upload first, and cannot confirm an empty menu", async () => {
    mockApi({
      [partyPath]: { body: { ...party, menu_confirmed: false } },
      "GET /api/v1/parties/1/menu": { body: { categories: [] } },
    });
    renderWithQuery(<PartyLeaderView joinCode="ABX72K" />);

    expect(
      await screen.findByText(/Upload the restaurant menu/),
    ).toBeInTheDocument();
    expect(await screen.findByText(/No menu items found/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm menu" })).toBeDisabled();
  });

  it("confirms the menu and then shows the share link", async () => {
    let confirmed = false;
    mockApi({
      [partyPath]: () => ({ body: { ...party, menu_confirmed: confirmed } }),
      "GET /api/v1/parties/1/menu": { body: menu },
      "POST /api/v1/parties/1/menu/confirm": () => {
        confirmed = true;
        return { body: { ...party, menu_confirmed: true } };
      },
      "GET /api/v1/parties/1/dashboard": {
        body: {
          party_id: 1,
          party_name: "Friday Dinner",
          group_total: "0",
          participants: [],
        },
      },
      "GET /api/v1/parties/1/consolidated-order": {
        body: { items: [], total_quantity: 0, total: "0" },
      },
    });
    renderWithQuery(<PartyLeaderView joinCode="ABX72K" />);

    await userEvent.click(
      await screen.findByRole("button", { name: "Confirm menu" }),
    );

    expect(
      await screen.findByText(/Your menu is confirmed/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`${window.location.origin}/join/ABX72K`),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Orders" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Restaurant order" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Confirm menu" }),
    ).not.toBeInTheDocument();
  });

  it("shows the server message when confirming fails", async () => {
    mockApi({
      [partyPath]: { body: { ...party, menu_confirmed: false } },
      "GET /api/v1/parties/1/menu": { body: menu },
      "POST /api/v1/parties/1/menu/confirm": {
        status: 500,
        body: { detail: "Database error" },
      },
    });
    renderWithQuery(<PartyLeaderView joinCode="ABX72K" />);

    await userEvent.click(
      await screen.findByRole("button", { name: "Confirm menu" }),
    );
    const alerts = await screen.findAllByRole("alert");
    expect(alerts[0]).toHaveTextContent("Database error");
  });

  it("shows upload errors from the parser", async () => {
    mockApi({
      [partyPath]: { body: { ...party, menu_confirmed: false } },
      "GET /api/v1/parties/1/menu": { body: { categories: [] } },
      "POST /api/v1/parties/1/menu/upload": {
        status: 422,
        body: { detail: "Unable to parse this PDF." },
      },
    });
    renderWithQuery(<PartyLeaderView joinCode="ABX72K" />);

    const file = new File(["%PDF-1.4"], "menu.pdf", {
      type: "application/pdf",
    });
    await userEvent.upload(
      await screen.findByLabelText(/Upload the restaurant menu/),
      file,
    );
    await userEvent.click(screen.getByRole("button", { name: "Upload menu" }));

    const form = screen
      .getByLabelText(/Upload the restaurant menu/)
      .closest("form")!;
    expect(await within(form).findByRole("alert")).toHaveTextContent(
      "Unable to parse this PDF.",
    );
  });
});
