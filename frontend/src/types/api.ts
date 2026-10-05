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

export type Participant = {
  id: number;
  party_id: number;
  name: string;
  created_at: string;
};

export type OrderLine = {
  menu_item_id: number;
  name: string;
  quantity: number;
  price_snapshot: string;
  line_total: string;
};

export type Order = {
  id: number;
  party_id: number;
  participant_id: number;
  status: "draft" | "submitted";
  created_at: string;
  items: OrderLine[];
  total: string;
};
