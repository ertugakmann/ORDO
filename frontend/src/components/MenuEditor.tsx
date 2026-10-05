"use client";

import { useState } from "react";

import MenuItemForm from "@/components/MenuItemForm";
import {
  useAddMenuItem,
  useDeleteMenuItem,
  useMenu,
  useUpdateMenuItem,
} from "@/hooks/useMenu";
import type { MenuItem } from "@/types/api";

export default function MenuEditor({ partyId }: { partyId: number }) {
  const { data: menu, isPending, isError, error } = useMenu(partyId);
  const [editingId, setEditingId] = useState<number | null>(null);
  const addItem = useAddMenuItem(partyId);
  const updateItem = useUpdateMenuItem(partyId);
  const deleteItem = useDeleteMenuItem(partyId);

  if (isPending) {
    return <p className="text-stone-500">Loading menu...</p>;
  }
  if (isError) {
    return <p className="text-red-700">{error.message}</p>;
  }

  const categories = menu.categories.map((category) => category.name);

  function renderItem(item: MenuItem) {
    if (editingId === item.id) {
      return (
        <li key={item.id}>
          <MenuItemForm
            initialValues={{
              name: item.name,
              description: item.description ?? "",
              price: item.price,
              category: item.category,
            }}
            categories={categories}
            submitLabel="Save"
            isSaving={updateItem.isPending}
            errorMessage={
              updateItem.isError ? updateItem.error.message : undefined
            }
            onSubmit={(values) =>
              updateItem.mutate(
                { id: item.id, item: values },
                { onSuccess: () => setEditingId(null) },
              )
            }
            onCancel={() => setEditingId(null)}
          />
        </li>
      );
    }

    return (
      <li key={item.id} className="flex items-start justify-between gap-4 py-2">
        <div>
          <p className="font-medium">{item.name}</p>
          {item.description && (
            <p className="text-sm text-stone-600">{item.description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3 text-sm">
          <span>£{item.price}</span>
          <button onClick={() => setEditingId(item.id)} className="underline">
            Edit
          </button>
          <button
            onClick={() => deleteItem.mutate(item.id)}
            disabled={deleteItem.isPending}
            className="text-red-700 underline"
          >
            Delete
          </button>
        </div>
      </li>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {menu.categories.length === 0 && (
        <p className="text-stone-500">No menu items found. Add one below.</p>
      )}
      {deleteItem.isError && (
        <p className="text-sm text-red-700">{deleteItem.error.message}</p>
      )}

      {menu.categories.map((category) => (
        <section key={category.name}>
          <h3 className="border-b border-stone-300 pb-1 text-lg font-semibold">
            {category.name}
          </h3>
          <ul className="divide-y divide-stone-200">
            {category.items.map(renderItem)}
          </ul>
        </section>
      ))}

      <section>
        <h3 className="pb-2 text-lg font-semibold">Add an item</h3>
        <MenuItemForm
          categories={categories}
          submitLabel="Add item"
          isSaving={addItem.isPending}
          errorMessage={addItem.isError ? addItem.error.message : undefined}
          onSubmit={(values) => addItem.mutate(values)}
        />
      </section>
    </div>
  );
}
