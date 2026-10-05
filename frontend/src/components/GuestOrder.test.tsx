import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import GuestOrder from "@/components/GuestOrder";
import { menu } from "@/test/fixtures";
import { mockApi, renderWithQuery } from "@/test/utils";

const guest = { id: 7, name: "Ahmet" };
const submittedOrder = {
  id: 3,
  party_id: 1,
  participant_id: 7,
  status: "submitted",
  created_at: "",
  items: [
    {
      menu_item_id: 2,
      name: "Adana Kebab",
      quantity: 2,
      price_snapshot: "15.00",
      line_total: "30.00",
    },
    {
      menu_item_id: 1,
      name: "Hummus",
      quantity: 1,
      price_snapshot: "6.50",
      line_total: "6.50",
    },
  ],
  total: "36.50",
};

describe("GuestOrder", () => {
  it("shows the menu with prices and an empty basket", async () => {
    mockApi({ "GET /api/v1/parties/1/menu": { body: menu } });
    renderWithQuery(<GuestOrder partyId={1} guest={guest} />);

    expect(await screen.findByText("Starters")).toBeInTheDocument();
    expect(screen.getByText("Main Courses")).toBeInTheDocument();
    expect(screen.getByText("£6.50")).toBeInTheDocument();
    expect(screen.getByText("Your basket is empty.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit order" })).toBeDisabled();
  });

  it("shows an empty state when the menu has no items", async () => {
    mockApi({ "GET /api/v1/parties/1/menu": { body: { categories: [] } } });
    renderWithQuery(<GuestOrder partyId={1} guest={guest} />);

    expect(await screen.findByText("No menu items found.")).toBeInTheDocument();
  });

  it("changes quantities and keeps a running total", async () => {
    mockApi({ "GET /api/v1/parties/1/menu": { body: menu } });
    renderWithQuery(<GuestOrder partyId={1} guest={guest} />);

    await screen.findByText("Hummus");
    const addKebab = screen.getByRole("button", {
      name: "Add one Adana Kebab",
    });
    await userEvent.click(addKebab);
    await userEvent.click(addKebab);
    await userEvent.click(
      screen.getByRole("button", { name: "Add one Hummus" }),
    );

    expect(screen.getByText("Total: £36.50")).toBeInTheDocument();
    const basket = screen
      .getByRole("heading", { name: "Your basket" })
      .closest("section")!;
    expect(within(basket).getByText("2 × Adana Kebab")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Remove one Adana Kebab" }),
    );
    expect(screen.getByText("Total: £21.50")).toBeInTheDocument();

    // The minus button is disabled at zero, so it can never go negative.
    expect(
      screen.getByRole("button", { name: "Remove one Hummus" }),
    ).toBeEnabled();
    await userEvent.click(
      screen.getByRole("button", { name: "Remove one Hummus" }),
    );
    expect(
      screen.getByRole("button", { name: "Remove one Hummus" }),
    ).toBeDisabled();
  });

  it("submits the order and shows a confirmation", async () => {
    const calls = mockApi({
      "GET /api/v1/parties/1/menu": { body: menu },
      "POST /api/v1/parties/1/orders": {
        status: 201,
        body: { ...submittedOrder, status: "draft" },
      },
      "POST /api/v1/orders/3/submit": { body: submittedOrder },
      "GET /api/v1/orders/3": { body: submittedOrder },
    });
    renderWithQuery(<GuestOrder partyId={1} guest={guest} />);

    await screen.findByText("Hummus");
    await userEvent.click(
      screen.getByRole("button", { name: "Add one Hummus" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Submit order" }));

    expect(
      await screen.findByText("Order submitted successfully."),
    ).toBeInTheDocument();
    expect(
      calls.find((c) => c.path === "/api/v1/parties/1/orders")?.body,
    ).toEqual({
      participant_id: 7,
      items: [{ menu_item_id: 1, quantity: 1 }],
    });
    expect(window.localStorage.getItem("ordo-order-1")).toBe("3");
  });

  it("shows the server error and keeps the basket", async () => {
    mockApi({
      "GET /api/v1/parties/1/menu": { body: menu },
      "POST /api/v1/parties/1/orders": {
        status: 404,
        body: { detail: "Participant not found" },
      },
    });
    renderWithQuery(<GuestOrder partyId={1} guest={guest} />);

    await screen.findByText("Hummus");
    await userEvent.click(
      screen.getByRole("button", { name: "Add one Hummus" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Submit order" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Participant not found",
    );
    expect(screen.getByText("Total: £6.50")).toBeInTheDocument();
  });

  it("shows an already submitted order instead of the menu", async () => {
    window.localStorage.setItem("ordo-order-1", "3");
    mockApi({
      "GET /api/v1/parties/1/menu": { body: menu },
      "GET /api/v1/orders/3": { body: submittedOrder },
    });
    renderWithQuery(<GuestOrder partyId={1} guest={guest} />);

    expect(
      await screen.findByText("Order submitted successfully."),
    ).toBeInTheDocument();
    expect(screen.getByText("Total: £36.50")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Submit order" }),
    ).not.toBeInTheDocument();
  });
});
