import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import ConsolidatedOrder from "@/components/ConsolidatedOrder";
import LeaderDashboard from "@/components/LeaderDashboard";
import { mockApi, renderWithQuery } from "@/test/utils";

const dashboard = {
  party_id: 1,
  party_name: "Friday Dinner",
  group_total: "46.50",
  participants: [
    {
      id: 1,
      name: "Ahmet",
      status: "submitted",
      total: "36.50",
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
    },
    {
      id: 2,
      name: "Mehmet",
      status: "submitted",
      total: "10.00",
      items: [
        {
          menu_item_id: 3,
          name: "Coke",
          quantity: 4,
          price_snapshot: "2.50",
          line_total: "10.00",
        },
      ],
    },
    { id: 3, name: "Ertug", status: "not_submitted", total: "0", items: [] },
  ],
};

describe("LeaderDashboard", () => {
  it("shows status, items, individual totals and the group total", async () => {
    mockApi({ "GET /api/v1/parties/1/dashboard": { body: dashboard } });
    renderWithQuery(<LeaderDashboard partyId={1} />);

    expect(await screen.findByText("2 of 3 submitted")).toBeInTheDocument();
    expect(screen.getByText("£36.50")).toBeInTheDocument();
    expect(screen.getByText("2 × Adana Kebab")).toBeInTheDocument();
    expect(screen.getByText("Not submitted")).toBeInTheDocument();
    expect(screen.getByText("Group total: £46.50")).toBeInTheDocument();
  });

  it("shows an empty state when nobody has joined", async () => {
    mockApi({
      "GET /api/v1/parties/1/dashboard": {
        body: { ...dashboard, participants: [], group_total: "0" },
      },
    });
    renderWithQuery(<LeaderDashboard partyId={1} />);

    expect(
      await screen.findByText(/No one has joined yet/),
    ).toBeInTheDocument();
    expect(screen.getByText("Group total: £0.00")).toBeInTheDocument();
  });

  it("shows an error state", async () => {
    mockApi({
      "GET /api/v1/parties/1/dashboard": {
        status: 404,
        body: { detail: "Party not found" },
      },
    });
    renderWithQuery(<LeaderDashboard partyId={1} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Party not found",
    );
  });
});

describe("ConsolidatedOrder", () => {
  it("lists the combined items and copies them as text", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    mockApi({
      "GET /api/v1/parties/1/consolidated-order": {
        body: {
          total_quantity: 10,
          total: "91.50",
          items: [
            {
              menu_item_id: 1,
              name: "Hummus",
              category: "Starters",
              quantity: 1,
              total: "6.50",
            },
            {
              menu_item_id: 2,
              name: "Adana Kebab",
              category: "Main Courses",
              quantity: 5,
              total: "75.00",
            },
          ],
        },
      },
    });
    renderWithQuery(<ConsolidatedOrder partyId={1} />);

    expect(await screen.findByText("× 5")).toBeInTheDocument();
    expect(screen.getByText("10 items · £91.50")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Copy order" }));
    expect(writeText).toHaveBeenCalledWith("Hummus × 1\nAdana Kebab × 5");
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
  });

  it("shows an empty state before any order is submitted", async () => {
    mockApi({
      "GET /api/v1/parties/1/consolidated-order": {
        body: { items: [], total_quantity: 0, total: "0" },
      },
    });
    renderWithQuery(<ConsolidatedOrder partyId={1} />);

    expect(await screen.findByText(/No orders yet/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Copy order" }),
    ).not.toBeInTheDocument();
  });
});
