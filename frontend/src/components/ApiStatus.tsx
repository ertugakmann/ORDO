"use client";

import { useHealth } from "@/hooks/useHealth";

export default function ApiStatus() {
  const { isPending, isError, refetch } = useHealth();

  if (isPending) {
    return <p className="text-sm text-stone-500">Checking connection...</p>;
  }

  if (isError) {
    return (
      <div role="alert" className="text-sm text-red-700">
        <p>Unable to reach the ORDO server.</p>
        <button
          onClick={() => refetch()}
          className="mt-1 underline hover:text-red-900"
        >
          Try again
        </button>
      </div>
    );
  }

  return <p className="text-sm text-green-700">Server status: online</p>;
}
