import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import MenuEditor from "@/components/MenuEditor";
import { menu } from "@/test/fixtures";
import { mockApi, renderWithQuery } from "@/test/utils";

describe("MenuEditor", () => {
  it("lists the parsed menu by category", async () => {
    mockApi({ "GET /api/v1/parties/1/menu": { body: menu } });
    renderWithQuery(<MenuEditor partyId={1} />);

    expect(
      await screen.findByRole("heading", { name: "Starters" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Chickpea, tahini, lemon")).toBeInTheDocument();
    expect(screen.getByText("£15.00")).toBeInTheDocument();
  });

  it("shows an empty state", async () => {
    mockApi({ "GET /api/v1/parties/1/menu": { body: { categories: [] } } });
    renderWithQuery(<MenuEditor partyId={1} />);

    expect(await screen.findByText(/No menu items found/)).toBeInTheDocument();
  });

  it("shows an error state", async () => {
    mockApi({
      "GET /api/v1/parties/1/menu": {
        status: 404,
        body: { detail: "Party not found" },
      },
    });
    renderWithQuery(<MenuEditor partyId={1} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Party not found",
    );
  });

  it("deletes an item", async () => {
    const calls = mockApi({
      "GET /api/v1/parties/1/menu": { body: menu },
      "DELETE /api/v1/menu-items/1": { status: 204 },
    });
    renderWithQuery(<MenuEditor partyId={1} />);

    await userEvent.click(
      await screen.findByRole("button", { name: "Delete Hummus" }),
    );
    await waitFor(() =>
      expect(
        calls.some(
          (c) => c.method === "DELETE" && c.path === "/api/v1/menu-items/1",
        ),
      ).toBe(true),
    );
  });

  it("edits an item, including moving it to a new category", async () => {
    const calls = mockApi({
      "GET /api/v1/parties/1/menu": { body: menu },
      "PUT /api/v1/menu-items/1": { body: {} },
    });
    renderWithQuery(<MenuEditor partyId={1} />);

    await userEvent.click(
      await screen.findByRole("button", { name: "Edit Hummus" }),
    );
    const name = screen.getAllByLabelText("Name")[0];
    await userEvent.clear(name);
    await userEvent.type(name, "Humus");
    const category = screen.getAllByLabelText("Category")[0];
    await userEvent.clear(category);
    await userEvent.type(category, "Mezze");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(calls.some((c) => c.method === "PUT")).toBe(true),
    );
    expect(calls.find((c) => c.method === "PUT")?.body).toEqual({
      name: "Humus",
      description: "Chickpea, tahini, lemon",
      price: 6.5,
      category: "Mezze",
    });
  });

  it("adds a missing item and validates the price", async () => {
    const calls = mockApi({
      "GET /api/v1/parties/1/menu": { body: menu },
      "POST /api/v1/parties/1/menu-items": { status: 201, body: {} },
    });
    renderWithQuery(<MenuEditor partyId={1} />);

    await screen.findByRole("heading", { name: "Starters" });
    const form = () =>
      screen.getByRole("button", { name: "Add item" }).closest("form")!;
    const field = (label: string) =>
      Array.from(form().querySelectorAll("input")).find(
        (i) => i.getAttribute("aria-label") === label,
      )!;

    await userEvent.type(field("Name"), "Baklava");
    await userEvent.type(field("Price"), "abc");
    await userEvent.type(field("Category"), "Desserts");
    await userEvent.click(screen.getByRole("button", { name: "Add item" }));
    expect(
      await screen.findByText("Enter a price like 6.50"),
    ).toBeInTheDocument();
    expect(calls.filter((c) => c.method === "POST")).toHaveLength(0);

    await userEvent.clear(field("Price"));
    await userEvent.type(field("Price"), "4.5");
    await userEvent.click(screen.getByRole("button", { name: "Add item" }));

    await waitFor(() =>
      expect(calls.some((c) => c.method === "POST")).toBe(true),
    );
    expect(calls.find((c) => c.method === "POST")?.body).toEqual({
      name: "Baklava",
      description: null,
      price: 4.5,
      category: "Desserts",
    });
    // The form is emptied after a successful add.
    await waitFor(() => expect(field("Name")).toHaveValue(""));
  });
});
