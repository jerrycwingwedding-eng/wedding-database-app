import React from 'react';
import { Vendor, VendorCategory, VendorStatus, WeddingSettings } from '../types';
import { calculateVendorTotalCost, formatCurrency, getCategoryStyle, getCategoryDisplayName, STATUS_NAMES_ZH } from '../utils/formatters';
import { Star, Check, Edit3, Trash2, Eye, Image as ImageIcon } from 'lucide-react';

interface VendorListViewProps {
  vendors: Vendor[];
  settings: WeddingSettings;
  comparedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleCompare: (id: string) => void;
  onEdit: (vendor: Vendor) => void;
  onDelete: (id: string) => void;
  onViewDetails: (vendor: Vendor) => void;
}

export const VendorListView: React.FC<VendorListViewProps> = ({
  vendors,
  settings,
  comparedIds,
  onToggleSelect,
  onToggleCompare,
  onEdit,
  onDelete,
  onViewDetails,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <th className="py-3.5 px-4 w-12 text-center">試算</th>
              <th className="py-3.5 px-4">商戶名稱與類別</th>
              <th className="py-3.5 px-4">計算預算開支</th>
              <th className="py-3.5 px-4">服務細節說明</th>
              <th className="py-3.5 px-4">洽談狀態與評分</th>
              <th className="py-3.5 px-4 text-center">對比</th>
              <th className="py-3.5 px-4 text-right">操作管理</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {vendors.map((vendor) => {
              const totalCost = calculateVendorTotalCost(vendor, settings.estimatedGuests);
              const categoryStyle = getCategoryStyle(vendor.category, settings.customCategories);
              const categoryZh = getCategoryDisplayName(vendor.category, settings.customCategories);
              const statusZh = STATUS_NAMES_ZH[vendor.status as VendorStatus] || vendor.status;
              const isCompared = comparedIds.includes(vendor.id);

              return (
                <tr
                  key={vendor.id}
                  className={`hover:bg-orange-50/20 transition-colors ${
                    vendor.isSelected ? 'bg-orange-50/10' : ''
                  }`}
                >
                  {/* Select Checkbox */}
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => onToggleSelect(vendor.id)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors mx-auto cursor-pointer ${
                        vendor.isSelected
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'border-slate-300 bg-white'
                      }`}
                      title={vendor.isSelected ? "取消勾選" : "勾選納入預算總額"}
                    >
                      {vendor.isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  </td>

                  {/* Vendor Name & Image */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                        {vendor.image ? (
                          <img
                            src={vendor.image}
                            alt={vendor.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          {vendor.name}
                        </div>
                        <span className={`inline-block px-2 py-0.2 rounded text-[10px] font-bold border ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}>
                          {categoryZh}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Cost */}
                  <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                    {formatCurrency(totalCost, settings.currencySymbol)}
                    {vendor.pricingModel === 'per_guest' && (
                      <div className="text-[10px] text-slate-400 font-normal">
                        {formatCurrency(vendor.cost, settings.currencySymbol)}/人
                      </div>
                    )}
                  </td>

                  {/* Service Details */}
                  <td className="py-3 px-4 max-w-xs">
                    <p className="line-clamp-2 text-slate-600 text-xs">
                      {vendor.serviceDetails || '無內容'}
                    </p>
                  </td>

                  {/* Status & Rating */}
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <span className="font-bold text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {statusZh}
                      </span>
                      <div className="flex items-center gap-0.5 text-amber-500">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span className="text-[11px] font-bold text-slate-700">{vendor.rating}.0</span>
                      </div>
                    </div>
                  </td>

                  {/* Compare Toggle */}
                  <td className="py-3 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={isCompared}
                      onChange={() => onToggleCompare(vendor.id)}
                      className="w-4 h-4 rounded text-orange-500 border-slate-300 cursor-pointer"
                    />
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onViewDetails(vendor)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
                        title="查看詳情"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEdit(vendor)}
                        className="p-1.5 text-slate-500 hover:text-orange-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                        title="編輯"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(vendor.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                        title="刪除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
