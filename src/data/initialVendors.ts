import { Vendor, WeddingSettings } from '../types';

export const INITIAL_WEDDING_SETTINGS: WeddingSettings = {
  coupleNames: "Jerry & Cwing wedding",
  weddingDate: "2027-06-18",
  totalBudget: 35000,
  estimatedGuests: 120,
  currencySymbol: "$",
};

export const INITIAL_VENDORS: Vendor[] = [];

export const PRESET_SAMPLE_IMAGES = [
  { label: 'Luxury Venue', url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80' },
  { label: 'Outdoor Garden', url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80' },
  { label: 'Wedding Photography', url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=80' },
  { label: 'Gourmet Catering', url: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80' },
  { label: 'Floral Arrangements', url: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80' },
  { label: 'Wedding Cake', url: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=800&q=80' },
  { label: 'DJ & Music Stage', url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80' },
  { label: 'Bridal Gown', url: 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=800&q=80' },
  { label: 'Wedding Rings & Details', url: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=800&q=80' },
  { label: 'Cocktail Bar', url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80' },
];
