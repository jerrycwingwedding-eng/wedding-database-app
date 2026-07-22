import React from 'react';
import { Vendor, WeddingSettings } from '../types';
import { calculateVendorTotalCost, formatCurrency, getCategoryStyle, getCategoryDisplayName } from '../utils/formatters';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Printer, 
  Download, 
  Database, 
  AlertCircle, 
  CheckCircle2,
  X
} from 'lucide-react';
import { getSupabaseConfig } from '../lib/supabase';

interface RightCartPanelProps {
  vendors: Vendor[];
  settings: WeddingSettings;
  onToggleSelect: (id: string) => void;
  onDeleteVendor?: (id: string) => void;
  onOpenAddModal: () => void;
  onOpenSettingsModal: () => void;
  onExportJSON: () => void;
  onSyncSupabase?: () => void;
  isSupabaseSyncing?: boolean;
}

export const RightCartPanel: React.FC<RightCartPanelProps> = ({
  vendors,
  settings,
  onToggleSelect,
  onDeleteVendor,
  onOpenAddModal,
  onOpenSettingsModal,
  onExportJSON,
  onSyncSupabase,
  isSupabaseSyncing = false,
}) => {
  const selectedVendors = vendors.filter((v) => v.isSelected);
  const totalCost = selectedVendors.reduce(
    (sum, v) => sum + calculateVendorTotalCost(v, settings.estimatedGuests),
    0
  );

  const remainingBudget = settings.totalBudget - totalCost;
  const isOverBudget = remainingBudget < 0;
  const budgetUsedPercent = settings.totalBudget > 0 
    ? Math.min(Math.round((totalCost / settings.totalBudget) * 100), 100) 
    : 0;

  const supabaseConfig = getSupabaseConfig();
  const isSupabaseConfigured = Boolean(supabaseConfig.spreadsheetId && supabaseConfig.sheetName);

  const handlePrint = () => {
    window.print();
  };

  return (
    <aside className="w-full lg:w-96 xl:w-[420px] shrink-0 space-y-4">
      {/* Sticky container wrapper for desktop view */}
      <div className="lg:sticky lg:top-24 space-y-4">
        
        {/* Main Cart & Budget Summary Box */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-tight">
                  試算清單摘要
                </h2>
                <p className="text-xs text-slate-500">
                  已選 {selectedVendors.length} / 全部 {vendors.length} 家商戶
                </p>
              </div>
            </div>

            {/* Google Sheets Status Pill */}
            <button
              onClick={onOpenSettingsModal}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isSupabaseConfigured
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
              }`}
              title={isSupabaseConfigured ? "已連線至 Google Sheets 資料庫，點擊管理設定" : "點擊設定連線 Google Sheets 資料庫"}
            >
              <Database className="w-3 h-3 text-orange-500" />
              <span>{isSupabaseConfigured ? 'Sheets 已連線' : '連線資料庫'}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
            </button>
          </div>

          {/* Budget Total Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                勾選商戶預算小計
              </span>
              <span className="text-2xl font-black text-orange-600 tracking-tight">
                {formatCurrency(totalCost, settings.currencySymbol)}
              </span>
            </div>

            {/* Budget Gauge */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                <span>目標預算：{formatCurrency(settings.totalBudget, settings.currencySymbol)}</span>
                <span>已用 {budgetUsedPercent}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isOverBudget ? 'bg-rose-500' : 'bg-orange-500'
                  }`}
                  style={{ width: `${budgetUsedPercent}%` }}
                />
              </div>
            </div>

            {/* Over/Under badge */}
            <div className="text-xs flex items-center justify-between pt-1">
              {isOverBudget ? (
                <div className="text-rose-600 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  超出預算上限 {formatCurrency(Math.abs(remainingBudget), settings.currencySymbol)}
                </div>
              ) : (
                <div className="text-slate-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>剩餘可用：<strong className="text-emerald-600 font-bold">{formatCurrency(remainingBudget, settings.currencySymbol)}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Shortlisted Vendors List */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              <span>已選入圍商戶</span>
              <span>預算開支</span>
            </div>

            {selectedVendors.length === 0 ? (
              <div className="text-center py-10 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-slate-400 space-y-2">
                <ShoppingCart className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                <p className="text-xs font-semibold text-slate-600">
                  尚無勾選任何試算商戶
                </p>
                <p className="text-[11px] text-slate-400">
                  請在左側列表中勾選商戶，即時計算預算總額
                </p>
                <button
                  onClick={onOpenAddModal}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 text-white text-xs font-bold shadow-xs hover:bg-orange-600 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  新增婚禮商戶
                </button>
              </div>
            ) : (
              selectedVendors.map((vendor) => {
                const itemCost = calculateVendorTotalCost(vendor, settings.estimatedGuests);
                const categoryStyle = getCategoryStyle(vendor.category, settings.customCategories);
                const categoryZh = getCategoryDisplayName(vendor.category, settings.customCategories);

                return (
                  <div
                    key={vendor.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2.5 group hover:border-orange-300 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => onToggleSelect(vendor.id)}
                          className="w-5 h-5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                          title="取消勾選試算"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {onDeleteVendor && (
                          <button
                            onClick={() => onDeleteVendor(vendor.id)}
                            className="w-5 h-5 rounded bg-rose-100 hover:bg-rose-200 text-rose-600 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                            title="永久刪除此商戶"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${categoryStyle.bg} ${categoryStyle.text}`}>
                            {categoryZh}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 truncate">
                          {vendor.name}
                        </h4>
                        {vendor.pricingModel === 'per_guest' && (
                          <p className="text-[10px] text-slate-400">
                            {formatCurrency(vendor.cost, settings.currencySymbol)} x {settings.estimatedGuests} 人
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-extrabold text-xs text-orange-600">
                      {formatCurrency(itemCost, settings.currencySymbol)}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Actions Footer */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                列印報價試算
              </button>

              <button
                onClick={onExportJSON}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                匯出 JSON 備份
              </button>
            </div>

            {onSyncSupabase && isSupabaseConfigured && (
              <button
                onClick={onSyncSupabase}
                disabled={isSupabaseSyncing}
                className="w-full py-2.5 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-100 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <Database className="w-3.5 h-3.5" />
                {isSupabaseSyncing ? '同步至 Google Sheets 中...' : '立即同步資料庫 (Google Sheets)'}
              </button>
            )}
          </div>

        </div>

      </div>
    </aside>
  );
};
