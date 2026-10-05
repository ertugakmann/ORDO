"use client";

import { usePartyByJoinCode } from "@/hooks/useParty";

export default function PartyLeaderView({ joinCode }: { joinCode: string }) {
  const { data: party, isPending, isError, error } = usePartyByJoinCode(joinCode);

  if (isPending) {
    return <p className="text-stone-500">Loading party...</p>;
  }

  if (isError) {
    return <p className="text-red-700">{error.message}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">{party.name}</h1>
      <p className="text-stone-600">Join code: {party.join_code}</p>
    </div>
  );
}
