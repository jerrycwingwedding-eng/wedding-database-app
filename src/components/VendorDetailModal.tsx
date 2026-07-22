import React from 'react';
import { Vendor, VendorCategory, VendorStatus, WeddingSettings } from '../types';
import { calculateVendorTotalCost, formatCurrency, getCategoryStyle, getCategoryDisplayName, STATUS_NAMES_ZH } from '../utils/formatters';
import { 
  X, 
  Star, 
  Phone, 
  Globe, 
  Mail, 
  Check, 
  Edit3,
  Trash2
} from 'lucide-react';

interface VendorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor | null;
  settings: WeddingSettings;
  onToggleSelect: (id: string) => void;
  onDeleteVendor?: (id: string) => void;
  onEdit: (vendor: Vendor) => void;
}

export const VendorDetailModal: React.FC<VendorDetailModalProps> = ({
  isOpen,
  onClose,
  vendor,
  settings,
  onToggleSelect,
  onDeleteVendor,
  onEdit,
}) => {
  if (!isOpen || !vendor) return null;

  const totalCost = calculateVendorTotalCost(vendor, settings.estimatedGuests);
  const categoryStyle = getCategoryStyle(vendor.category, settings.customCategories);
  const categoryZh = getCategoryDisplayName(vendor.category, settings.customCategories);
  const statusZh = STATUS_NAMES_ZH[vendor.status as VendorStatus] || vendor.status;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8">
        
        {/* Header Image */}
        <div className="relative h-64 sm:h-72 w-full bg-slate-100 overflow-hidden">
          {vendor.image ? (
            <img
              src={vendor.image}
              alt={vendor.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
              尚無圖片
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 transition-colors z-20 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Info */}
          <div className="absolute bottom-4 left-5 right-5 text-white z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border mb-2 ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}>
                {categoryZh}
              </span>
              <h2 className="text-2xl font-extrabold text-white">
                {vendor.name}
              </h2>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-2xl font-black text-amber-300">
                {formatCurrency(totalCost, settings.currencySymbol)}
              </div>
              {vendor.pricingModel === 'per_guest' && (
                <div className="text-xs text-slate-300">
                  {formatCurrency(vendor.cost, settings.currencySymbol)} / 每位賓客
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          
          {/* Status & Rating Bar */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-amber-500 font-bold text-sm">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= vendor.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                  }`}
                />
              ))}
              <span className="text-slate-800 font-bold ml-1">{vendor.rating}.0</span>
            </div>

            <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-100 text-orange-800">
              {statusZh}
            </span>
          </div>

          {/* Service Details */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              服務細節說明與包含項目
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed bg-orange-50/30 p-4 rounded-2xl border border-orange-100">
              {vendor.serviceDetails || '未提供服務細節說明。'}
            </p>
          </div>

          {/* Contact Details */}
          {(vendor.contact?.phone || vendor.contact?.email || vendor.contact?.website || vendor.contact?.contactPerson) && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                對接聯絡資訊
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {vendor.contact.contactPerson && (
                  <div className="p-3 rounded-xl bg-slate-50">
                    <span className="text-slate-400 block text-[10px]">對接窗口</span>
                    <span className="font-semibold text-slate-800">{vendor.contact.contactPerson}</span>
                  </div>
                )}
                {vendor.contact.phone && (
                  <a
                    href={`tel:${vendor.contact.phone}`}
                    className="p-3 rounded-xl bg-slate-50 flex items-center gap-2 hover:bg-orange-50 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-orange-500" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">電話</span>
                      <span className="font-semibold text-slate-800">{vendor.contact.phone}</span>
                    </div>
                  </a>
                )}
                {vendor.contact.email && (
                  <a
                    href={`mailto:${vendor.contact.email}`}
                    className="p-3 rounded-xl bg-slate-50 flex items-center gap-2 hover:bg-orange-50 transition-colors"
                  >
                    <Mail className="w-4 h-4 text-orange-500" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">電子郵件</span>
                      <span className="font-semibold text-slate-800 truncate block max-w-[180px]">{vendor.contact.email}</span>
                    </div>
                  </a>
                )}
                {vendor.contact.website && (
                  <a
                    href={vendor.contact.website.startsWith('http') ? vendor.contact.website : `https://${vendor.contact.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-xl bg-slate-50 flex items-center gap-2 hover:bg-orange-50 transition-colors"
                  >
                    <Globe className="w-4 h-4 text-orange-500" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">官方網站 / IG</span>
                      <span className="font-semibold text-slate-800 truncate block max-w-[180px]">{vendor.contact.website}</span>
                    </div>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {vendor.notes && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                個人筆記 / 條款備註
              </h4>
              <p className="text-xs text-slate-600 italic bg-amber-50/50 p-3 rounded-xl border border-amber-200/60">
                &quot;{vendor.notes}&quot;
              </p>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onEdit(vendor);
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-orange-500" />
              編輯商戶
            </button>

            {onDeleteVendor && (
              <button
                onClick={() => {
                  onDeleteVendor(vendor.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors cursor-pointer"
                title="刪除此商戶"
              >
                <Trash2 className="w-4 h-4" />
                刪除商戶
              </button>
            )}
          </div>

          <button
            onClick={() => onToggleSelect(vendor.id)}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer ${
              vendor.isSelected
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            {vendor.isSelected ? '已加入試算' : '勾選加入總試算'}
          </button>
        </div>

      </div>
    </div>
  );
};
