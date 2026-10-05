"use client";

import { useState } from "react";

export default function ShareLink({ joinCode }: { joinCode: string }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/join/${joinCode}`;

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
  }

  return (
    <div className="flex flex-col gap-2 rounded border border-green-300 bg-green-50 p-4">
      <p className="font-medium">
        Your menu is confirmed. Share this link with your group:
      </p>
      <div className="flex items-center gap-2">
        <code className="flex-1 break-all rounded bg-white px-2 py-1 text-sm">
          {link}
        </code>
        <button
          onClick={copy}
          className="rounded bg-stone-900 px-3 py-1 text-sm text-white hover:bg-stone-700"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
