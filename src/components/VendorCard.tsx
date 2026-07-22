import React, { useState } from 'react';
import { Vendor, WeddingSettings } from '../types';
import { getCategoryStyle, getCategoryDisplayName, STATUS_NAMES_ZH, calculateVendorTotalCost, formatCurrency } from '../utils/formatters';
import { 
  Check, 
  Star, 
  Phone, 
  Globe, 
  Edit3, 
  Trash2, 
  Scale, 
  Eye, 
  Image as ImageIcon 
} from 'lucide-react';

interface VendorCardProps {
  vendor: Vendor;
  settings: WeddingSettings;
  isCompared: boolean;
  onToggleSelect: (id: string) => void;
  onToggleCompare: (id: string) => void;
  onEdit: (vendor: Vendor) => void;
  onDelete: (id: string) => void;
  onViewDetails: (vendor: Vendor) => void;
}

export const VendorCard: React.FC<VendorCardProps> = ({
  vendor,
  settings,
  isCompared,
  onToggleSelect,
  onToggleCompare,
  onEdit,
  onDelete,
  onViewDetails,
}) => {
  const [imageError, setImageError] = useState(false);

  const categoryStyle = getCategoryStyle(vendor.category, settings.customCategories);
  const categoryZhName = getCategoryDisplayName(vendor.category, settings.customCategories);
  const totalCost = calculateVendorTotalCost(vendor, settings.estimatedGuests);

  const getStatusBadge = () => {
    switch (vendor.status) {
      case 'booked':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">已預訂</span>;
      case 'shortlisted':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-300">已入圍</span>;
      case 'contacted':
        return <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-sky-300">已聯絡</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-slate-300">考慮中</span>;
    }
  };

  return (
    <div className={`group relative bg-white rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md ${
      vendor.isSelected
        ? 'border-orange-400 ring-2 ring-orange-500/20 bg-orange-50/10'
        : 'border-slate-200 hover:border-slate-300'
    }`}>
      
      {/* Card Header & Reference Image */}
      <div className="relative">
        <div className="h-44 sm:h-48 w-full bg-slate-100 overflow-hidden relative">
          {!imageError && vendor.image ? (
            <img
              src={vendor.image}
              alt={vendor.name}
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100">
              <ImageIcon className="w-10 h-10 mb-1 opacity-50 text-slate-400" />
              <span className="text-xs font-medium text-slate-400">尚無參考圖片</span>
            </div>
          )}

          {/* Dark Overlay gradient for contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-black/30 pointer-events-none" />

          {/* TOP LEFT: Checkbox Selection for Cart */}
          <div className="absolute top-3 left-3 z-10">
            <label
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer select-none backdrop-blur-md transition-all shadow-md ${
                vendor.isSelected
                  ? 'bg-orange-500 text-white border border-orange-400'
                  : 'bg-white/90 text-slate-800 border border-white/50 hover:bg-white'
              }`}
              title={vendor.isSelected ? "已加入入圍試算" : "點擊勾選加入預算總額試算"}
            >
              <input
                type="checkbox"
                checked={vendor.isSelected}
                onChange={() => onToggleSelect(vendor.id)}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                vendor.isSelected ? 'bg-white text-orange-600 border-white' : 'border-slate-400 bg-transparent'
              }`}>
                {vendor.isSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span>{vendor.isSelected ? '已選入圍' : '勾選試算'}</span>
            </label>
          </div>

          {/* TOP RIGHT: Status Tag */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
            {getStatusBadge()}
          </div>

          {/* BOTTOM OVERLAY: Price & Category */}
          <div className="absolute bottom-3 left-3 right-3 text-white flex items-end justify-between z-10">
            <div>
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}>
                {categoryZhName}
              </span>
              <h3 className="text-base font-bold line-clamp-1 text-white">
                {vendor.name}
              </h3>
            </div>
            <div className="text-right">
              <div className="text-lg font-black text-orange-300 drop-shadow-md">
                {formatCurrency(totalCost, settings.currencySymbol)}
              </div>
              {vendor.pricingModel === 'per_guest' && (
                <div className="text-[10px] text-slate-200 font-medium">
                  {formatCurrency(vendor.cost, settings.currencySymbol)}/人 ({vendor.guestCountMultiplier || settings.estimatedGuests} 位賓客)
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        
        {/* Rating & Contact Person */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1 text-amber-500 font-bold">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3.5 h-3.5 ${
                  star <= vendor.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                }`}
              />
            ))}
            <span className="ml-1 text-slate-700 font-semibold">{vendor.rating}.0</span>
          </div>

          {vendor.contact?.contactPerson && (
            <span className="truncate max-w-[140px] text-[11px] text-slate-600">
              聯絡人：{vendor.contact.contactPerson}
            </span>
          )}
        </div>

        {/* Service Details Excerpt */}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
          {vendor.serviceDetails || '尚無提供服務細節說明。'}
        </p>

        {/* Tags */}
        {vendor.tags && vendor.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {vendor.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Quick Contact Links */}
        <div className="flex items-center gap-3 pt-2 text-xs border-t border-slate-100 text-slate-500">
          {vendor.contact?.phone && (
            <a
              href={`tel:${vendor.contact.phone}`}
              className="flex items-center gap-1 hover:text-orange-600 transition-colors"
              title={vendor.contact.phone}
            >
              <Phone className="w-3 h-3" />
              <span className="truncate max-w-[90px]">{vendor.contact.phone}</span>
            </a>
          )}
          {vendor.contact?.website && (
            <a
              href={vendor.contact.website.startsWith('http') ? vendor.contact.website : `https://${vendor.contact.website}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-orange-600 transition-colors ml-auto"
            >
              <Globe className="w-3 h-3" />
              <span>官方網站</span>
            </a>
          )}
        </div>

      </div>

      {/* Card Footer Actions */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
        
        {/* Side-by-side Compare Toggle */}
        <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isCompared}
            onChange={() => onToggleCompare(vendor.id)}
            className="w-3.5 h-3.5 rounded text-orange-500 focus:ring-orange-500 border-slate-300"
          />
          <span className="text-[11px] font-semibold flex items-center gap-1">
            <Scale className="w-3 h-3 text-orange-500" />
            加入對比
          </span>
        </label>

        {/* Action Icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onViewDetails(vendor)}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="檢視完整詳細資料"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onEdit(vendor)}
            className="p-1.5 text-slate-500 hover:text-orange-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="編輯商戶"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(vendor.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
            title="刪除商戶"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
};
