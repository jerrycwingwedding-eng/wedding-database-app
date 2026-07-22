export interface CustomCategory {
  id: string;
  nameZh: string;
  nameEn?: string;
  accent?: string;
  isSystem?: boolean;
}

export type VendorCategory = string;

export type PricingModel = 'fixed' | 'per_guest' | 'hourly';

export type VendorStatus = 'considering' | 'contacted' | 'shortlisted' | 'booked';

export interface VendorContact {
  phone?: string;
  email?: string;
  website?: string;
  contactPerson?: string;
  address?: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: VendorCategory;
  cost: number;
  pricingModel: PricingModel;
  guestCountMultiplier?: number; // e.g. estimated guests if per_guest
  serviceDetails: string;
  image: string; // URL or Data URL
  contact: VendorContact;
  rating: number; // 1 to 5
  isSelected: boolean; // Shopping cart checkbox status
  status: VendorStatus;
  notes?: string;
  tags?: string[];
  createdAt: number;
}

export interface WeddingSettings {
  coupleNames: string;
  weddingDate: string;
  totalBudget: number;
  estimatedGuests: number;
  currencySymbol: string;
  customCategories?: CustomCategory[];
}

export type SortOption =
  | 'price-asc'
  | 'price-desc'
  | 'rating-desc'
  | 'name-asc'
  | 'category'
  | 'date-newest';

export type ViewMode = 'grid' | 'table';
