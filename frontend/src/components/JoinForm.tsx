"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useJoinParty } from "@/hooks/useParticipants";
import type { SavedGuest } from "@/lib/storage";

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Please enter your name")
    .max(50, "Name is too long"),
});

type FormValues = z.infer<typeof schema>;

export default function JoinForm({
  partyId,
  onJoined,
}: {
  partyId: number;
  onJoined: (guest: SavedGuest) => void;
}) {
  const joinParty = useJoinParty(partyId);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  function onSubmit(values: FormValues) {
    joinParty.mutate(values.name, {
      onSuccess: (participant) =>
        onJoined({ id: participant.id, name: participant.name }),
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <label htmlFor="guest-name" className="text-sm font-medium">
        Your name
      </label>
      <input
        id="guest-name"
        placeholder="Ahmet"
        className="rounded border border-stone-300 bg-white px-3 py-2"
        {...register("name")}
      />
      {errors.name && (
        <p className="text-sm text-red-700">{errors.name.message}</p>
      )}
      {joinParty.isError && (
        <p className="text-sm text-red-700">{joinParty.error.message}</p>
      )}
      <button
        type="submit"
        disabled={joinParty.isPending}
        className="self-start rounded bg-stone-900 px-4 py-2 text-white hover:bg-stone-700 disabled:opacity-50"
      >
        {joinParty.isPending ? "Joining..." : "Join party"}
      </button>
    </form>
  );
}
