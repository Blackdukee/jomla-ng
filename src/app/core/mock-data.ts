// Mock data for the Jomla Angular app

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: 'buyer' | 'supplier';
  avatar_url?: string;
}

export interface Category {
  id: number;
  name: string;
  children?: Category[];
}

export interface Offer {
  id: number;
  title: string;
  description: string;
  category_id: number;
  category_name: string;
  supplier_id: number;
  supplier_name: string;
  unit_price: number;
  discount_percent: number;
  discounted_price: number;
  hub_target_quantity: number;
  total_quantity_available: number;
  committed_units: number;
  buyer_count: number;
  current_batch_id: number;
  image_url?: string;
  status: 'open' | 'completed' | 'failed';
  expires_at: string;
}

export interface GroupRequest {
  id: number;
  description: string;
  category_id?: number;
  category_name?: string;
  quantity: number;
  buyer_count: number;
  status: 'active' | 'inactive' | 'closed';
  created_at: string;
  creator_name: string;
  participants: Participant[];
  current_user_joined: boolean;
}

export interface Participant {
  id: number;
  first_name: string;
  quantity: number;
  is_current_user: boolean;
}

export interface Batch {
  id: number;
  offer_id: number;
  offer_title: string;
  batch_number: number;
  target_quantity: number;
  filled_quantity: number;
  status: 'open' | 'completed' | 'failed';
  discount_percent: number;
  unit_price: number;
  discounted_price: number;
  supplier_name: string;
  category_name: string;
  expires_at: string;
  participants: Participant[];
  current_user_participant: boolean;
  next_batch_id?: number;
}

export interface OfferResponse {
  id: number;
  request_id: number;
  supplier_id: number;
  supplier_name: string;
  unit_price: number;
  current_unit_price: number;
  min_unit_price: number;
  quantity_available: number;
  accepted_count: number;
  expires_at: string;
  status: 'active' | 'deal_reached' | 'expired';
  current_user_accepted: boolean;
}

export interface BuyerHub {
  id: number;
  type: 'supplier_offer' | 'group_request';
  title: string;
  status: string;
  committed_units: number;
  batch_id?: number;
  request_id?: number;
  fill_progress?: number;
  fill_target?: number;
}

export interface DealSummary {
  id: number;
  offer_title: string;
  batch_number: number;
  buyer_count: number;
  total_units: number;
  total_value: number;
  completed_at: string;
  buyers?: { name: string; quantity: number }[];
}

export interface SupplierAlert {
  id: number;
  request_id: number;
  item_title: string;
  category_name: string;
  units_demanded: number;
  notified_at: string;
  status: 'pending' | 'responded' | 'ignored';
}

export const MOCK_CATEGORIES: Category[] = [
  { id: 1, name: 'Electronics', children: [
    { id: 11, name: 'Audio' },
    { id: 12, name: 'Computers' },
    { id: 13, name: 'Mobile Phones' },
  ]},
  { id: 2, name: 'Industrial', children: [
    { id: 21, name: 'Machinery' },
    { id: 22, name: 'Tools' },
  ]},
  { id: 3, name: 'Solar & Energy', children: [
    { id: 31, name: 'Solar Panels' },
    { id: 32, name: 'Batteries' },
  ]},
  { id: 4, name: 'Textiles & Apparel' },
  { id: 5, name: 'Food & Beverage' },
  { id: 6, name: 'Construction Materials' },
];

