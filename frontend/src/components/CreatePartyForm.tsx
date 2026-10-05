"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useCreateParty } from "@/hooks/useParty";

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Give your party a name")
    .max(100, "Name is too long"),
});

type FormValues = z.infer<typeof schema>;

export default function CreatePartyForm() {
  const router = useRouter();
  const createParty = useCreateParty();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  function onSubmit(values: FormValues) {
    createParty.mutate(values.name, {
      onSuccess: (party) => router.push(`/party/${party.join_code}`),
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <label htmlFor="name" className="text-sm font-medium">
        Party name
      </label>
      <input
        id="name"
        placeholder="Friday Dinner"
        className="rounded border border-stone-300 bg-white px-3 py-2"
        {...register("name")}
      />
      {errors.name && (
        <p className="text-sm text-red-700">{errors.name.message}</p>
      )}
      {createParty.isError && (
        <p className="text-sm text-red-700">{createParty.error.message}</p>
      )}
      <button
        type="submit"
        disabled={createParty.isPending}
        className="self-start rounded bg-stone-900 px-4 py-2 text-white hover:bg-stone-700 disabled:opacity-50"
      >
        {createParty.isPending ? "Creating..." : "Create party"}
      </button>
    </form>
  );
}
