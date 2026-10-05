import type { Menu, Party } from "@/types/api";

export const party: Party = {
  id: 1,
  name: "Friday Dinner",
  join_code: "ABX72K",
  menu_confirmed: true,
  created_at: "2026-10-05T10:00:00Z",
};

export const menu: Menu = {
  categories: [
    {
      name: "Starters",
      items: [
        {
          id: 1,
          party_id: 1,
          name: "Hummus",
          description: "Chickpea, tahini, lemon",
          price: "6.50",
          category: "Starters",
        },
      ],
    },
    {
      name: "Main Courses",
      items: [
        {
          id: 2,
          party_id: 1,
          name: "Adana Kebab",
          description: null,
          price: "15.00",
          category: "Main Courses",
        },
      ],
    },
  ],
};
