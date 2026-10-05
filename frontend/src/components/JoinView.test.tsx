import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import JoinView from "@/components/JoinView";
import { menu, party } from "@/test/fixtures";
import { mockApi, renderWithQuery } from "@/test/utils";

const partyPath = "GET /api/v1/parties/join/ABX72K";

describe("JoinView", () => {
  it("shows an error for an invalid join code", async () => {
    mockApi({
      "GET /api/v1/parties/join/NOPE": {
        status: 404,
        body: { detail: "Invalid join code" },
      },
    });
    renderWithQuery(<JoinView joinCode="NOPE" />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid join code",
    );
  });

  it("tells guests when the menu is not confirmed yet", async () => {
    mockApi({ [partyPath]: { body: { ...party, menu_confirmed: false } } });
    renderWithQuery(<JoinView joinCode="ABX72K" />);

    expect(
      await screen.findByText(/menu is not ready yet/i),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Your name")).not.toBeInTheDocument();
  });

  it("lets a guest join and then shows the menu", async () => {
    const calls = mockApi({
      [partyPath]: { body: party },
      "POST /api/v1/parties/1/participants": {
        status: 201,
        body: { id: 7, party_id: 1, name: "Ahmet", created_at: "" },
      },
      "GET /api/v1/parties/1/menu": { body: menu },
    });
    renderWithQuery(<JoinView joinCode="ABX72K" />);

    await userEvent.type(await screen.findByLabelText("Your name"), "Ahmet");
    await userEvent.click(screen.getByRole("button", { name: "Join party" }));

    expect(await screen.findByText("Hummus")).toBeInTheDocument();
    expect(calls.find((c) => c.method === "POST")?.body).toEqual({
      name: "Ahmet",
    });
    expect(JSON.parse(window.localStorage.getItem("ordo-guest-1")!)).toEqual({
      id: 7,
      name: "Ahmet",
    });
  });

  it("requires a name", async () => {
    mockApi({ [partyPath]: { body: party } });
    renderWithQuery(<JoinView joinCode="ABX72K" />);

    await userEvent.click(
      await screen.findByRole("button", { name: "Join party" }),
    );
    expect(
      await screen.findByText("Please enter your name"),
    ).toBeInTheDocument();
  });

  it("remembers a returning guest and lets them switch name", async () => {
    window.localStorage.setItem(
      "ordo-guest-1",
      JSON.stringify({ id: 7, name: "Ahmet" }),
    );
    mockApi({
      [partyPath]: { body: party },
      "GET /api/v1/parties/1/menu": { body: menu },
    });
    renderWithQuery(<JoinView joinCode="ABX72K" />);

    expect(await screen.findByText("Hummus")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Not Ahmet/ }));
    expect(screen.getByLabelText("Your name")).toBeInTheDocument();
    expect(window.localStorage.getItem("ordo-guest-1")).toBeNull();
  });
});
