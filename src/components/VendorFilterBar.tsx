import React from 'react';
import { CustomCategory, SortOption, VendorCategory, VendorStatus, ViewMode } from '../types';
import { DEFAULT_CATEGORIES_LIST, getCategoryDisplayName } from '../utils/formatters';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  LayoutGrid, 
  List, 
  X,
  Settings2
} from 'lucide-react';

interface VendorFilterBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: VendorCategory | 'All';
  setSelectedCategory: (cat: VendorCategory | 'All') => void;
  selectedStatus: VendorStatus | 'All';
  setSelectedStatus: (status: VendorStatus | 'All') => void;
  sortOption: SortOption;
  setSortOption: (sort: SortOption) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  categoryCounts: Record<string, number>;
  totalCount: number;
  categoriesList?: CustomCategory[];
  onOpenManageCategories?: () => void;
}

export const VendorFilterBar: React.FC<VendorFilterBarProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedStatus,
  setSelectedStatus,
  sortOption,
  setSortOption,
  viewMode,
  setViewMode,
  categoryCounts,
  totalCount,
  categoriesList = DEFAULT_CATEGORIES_LIST,
  onOpenManageCategories,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-xs space-y-4">
      
      {/* Top Row: Search input + Sort + View Mode */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋商戶名稱、服務細節..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 text-xs sm:text-sm text-slate-900 border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
            id="input-vendor-search"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters & Controls */}
        <div className="flex items-center justify-between w-full md:w-auto gap-2.5 flex-wrap">
          
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
              id="select-status-filter"
            >
              <option value="All">全部狀態</option>
              <option value="booked">已預訂 (Booked)</option>
              <option value="shortlisted">已入圍 (Shortlisted)</option>
              <option value="contacted">已聯絡 (Contacted)</option>
              <option value="considering">考慮中 (Considering)</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <ArrowUpDown className="w-3.5 h-3.5 text-orange-600" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
              id="select-sort-option"
            >
              <option value="price-asc">價格：由低到高</option>
              <option value="price-desc">價格：由高到低</option>
              <option value="rating-desc">評價：最高優先</option>
              <option value="name-asc">商戶名稱 (A-Z)</option>
              <option value="category">商戶類別分組</option>
              <option value="date-newest">最近新增</option>
            </select>
          </div>

          {/* View Toggle (Grid vs Table) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-orange-600 shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="卡片檢視"
              id="btn-view-grid"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-orange-600 shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="表格列表"
              id="btn-view-table"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* Category Pills horizontal scroll */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar border-t border-slate-100">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedCategory === 'All'
              ? 'bg-orange-500 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          全部商戶 ({totalCount})
        </button>

        {categoriesList.map((catObj) => {
          const catKey = catObj.id;
          const count = categoryCounts[catKey] || categoryCounts[catObj.nameZh] || 0;
          const isSelected = selectedCategory === catKey || selectedCategory === catObj.nameZh;
          const zhName = catObj.nameZh;
          return (
            <button
              key={catObj.id}
              onClick={() => setSelectedCategory(catKey)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-orange-500 text-white font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{zhName}</span>
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}

        {onOpenManageCategories && (
          <button
            onClick={onOpenManageCategories}
            className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-all cursor-pointer ml-auto"
            title="管理與新增商戶類別"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>管理類別</span>
          </button>
        )}
      </div>

    </div>
  );
};
