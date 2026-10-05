"use client";

import { useState } from "react";

import GuestOrder from "@/components/GuestOrder";
import JoinForm from "@/components/JoinForm";
import { usePartyByJoinCode } from "@/hooks/useParty";
import {
  clearGuest,
  loadGuest,
  saveGuest,
  type SavedGuest,
} from "@/lib/storage";
import type { Party } from "@/types/api";

// Rendered only after the party has loaded, so reading localStorage is safe.
function GuestSection({ party }: { party: Party }) {
  const [guest, setGuest] = useState<SavedGuest | null>(() =>
    loadGuest(party.id),
  );

  function handleJoined(newGuest: SavedGuest) {
    saveGuest(party.id, newGuest);
    setGuest(newGuest);
  }

  function handleReset() {
    clearGuest(party.id);
    setGuest(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{party.name}</h1>
        <p className="text-stone-600">
          You have been invited to order together.
        </p>
      </div>
      {guest ? (
        <>
          <GuestOrder partyId={party.id} guest={guest} />
          <button
            onClick={handleReset}
            className="self-start text-sm text-stone-600 underline"
          >
            Not {guest.name}? Join with a different name
          </button>
        </>
      ) : (
        <JoinForm partyId={party.id} onJoined={handleJoined} />
      )}
    </div>
  );
}

export default function JoinView({ joinCode }: { joinCode: string }) {
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

  if (!party.menu_confirmed) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{party.name}</h1>
        <p className="text-stone-600">
          The menu is not ready yet. Ask the party leader to confirm it, then
          refresh this page.
        </p>
      </div>
    );
  }

  return <GuestSection party={party} />;
}
