import React from 'react';
import { WeddingSettings } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  Plus, 
  ShoppingCart, 
  Scale, 
  Github, 
  Calendar, 
  Users, 
  Settings as SettingsIcon,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  settings: WeddingSettings;
  selectedCount: number;
  totalSelectedCost: number;
  compareCount: number;
  onOpenAddModal: () => void;
  onOpenCompareModal: () => void;
  onOpenCart: () => void;
  onOpenGitHubModal: () => void;
  onOpenSettingsModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  selectedCount,
  totalSelectedCost,
  compareCount,
  onOpenAddModal,
  onOpenCompareModal,
  onOpenCart,
  onOpenGitHubModal,
  onOpenSettingsModal,
}) => {
  const getDaysRemaining = () => {
    if (!settings.weddingDate) return null;
    const target = new Date(settings.weddingDate).getTime();
    const now = new Date().getTime();
    const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysRemaining = getDaysRemaining();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs transition-colors">
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-orange-100">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                  {settings.coupleNames || 'Jerry & Cwing 婚禮策劃'}
                </h1>
                <button
                  onClick={onOpenSettingsModal}
                  className="p-1 text-slate-400 hover:text-orange-600 transition-colors cursor-pointer"
                  title="修改新人姓名與婚禮預算設定"
                  id="btn-open-settings-nav"
                >
                  <SettingsIcon className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="uppercase tracking-widest font-semibold text-[10px] text-slate-400">
                  婚禮商戶預算控制台
                </span>
                {settings.weddingDate && (
                  <span className="hidden sm:flex items-center gap-1 border-l border-slate-200 pl-2">
                    <Calendar className="w-3 h-3 text-orange-500" />
                    {formatDate(settings.weddingDate)}
                    {daysRemaining !== null && daysRemaining > 0 && (
                      <span className="ml-1 text-[10px] bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded font-bold">
                        倒數 {daysRemaining} 天
                      </span>
                    )}
                  </span>
                )}
                <span className="hidden md:flex items-center gap-1 border-l border-slate-200 pl-2">
                  <Users className="w-3 h-3 text-slate-400" />
                  預計 {settings.estimatedGuests} 位賓客
                </span>
              </div>
            </div>
          </div>

          {/* Actions & Shopping Cart Trigger */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Compare Button */}
            {compareCount > 0 && (
              <button
                onClick={onOpenCompareModal}
                className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer"
                id="btn-open-compare"
              >
                <Scale className="w-4 h-4 text-orange-600" />
                <span className="hidden sm:inline">商戶對比</span>
                <span className="bg-orange-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {compareCount}
                </span>
              </button>
            )}

            {/* Shopping Cart Button */}
            <button
              onClick={onOpenCart}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-950 border border-orange-200/80 shadow-xs transition-all cursor-pointer group"
              id="btn-open-cart"
            >
              <div className="relative">
                <ShoppingCart className="w-4 h-4 text-orange-600 group-hover:scale-110 transition-transform" />
                {selectedCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {selectedCount}
                  </span>
                )}
              </div>
              <div className="text-left leading-tight">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">已選商戶總額</div>
                <div className="text-xs sm:text-sm font-black text-orange-600">
                  {formatCurrency(totalSelectedCost, settings.currencySymbol)}
                </div>
              </div>
            </button>

            {/* Add Vendor Primary Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-100 transition-all cursor-pointer active:scale-95"
              id="btn-add-vendor-nav"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">新增婚禮商戶</span>
            </button>

            {/* GitHub & Sync */}
            <button
              onClick={onOpenGitHubModal}
              className="p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              title="備份與部署匯出"
              id="btn-github-modal"
            >
              <Github className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
