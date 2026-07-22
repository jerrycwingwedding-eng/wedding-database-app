import React from 'react';
import { Vendor, VendorCategory, VendorStatus, WeddingSettings } from '../types';
import { calculateVendorTotalCost, getCategoryDisplayName, STATUS_NAMES_ZH, formatCurrency } from '../utils/formatters';
import { X, Star, Scale, Check, Image as ImageIcon } from 'lucide-react';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  comparedVendors: Vendor[];
  settings: WeddingSettings;
  onToggleSelect: (id: string) => void;
  onRemoveFromCompare: (id: string) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  comparedVendors,
  settings,
  onToggleSelect,
  onRemoveFromCompare,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-orange-50/50">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-100 text-orange-700">
              <Scale className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                商戶並排對比分析
              </h3>
              <p className="text-xs text-slate-500">
                橫向對比價格、服務內容與規格，協助您挑選最理想的婚禮商戶。
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Grid Table */}
        <div className="p-5 sm:p-6 overflow-x-auto">
          {comparedVendors.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-3">
              <Scale className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-medium">尚未加入任何商戶進行對比。</p>
              <p className="text-xs text-slate-400">
                請在商戶卡片上勾選「加入對比」，即可在此進行橫向比較。
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {comparedVendors.map((vendor) => {
                const totalCost = calculateVendorTotalCost(vendor, settings.estimatedGuests);
                const categoryZh = getCategoryDisplayName(vendor.category, settings.customCategories);
                const statusZh = STATUS_NAMES_ZH[vendor.status as VendorStatus] || vendor.status;

                return (
                  <div
                    key={vendor.id}
                    className="flex flex-col justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4"
                  >
                    <div>
                      {/* Image */}
                      <div className="relative h-36 rounded-xl overflow-hidden bg-slate-200 mb-3">
                        {vendor.image ? (
                          <img
                            src={vendor.image}
                            alt={vendor.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                        )}
                        <button
                          onClick={() => onRemoveFromCompare(vendor.id)}
                          className="absolute top-2 right-2 p-1 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                          title="移除對比"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Category & Name */}
                      <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
                        {categoryZh}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 line-clamp-1">
                        {vendor.name}
                      </h4>

                      {/* Price */}
                      <div className="mt-2 p-2.5 rounded-xl bg-white border border-slate-200">
                        <div className="text-xs text-slate-400">開支小計</div>
                        <div className="text-xl font-extrabold text-orange-600">
                          {formatCurrency(totalCost, settings.currencySymbol)}
                        </div>
                        {vendor.pricingModel === 'per_guest' && (
                          <div className="text-[10px] text-slate-500">
                            {formatCurrency(vendor.cost, settings.currencySymbol)} / 每位賓客
                          </div>
                        )}
                      </div>

                      {/* Rating & Status */}
                      <div className="flex items-center justify-between text-xs mt-3">
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{vendor.rating}.0</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                          {statusZh}
                        </span>
                      </div>

                      {/* Included Services */}
                      <div className="mt-3">
                        <span className="text-[11px] font-bold text-slate-700 block mb-1">
                          包含服務內容：
                        </span>
                        <p className="text-xs text-slate-600 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-200 max-h-32 overflow-y-auto">
                          {vendor.serviceDetails || '未提供詳細說明'}
                        </p>
                      </div>

                      {/* Contact Person */}
                      {vendor.contact?.contactPerson && (
                        <div className="mt-3 text-xs text-slate-500">
                          <strong>對接聯絡人：</strong> {vendor.contact.contactPerson}
                        </div>
                      )}
                    </div>

                    {/* Bottom Cart Action */}
                    <button
                      onClick={() => onToggleSelect(vendor.id)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        vendor.isSelected
                          ? 'bg-orange-500 text-white shadow-xs'
                          : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {vendor.isSelected ? (
                        <>
                          <Check className="w-4 h-4 stroke-[3]" />
                          已納入總試算
                        </>
                      ) : (
                        '勾選納入預算試算'
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
