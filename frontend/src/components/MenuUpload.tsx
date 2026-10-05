"use client";

import { useState } from "react";

import { useUploadMenu } from "@/hooks/useMenu";

export default function MenuUpload({
  partyId,
  hasMenu,
}: {
  partyId: number;
  hasMenu: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const upload = useUploadMenu(partyId);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (file) {
      upload.mutate(file, { onSuccess: () => setFile(null) });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label htmlFor="menu-file" className="text-sm font-medium">
        {hasMenu
          ? "Upload a different menu PDF"
          : "Upload the restaurant menu (PDF)"}
      </label>
      <input
        id="menu-file"
        type="file"
        accept="application/pdf,.pdf"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        className="text-sm"
      />
      {upload.isPending && (
        <p className="text-sm text-stone-500">Uploading and parsing menu...</p>
      )}
      {upload.isError && (
        <p className="text-sm text-red-700">{upload.error.message}</p>
      )}
      {hasMenu && (
        <p className="text-sm text-stone-500">
          This replaces the current menu, including any edits.
        </p>
      )}
      <button
        type="submit"
        disabled={!file || upload.isPending}
        className="self-start rounded bg-stone-900 px-4 py-2 text-white hover:bg-stone-700 disabled:opacity-50"
      >
        Upload menu
      </button>
    </form>
  );
}
