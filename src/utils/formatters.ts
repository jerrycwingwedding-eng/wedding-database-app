import { Vendor, VendorCategory, VendorStatus, PricingModel, CustomCategory } from '../types';

export const DEFAULT_CATEGORIES_LIST: CustomCategory[] = [
  { id: 'Venue', nameZh: '婚宴場地', nameEn: 'Venue', accent: '#f97316', isSystem: true },
  { id: 'Catering', nameZh: '餐飲外燴', nameEn: 'Catering', accent: '#f59e0b', isSystem: true },
  { id: 'Photography', nameZh: '婚禮攝影', nameEn: 'Photography', accent: '#0ea5e9', isSystem: true },
  { id: 'Videography', nameZh: '婚禮錄影', nameEn: 'Videography', accent: '#a855f7', isSystem: true },
  { id: 'Floral & Decor', nameZh: '花藝佈置', nameEn: 'Floral & Decor', accent: '#10b981', isSystem: true },
  { id: 'Music & DJ', nameZh: '音樂 DJ', nameEn: 'Music & DJ', accent: '#6366f1', isSystem: true },
  { id: 'Attire & Beauty', nameZh: '婚紗新秘', nameEn: 'Attire & Beauty', accent: '#ec4899', isSystem: true },
  { id: 'Wedding Planner', nameZh: '婚禮策劃', nameEn: 'Wedding Planner', accent: '#14b8a6', isSystem: true },
  { id: 'Cake & Desserts', nameZh: '喜餅蛋糕', nameEn: 'Cake & Desserts', accent: '#f43f5e', isSystem: true },
  { id: 'Invitations & Stationery', nameZh: '喜帖婚卡', nameEn: 'Invitations & Stationery', accent: '#8b5cf6', isSystem: true },
  { id: 'Transportation', nameZh: '婚禮交通', nameEn: 'Transportation', accent: '#3b82f6', isSystem: true },
  { id: 'Officiant', nameZh: '證婚人', nameEn: 'Officiant', accent: '#78716c', isSystem: true },
  { id: 'Other', nameZh: '其他商戶', nameEn: 'Other', accent: '#64748b', isSystem: true },
];

export const VENDOR_CATEGORIES: VendorCategory[] = DEFAULT_CATEGORIES_LIST.map((c) => c.id);

export const CATEGORY_NAMES_ZH: Record<string, string> = {
  'Venue': '婚宴場地',
  'Catering': '餐飲外燴',
  'Photography': '婚禮攝影',
  'Videography': '婚禮錄影',
  'Floral & Decor': '花藝佈置',
  'Music & DJ': '音樂 DJ',
  'Attire & Beauty': '婚紗新秘',
  'Wedding Planner': '婚禮策劃',
  'Cake & Desserts': '喜餅蛋糕',
  'Invitations & Stationery': '喜帖婚卡',
  'Transportation': '婚禮交通',
  'Officiant': '證婚人',
  'Other': '其他商戶',
};

export const STATUS_NAMES_ZH: Record<VendorStatus, string> = {
  'considering': '考慮中',
  'contacted': '已聯絡',
  'shortlisted': '已入圍',
  'booked': '已預訂',
};

export const PRICING_MODEL_NAMES_ZH: Record<PricingModel, string> = {
  'fixed': '固定總價',
  'per_guest': '按賓客數 ($/人)',
  'hourly': '按時薪計算',
};

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  'Venue': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', accent: '#f97316' },
  'Catering': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', accent: '#f59e0b' },
  'Photography': { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200', accent: '#0ea5e9' },
  'Videography': { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200', accent: '#a855f7' },
  'Floral & Decor': { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', accent: '#10b981' },
  'Music & DJ': { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200', accent: '#6366f1' },
  'Attire & Beauty': { bg: 'bg-pink-50', text: 'text-pink-800', border: 'border-pink-200', accent: '#ec4899' },
  'Wedding Planner': { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200', accent: '#14b8a6' },
  'Cake & Desserts': { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200', accent: '#f43f5e' },
  'Invitations & Stationery': { bg: 'bg-violet-50', text: 'text-violet-800', border: 'border-violet-200', accent: '#8b5cf6' },
  'Transportation': { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', accent: '#3b82f6' },
  'Officiant': { bg: 'bg-stone-100', text: 'text-stone-800', border: 'border-stone-300', accent: '#78716c' },
  'Other': { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300', accent: '#64748b' },
};

export function getCategoryDisplayName(catKey: string, customCategories?: CustomCategory[]): string {
  if (customCategories && customCategories.length > 0) {
    const match = customCategories.find((c) => c.id === catKey || c.nameZh === catKey);
    if (match) return match.nameZh;
  }
  return CATEGORY_NAMES_ZH[catKey] || catKey;
}

export function getCategoryStyle(catKey: string, customCategories?: CustomCategory[]): { bg: string; text: string; border: string; accent: string } {
  if (CATEGORY_COLORS[catKey]) {
    return CATEGORY_COLORS[catKey];
  }
  if (customCategories && customCategories.length > 0) {
    const match = customCategories.find((c) => c.id === catKey || c.nameZh === catKey);
    if (match && match.accent) {
      return {
        bg: 'bg-orange-50',
        text: 'text-orange-800',
        border: 'border-orange-200',
        accent: match.accent,
      };
    }
  }
  return {
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    border: 'border-slate-300',
    accent: '#64748b',
  };
}

export function calculateVendorTotalCost(vendor: Vendor, guestCount: number = 100): number {
  if (vendor.pricingModel === 'per_guest') {
    const guests = vendor.guestCountMultiplier || guestCount;
    return Math.round(vendor.cost * guests);
  }
  return vendor.cost;
}

export function formatCurrency(amount: number, symbol: string = '$'): string {
  return `${symbol}${amount.toLocaleString('zh-HK', {
    maximumFractionDigits: 0,
  })}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日`;
}