export const MOCK_OFFERS: Offer[] = [
  {
    id: 1,
    title: 'Premium Wireless Headphones',
    description: 'High-quality Bluetooth headphones with noise cancellation. Perfect for office use.',
    category_id: 11,
    category_name: 'Audio',
    supplier_id: 1,
    supplier_name: 'TechHub Egypt',
    unit_price: 129,
    discount_percent: 35,
    discounted_price: 83.85,
    hub_target_quantity: 50,
    total_quantity_available: 200,
    committed_units: 38,
    buyer_count: 31,
    current_batch_id: 101,
    image_url: undefined,
    status: 'open',
    expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    title: 'Industrial Solar Panels 200W',
    description: 'Monocrystalline solar panels, 200W output. High efficiency, weatherproof.',
    category_id: 31,
    category_name: 'Solar Panels',
    supplier_id: 2,
    supplier_name: 'GreenPower Egypt',
    unit_price: 850,
    discount_percent: 20,
    discounted_price: 680,
    hub_target_quantity: 100,
    total_quantity_available: 500,
    committed_units: 67,
    buyer_count: 42,
    current_batch_id: 102,
    status: 'open',
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    title: 'Commercial Refrigeration Units',
    description: 'Walk-in coolers for restaurants and grocery stores. Energy-efficient compressors.',
    category_id: 21,
    category_name: 'Machinery',
    supplier_id: 3,
    supplier_name: 'ColdChain Pro',
    unit_price: 4500,
    discount_percent: 15,
    discounted_price: 3825,
    hub_target_quantity: 10,
    total_quantity_available: 50,
    committed_units: 7,
    buyer_count: 7,
    current_batch_id: 103,
    status: 'open',
    expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    title: 'Cotton T-Shirts (Bulk Pack)',
    description: 'Premium 180gsm cotton t-shirts. Sizes S-XXL. Perfect for corporate orders.',
    category_id: 4,
    category_name: 'Textiles & Apparel',
    supplier_id: 4,
    supplier_name: 'NileCotton Factory',
    unit_price: 45,
    discount_percent: 40,
    discounted_price: 27,
    hub_target_quantity: 200,
    total_quantity_available: 1000,
    committed_units: 156,
    buyer_count: 23,
    current_batch_id: 104,
    status: 'open',
    expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 5,
    title: 'Commercial Coffee Machines',
    description: 'Professional espresso machines for cafes and offices. 15-bar pump, 2L tank.',
    category_id: 5,
    category_name: 'Food & Beverage',
    supplier_id: 5,
    supplier_name: 'BaristaPro Egypt',
    unit_price: 2200,
    discount_percent: 25,
    discounted_price: 1650,
    hub_target_quantity: 20,
    total_quantity_available: 80,
    committed_units: 12,
    buyer_count: 12,
    current_batch_id: 105,
    status: 'open',
    expires_at: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 6,
    title: 'Laptop Computers — Business Series',
    description: 'Intel Core i5, 8GB RAM, 512GB SSD. Windows 11 Pro. Perfect for office deployments.',
    category_id: 12,
    category_name: 'Computers',
    supplier_id: 1,
    supplier_name: 'TechHub Egypt',
    unit_price: 5500,
    discount_percent: 12,
    discounted_price: 4840,
    hub_target_quantity: 30,
    total_quantity_available: 150,
    committed_units: 18,
    buyer_count: 15,
    current_batch_id: 106,
    status: 'open',
    expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const MOCK_REQUESTS: GroupRequest[] = [
  {
    id: 201,
    description: '500 units of 200W Solar Panels',
    category_id: 31,
    category_name: 'Solar Panels',
    quantity: 500,
    buyer_count: 8,
    status: 'active',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    creator_name: 'Ahmed',
    participants: [
      { id: 1, first_name: 'Ahmed', quantity: 100, is_current_user: true },
      { id: 2, first_name: 'Mohamed', quantity: 80, is_current_user: false },
      { id: 3, first_name: 'Sara', quantity: 60, is_current_user: false },
    ],
    current_user_joined: true,
  },
  {
    id: 202,
    description: 'Industrial power generators 20KVA',
    category_id: 21,
    category_name: 'Machinery',
    quantity: 15,
    buyer_count: 4,
    status: 'active',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    creator_name: 'Khaled',
    participants: [
      { id: 4, first_name: 'Khaled', quantity: 5, is_current_user: false },
      { id: 5, first_name: 'Omar', quantity: 3, is_current_user: false },
    ],
    current_user_joined: false,
  },
  {
    id: 203,
    description: 'Bulk coffee beans — Arabica 1 ton',
    category_id: 5,
    category_name: 'Food & Beverage',
    quantity: 1000,
    buyer_count: 12,
    status: 'active',
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    creator_name: 'Nora',
    participants: [
      { id: 6, first_name: 'Nora', quantity: 200, is_current_user: false },
    ],
    current_user_joined: false,
  },
];

export const MOCK_BATCH: Batch = {
  id: 101,
  offer_id: 1,
  offer_title: 'Premium Wireless Headphones',
  batch_number: 1,
  target_quantity: 50,
  filled_quantity: 38,
  status: 'open',
  discount_percent: 35,
  unit_price: 129,
  discounted_price: 83.85,
  supplier_name: 'TechHub Egypt',
  category_name: 'Audio',
  expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  participants: [
    { id: 1, first_name: 'You', quantity: 5, is_current_user: true },
    { id: 2, first_name: 'Mohamed', quantity: 10, is_current_user: false },
    { id: 3, first_name: 'Sara', quantity: 8, is_current_user: false },
    { id: 4, first_name: 'Khaled', quantity: 7, is_current_user: false },
    { id: 5, first_name: 'Omar', quantity: 4, is_current_user: false },
    { id: 6, first_name: 'Nora', quantity: 4, is_current_user: false },
  ],
  current_user_participant: true,
};

export const MOCK_OFFER_RESPONSES: OfferResponse[] = [
  {
    id: 301,
    request_id: 201,
    supplier_id: 2,
    supplier_name: 'GreenPower Egypt',
    unit_price: 820,
    current_unit_price: 780,
    min_unit_price: 720,
    quantity_available: 500,
    accepted_count: 5,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    current_user_accepted: true,
  },
  {
    id: 302,
    request_id: 201,
    supplier_id: 3,
    supplier_name: 'SolarMax Corp',
    unit_price: 850,
    current_unit_price: 810,
    min_unit_price: 750,
    quantity_available: 500,
    accepted_count: 2,
    expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    current_user_accepted: false,
  },
];

export const MOCK_BUYER_HUBS: { active: BuyerHub[]; fulfilled: BuyerHub[] } = {
  active: [
    {
      id: 1,
      type: 'supplier_offer',
      title: 'Premium Wireless Headphones',
      status: 'open',
      committed_units: 5,
      batch_id: 101,
      fill_progress: 38,
      fill_target: 50,
    },
    {
      id: 2,
      type: 'group_request',
      title: '500 units of 200W Solar Panels',
      status: 'active',
      committed_units: 100,
      request_id: 201,
    },
  ],
  fulfilled: [
    {
      id: 3,
      type: 'supplier_offer',
      title: 'Cotton T-Shirts (Bulk Pack) — Batch #1',
      status: 'completed',
      committed_units: 20,
      batch_id: 104,
      fill_progress: 200,
      fill_target: 200,
    },
  ],
};

export const MOCK_SUPPLIER_OFFERS: Offer[] = [
  { ...MOCK_OFFERS[0], supplier_id: 99, supplier_name: 'My Company' },
  { ...MOCK_OFFERS[1], supplier_id: 99, supplier_name: 'My Company', status: 'open' },
];

export const MOCK_DEALS: DealSummary[] = [
  {
    id: 1,
    offer_title: 'Cotton T-Shirts (Bulk Pack)',
    batch_number: 1,
    buyer_count: 23,
    total_units: 200,
    total_value: 5400,
    completed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    buyers: [
      { name: 'Ahmed M.', quantity: 30 },
      { name: 'Sara K.', quantity: 20 },
      { name: 'Mohamed A.', quantity: 15 },
    ],
  },
  {
    id: 2,
    offer_title: 'Commercial Coffee Machines',
    batch_number: 1,
    buyer_count: 8,
    total_units: 16,
    total_value: 26400,
    completed_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    buyers: [
      { name: 'Green Cafe', quantity: 4 },
      { name: 'City Bistro', quantity: 2 },
    ],
  },
];

export const MOCK_ALERTS: SupplierAlert[] = [
  {
    id: 1,
    request_id: 201,
    item_title: '200W Solar Panels',
    category_name: 'Solar Panels',
    units_demanded: 500,
    notified_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    status: 'pending',
  },
  {
    id: 2,
    request_id: 203,
    item_title: 'Arabica Coffee Beans',
    category_name: 'Food & Beverage',
    units_demanded: 1000,
    notified_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    status: 'responded',
  },
];

export const MOCK_WISHLIST: GroupRequest[] = [
  MOCK_REQUESTS[0],
  {
    id: 204,
    description: 'Laptop Computers for office fleet — 50 units',
    category_id: 12,
    category_name: 'Computers',
    quantity: 50,
    buyer_count: 1,
    status: 'active',
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    creator_name: 'You',
    participants: [{ id: 1, first_name: 'You', quantity: 50, is_current_user: true }],
    current_user_joined: true,
  },
];
