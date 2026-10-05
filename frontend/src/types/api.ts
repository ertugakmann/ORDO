export type Health = {
  status: string;
  service: string;
  database: string;
};

export type Party = {
  id: number;
  name: string;
  join_code: string;
  menu_confirmed: boolean;
  created_at: string;
};

export type MenuItem = {
  id: number;
  party_id: number;
  name: string;
  description: string | null;
  price: string;
  category: string;
};

export type Menu = {
  categories: { name: string; items: MenuItem[] }[];
};

export type MenuItemInput = {
  name: string;
  description: string | null;
  price: number;
  category: string;
};
