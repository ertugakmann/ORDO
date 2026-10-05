"use client";

import { usePartyByJoinCode } from "@/hooks/useParty";

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
    return <p className="text-red-700">{error.message}</p>;
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

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-3xl font-semibold tracking-tight">{party.name}</h1>
      <p className="text-stone-600">You have been invited to order together.</p>
    </div>
  );
}
