"use client";

import ConsolidatedOrder from "@/components/ConsolidatedOrder";
import LeaderDashboard from "@/components/LeaderDashboard";
import MenuEditor from "@/components/MenuEditor";
import MenuUpload from "@/components/MenuUpload";
import ShareLink from "@/components/ShareLink";
import { useConfirmMenu, useMenu } from "@/hooks/useMenu";
import { usePartyByJoinCode } from "@/hooks/useParty";
import type { Party } from "@/types/api";

function MenuSection({ party }: { party: Party }) {
  const { data: menu } = useMenu(party.id);
  const confirmMenu = useConfirmMenu(party.id);
  const hasMenu = (menu?.categories.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-8">
      {party.menu_confirmed && <ShareLink joinCode={party.join_code} />}

      {!party.menu_confirmed && (
        <MenuUpload partyId={party.id} hasMenu={hasMenu} />
      )}

      {party.menu_confirmed && (
        <>
          <section>
            <h2 className="pb-3 text-xl font-semibold">Orders</h2>
            <LeaderDashboard partyId={party.id} />
          </section>
          <section>
            <h2 className="pb-3 text-xl font-semibold">Restaurant order</h2>
            <ConsolidatedOrder partyId={party.id} />
          </section>
        </>
      )}

      <div>
        <h2 className="pb-3 text-xl font-semibold">
          {party.menu_confirmed ? "Menu" : "Review your menu"}
        </h2>
        <p className="pb-4 text-sm text-stone-600">
          {party.menu_confirmed
            ? "You can still fix items here."
            : "Check the parsed menu and fix anything that is wrong, then confirm it."}
        </p>
        <MenuEditor partyId={party.id} />
      </div>

      {!party.menu_confirmed && (
        <div className="flex flex-col gap-2">
          {confirmMenu.isError && (
            <p role="alert" className="text-sm text-red-700">
              {confirmMenu.error.message}
            </p>
          )}
          <button
            onClick={() => confirmMenu.mutate()}
            disabled={!hasMenu || confirmMenu.isPending}
            className="self-start rounded bg-green-700 px-4 py-2 text-white hover:bg-green-800 disabled:opacity-50"
          >
            {confirmMenu.isPending ? "Confirming..." : "Confirm menu"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function PartyLeaderView({ joinCode }: { joinCode: string }) {
  const {
    data: party,
    isPending,
    isError,
    error,
  } = usePartyByJoinCode(joinCode);

  if (isPending) {
    return <p className="text-stone-500">Loading party...</p>;
  }

  if (isError) {
    return (
      <p role="alert" className="text-red-700">
        {error.message}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{party.name}</h1>
        <p className="text-stone-600">Join code: {party.join_code}</p>
      </div>
      <MenuSection party={party} />
    </div>
  );
}
