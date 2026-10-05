import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CreatePartyForm from "@/components/CreatePartyForm";
import { party } from "@/test/fixtures";
import { mockApi, renderWithQuery } from "@/test/utils";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

describe("CreatePartyForm", () => {
  beforeEach(() => push.mockClear());

  it("asks for a name before submitting", async () => {
    const calls = mockApi({});
    renderWithQuery(<CreatePartyForm />);

    await userEvent.click(screen.getByRole("button", { name: "Create party" }));

    expect(
      await screen.findByText("Give your party a name"),
    ).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });

  it("creates the party and opens its page", async () => {
    const calls = mockApi({
      "POST /api/v1/parties": { status: 201, body: party },
    });
    renderWithQuery(<CreatePartyForm />);

    await userEvent.type(screen.getByLabelText("Party name"), "Friday Dinner");
    await userEvent.click(screen.getByRole("button", { name: "Create party" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/party/ABX72K"));
    expect(calls[0].body).toEqual({ name: "Friday Dinner" });
  });

  it("shows the server error", async () => {
    mockApi({
      "POST /api/v1/parties": {
        status: 500,
        body: { detail: "Database error" },
      },
    });
    renderWithQuery(<CreatePartyForm />);

    await userEvent.type(screen.getByLabelText("Party name"), "Lunch");
    await userEvent.click(screen.getByRole("button", { name: "Create party" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Database error",
    );
    expect(push).not.toHaveBeenCalled();
  });
});
