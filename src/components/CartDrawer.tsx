import React from 'react';
import { Vendor, WeddingSettings } from '../types';
import { calculateVendorTotalCost, formatCurrency, getCategoryStyle, getCategoryDisplayName } from '../utils/formatters';
import confetti from 'canvas-confetti';
import { 
  X, 
  ShoppingCart, 
  Trash2, 
  Printer, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Download 
} from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  vendors: Vendor[];
  settings: WeddingSettings;
  onToggleSelect: (id: string) => void;
  onDeleteVendor?: (id: string) => void;
  onExportJSON: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  vendors,
  settings,
  onToggleSelect,
  onDeleteVendor,
  onExportJSON,
}) => {
  if (!isOpen) return null;

  const selectedVendors = vendors.filter((v) => v.isSelected);
  const totalCost = selectedVendors.reduce(
    (sum, v) => sum + calculateVendorTotalCost(v, settings.estimatedGuests),
    0
  );

  const remainingBudget = settings.totalBudget - totalCost;
  const isOverBudget = remainingBudget < 0;

  const handleCelebrate = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between border-l border-rose-100 dark:border-slate-800">
          
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
                <ShoppingCart className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Shortlisted Vendors Cart
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedVendors.length} vendors selected
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body: Selected Vendor Items */}
          <div className="p-5 flex-1 overflow-y-auto space-y-3">
            {selectedVendors.length === 0 ? (
              <div className="text-center py-16 text-slate-400 space-y-3">
                <ShoppingCart className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 stroke-1" />
                <p className="text-sm font-semibold">Your wedding cart is empty.</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Check the box on any vendor card to add them to your instant cost calculation sum!
                </p>
              </div>
            ) : (
              selectedVendors.map((vendor) => {
                const itemCost = calculateVendorTotalCost(vendor, settings.estimatedGuests);
                const categoryStyle = getCategoryStyle(vendor.category, settings.customCategories);
                const categoryZh = getCategoryDisplayName(vendor.category, settings.customCategories);

                return (
                  <div
                    key={vendor.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3 group hover:border-rose-300 dark:hover:border-rose-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                        {vendor.image ? (
                          <img
                            src={vendor.image}
                            alt={vendor.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="truncate">
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold ${categoryStyle.bg} ${categoryStyle.text}`}>
                          {categoryZh}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate font-serif">
                          {vendor.name}
                        </h4>
                        <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                          {formatCurrency(itemCost, settings.currencySymbol)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => onToggleSelect(vendor.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="從試算小計移除"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {onDeleteVendor && (
                        <button
                          onClick={() => onDeleteVendor(vendor.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                          title="永久刪除此商戶"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer Total & Actions */}
          <div className="p-5 border-t border-rose-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 space-y-4">
            
            {/* Total Display */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Budget Goal:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {formatCurrency(settings.totalBudget, settings.currencySymbol)}
                </span>
              </div>

              <div className="flex items-center justify-between text-base font-extrabold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>Total Package Sum:</span>
                <span className="text-xl text-rose-600 dark:text-rose-400 font-serif">
                  {formatCurrency(totalCost, settings.currencySymbol)}
                </span>
              </div>

              {/* Status Note */}
              {isOverBudget ? (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold bg-rose-100/60 dark:bg-rose-950/60 p-2 rounded-xl">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Over target budget by {formatCurrency(Math.abs(remainingBudget), settings.currencySymbol)}</span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-100/60 dark:bg-emerald-950/60 p-2 rounded-xl">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                    Under budget by {formatCurrency(remainingBudget, settings.currencySymbol)}
                  </span>
                  <button
                    onClick={handleCelebrate}
                    className="p-1 hover:scale-110 transition-transform text-amber-500"
                    title="Celebrate budget!"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Quick Export/Print Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-600 text-xs font-bold shadow-2xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                Print Invoice
              </button>
              <button
                onClick={onExportJSON}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-lg shadow-orange-100 dark:shadow-none transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export Plan
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
