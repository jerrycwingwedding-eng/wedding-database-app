import React, { useState } from 'react';
import { Vendor, WeddingSettings } from '../types';
import { calculateVendorTotalCost, formatCurrency } from '../utils/formatters';
import { 
  Calculator, 
  CheckSquare, 
  Square, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  Edit2
} from 'lucide-react';

interface BudgetSummaryCardProps {
  vendors: Vendor[];
  settings: WeddingSettings;
  onUpdateSettings: (newSettings: WeddingSettings) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onExportJSON: () => void;
  showOnlySelected: boolean;
  setShowOnlySelected: (val: boolean) => void;
}

export const BudgetSummaryCard: React.FC<BudgetSummaryCardProps> = ({
  vendors,
  settings,
  onUpdateSettings,
  onSelectAll,
  onDeselectAll,
  onExportJSON,
  showOnlySelected,
  setShowOnlySelected,
}) => {
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(settings.totalBudget.toString());

  const selectedVendors = vendors.filter((v) => v.isSelected);
  const totalSelectedCost = selectedVendors.reduce(
    (sum, v) => sum + calculateVendorTotalCost(v, settings.estimatedGuests),
    0
  );

  const budgetUsedPercent = settings.totalBudget > 0 
    ? Math.min(Math.round((totalSelectedCost / settings.totalBudget) * 100), 100)
    : 0;

  const remainingBudget = settings.totalBudget - totalSelectedCost;
  const isOverBudget = remainingBudget < 0;

  const handleSaveBudget = () => {
    const val = parseFloat(tempBudget);
    if (!isNaN(val) && val >= 0) {
      onUpdateSettings({ ...settings, totalBudget: val });
    }
    setIsEditingBudget(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs mb-6 transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        {/* Left: Main Sum Display & Budget Goal */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">已選商戶開支總額</p>
                <div className="flex items-baseline gap-3">
                  <p className="text-2xl sm:text-3xl font-black text-orange-600 tracking-tight leading-none">
                    {formatCurrency(totalSelectedCost, settings.currencySymbol)}
                  </p>
                  <span className="text-xs font-medium text-slate-500">
                    （已選擇 {selectedVendors.length} / {vendors.length} 個商戶）
                  </span>
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div className="hidden sm:block">
              {isOverBudget ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  超出預算 {formatCurrency(Math.abs(remainingBudget), settings.currencySymbol)}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-bold border border-orange-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-600" />
                  剩餘預算 {formatCurrency(remainingBudget, settings.currencySymbol)}
                </div>
              )}
            </div>
          </div>

          {/* Budget Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-medium flex items-center gap-1">
                目標預算上限：
                {isEditingBudget ? (
                  <span className="inline-flex items-center gap-1">
                    <input
                      type="number"
                      value={tempBudget}
                      onChange={(e) => setTempBudget(e.target.value)}
                      className="w-24 px-2 py-0.5 text-xs rounded border border-orange-300 bg-white text-slate-900 font-bold"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveBudget}
                      className="px-2 py-0.5 text-[10px] bg-orange-500 text-white rounded font-bold cursor-pointer"
                    >
                      儲存
                    </button>
                  </span>
                ) : (
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    {formatCurrency(settings.totalBudget, settings.currencySymbol)}
                    <button
                      onClick={() => {
                        setTempBudget(settings.totalBudget.toString());
                        setIsEditingBudget(true);
                      }}
                      className="text-slate-400 hover:text-orange-600 ml-1 cursor-pointer"
                      title="修改目標預算"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </span>
              <span className="font-bold text-slate-700">
                已分配 {budgetUsedPercent}%
              </span>
            </div>

            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isOverBudget ? 'bg-rose-500' : 'bg-orange-500'
                }`}
                style={{
                  width: `${Math.min((totalSelectedCost / (settings.totalBudget || 1)) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Right: Quick Controls */}
        <div className="flex flex-wrap lg:flex-col justify-between items-stretch gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={onSelectAll}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5 text-orange-600" />
              全選項目
            </button>
            <button
              onClick={onDeselectAll}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 text-slate-400" />
              清除全選
            </button>
          </div>

          <div className="flex items-center justify-between gap-2">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showOnlySelected}
                onChange={(e) => setShowOnlySelected(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
              />
              僅顯示已勾選入圍 ({selectedVendors.length})
            </label>

            <button
              onClick={onExportJSON}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
              title="匯出JSON資料"
            >
              <Download className="w-3.5 h-3.5" />
              備份匯出
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
