export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price?: number;
  store?: string;
  location?: string;
  image?: string;
  category: string;
  checked: boolean;
  notes?: string;
  createdAt: number;
}

export interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingItem[];
  createdAt: number;
  updatedAt: number;
  shared?: boolean;
}

export type Category = 
  | 'produce'
  | 'dairy'
  | 'meat'
  | 'bakery'
  | 'beverages'
  | 'pantry'
  | 'frozen'
  | 'household'
  | 'personal'
  | 'other';

export const CATEGORY_LABELS: Record<Category, string> = {
  produce: 'Produce',
  dairy: 'Dairy & Eggs',
  meat: 'Meat & Seafood',
  bakery: 'Bakery',
  beverages: 'Beverages',
  pantry: 'Pantry',
  frozen: 'Frozen',
  household: 'Household',
  personal: 'Personal Care',
  other: 'Other',
};

export const DEFAULT_IMAGES: Record<Category, string> = {
  produce: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&h=400&fit=crop',
  dairy: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400&h=400&fit=crop',
  meat: 'https://images.unsplash.com/photo-1607623814075-e51df1bd6565?w=400&h=400&fit=crop',
  bakery: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop',
  beverages: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&h=400&fit=crop',
  pantry: 'https://images.unsplash.com/photo-1584473457406-6240486418e9?w=400&h=400&fit=crop',
  frozen: 'https://images.unsplash.com/photo-1570915226741-cc7d678ad7ce?w=400&h=400&fit=crop',
  household: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400&h=400&fit=crop',
  personal: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop',
  other: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=400&fit=crop',
};
