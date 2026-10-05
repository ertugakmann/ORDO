"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { MenuItemInput } from "@/types/api";

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name is too long"),
  description: z.string().trim().max(500, "Description is too long"),
  price: z
    .string()
    .trim()
    .regex(/^\d{1,4}(\.\d{1,2})?$/, "Enter a price like 6.50"),
  category: z
    .string()
    .trim()
    .min(1, "Category is required")
    .max(50, "Category is too long"),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  initialValues?: FormValues;
  categories: string[];
  submitLabel: string;
  isSaving: boolean;
  errorMessage?: string;
  onSubmit: (item: MenuItemInput) => void;
  onCancel?: () => void;
};

const emptyValues: FormValues = {
  name: "",
  description: "",
  price: "",
  category: "",
};

export default function MenuItemForm({
  initialValues = emptyValues,
  categories,
  submitLabel,
  isSaving,
  errorMessage,
  onSubmit,
  onCancel,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues,
  });

  function submit(values: FormValues) {
    onSubmit({
      name: values.name,
      description: values.description || null,
      price: Number(values.price),
      category: values.category,
    });
  }

  const inputClass = "rounded border border-stone-300 bg-white px-2 py-1";

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="flex flex-col gap-2 rounded border border-stone-200 bg-white p-3"
    >
      <input
        placeholder="Name"
        aria-label="Name"
        className={inputClass}
        {...register("name")}
      />
      {errors.name && (
        <p role="alert" className="text-sm text-red-700">
          {errors.name.message}
        </p>
      )}

      <input
        placeholder="Description (optional)"
        aria-label="Description"
        className={inputClass}
        {...register("description")}
      />
      {errors.description && (
        <p role="alert" className="text-sm text-red-700">
          {errors.description.message}
        </p>
      )}

      <div className="flex gap-2">
        <input
          placeholder="Price"
          aria-label="Price"
          inputMode="decimal"
          className={`${inputClass} w-24`}
          {...register("price")}
        />
        <input
          placeholder="Category"
          aria-label="Category"
          list="category-options"
          className={`${inputClass} flex-1`}
          {...register("category")}
        />
        <datalist id="category-options">
          {categories.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
      </div>
      <p className="text-xs text-stone-500">
        To create a new category, type its name in the Category field.
      </p>
      {errors.price && (
        <p role="alert" className="text-sm text-red-700">
          {errors.price.message}
        </p>
      )}
      {errors.category && (
        <p role="alert" className="text-sm text-red-700">
          {errors.category.message}
        </p>
      )}

      {errorMessage && (
        <p role="alert" className="text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded bg-stone-900 px-3 py-1 text-white hover:bg-stone-700 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1 text-stone-600"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
