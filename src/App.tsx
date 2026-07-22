import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CustomCategory, SortOption, Vendor, VendorCategory, VendorStatus, ViewMode, WeddingSettings } from './types';
import { 
  loadStoredVendors, 
  saveStoredVendors, 
  loadStoredSettings, 
  saveStoredSettings, 
  exportDataAsJSON
} from './utils/storage';
import { calculateVendorTotalCost, DEFAULT_CATEGORIES_LIST } from './utils/formatters';

import { Navbar } from './components/Navbar';
import { BudgetChart } from './components/BudgetChart';
import { VendorFilterBar } from './components/VendorFilterBar';
import { VendorCard } from './components/VendorCard';
import { VendorListView } from './components/VendorListView';
import { AddVendorModal } from './components/AddVendorModal';
import { CompareModal } from './components/CompareModal';
import { CartDrawer } from './components/CartDrawer';
import { GitHubDeployModal } from './components/GitHubDeployModal';
import { VendorDetailModal } from './components/VendorDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { RightCartPanel } from './components/RightCartPanel';
import { ConfirmModal } from './components/ConfirmModal';

import { 
  syncVendorsToSupabase, 
  fetchVendorsFromSupabase, 
  deleteVendorFromSupabase, 
  getSupabaseConfig 
} from './lib/supabase';

import { Plus, Filter, Database } from 'lucide-react';

export default function App() {
  const [vendors, setVendors] = useState<Vendor[]>(() => loadStoredVendors());
  const [settings, setSettings] = useState<WeddingSettings>(() => loadStoredSettings());

  // Google Sheets sync states
  const [isSupabaseSyncing, setIsSupabaseSyncing] = useState(false);
  const [supabaseStatusMsg, setSupabaseStatusMsg] = useState<string | null>(null);

  // Filter & View States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<VendorCategory | 'All'>('All');
  const [selectedStatus, setSelectedStatus] = useState<VendorStatus | 'All'>('All');
  const [sortOption, setSortOption] = useState<SortOption>('price-asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  // Selection for comparison
  const [comparedIds, setComparedIds] = useState<string[]>([]);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [detailVendor, setDetailVendor] = useState<Vendor | null>(null);

  // Confirm Modal state
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Initial fetch from Google Sheets if configured
  useEffect(() => {
    const config = getSupabaseConfig();
    if (config.spreadsheetId && config.sheetName) {
      setIsSupabaseSyncing(true);
      fetchVendorsFromSupabase().then(({ vendors: remoteVendors, error }) => {
        setIsSupabaseSyncing(false);
        if (remoteVendors && remoteVendors.length > 0) {
          setVendors(remoteVendors);
          setSupabaseStatusMsg('已從 Google Sheets 雲端資料庫載入最新商戶資料');
        } else if (error) {
          setSupabaseStatusMsg(`Google Sheets 提示：${error}`);
        }
      });
    }
  }, []);

  // Sync to local storage
  useEffect(() => {
    saveStoredVendors(vendors);
  }, [vendors]);

  useEffect(() => {
    saveStoredSettings(settings);
  }, [settings]);

  // Helper for manual/auto Google Sheets sync
  const handleSyncSupabase = useCallback(async (currentVendors = vendors) => {
    const config = getSupabaseConfig();
    if (!config.spreadsheetId || !config.sheetName) return;

    setIsSupabaseSyncing(true);
    const res = await syncVendorsToSupabase(currentVendors);
    setIsSupabaseSyncing(false);

    if (res.success) {
      setSupabaseStatusMsg('已成功同步至 Google Sheets 雲端資料庫！');
    } else {
      setSupabaseStatusMsg(`同步錯誤：${res.error}`);
    }

    setTimeout(() => setSupabaseStatusMsg(null), 4000);
  }, [vendors]);

  // Handle Vendor Checkbox Selection (Cart sum recalculation)
  const handleToggleSelect = (id: string) => {
    setVendors((prev) => {
      const updated = prev.map((v) => (v.id === id ? { ...v, isSelected: !v.isSelected } : v));
      handleSyncSupabase(updated);
      return updated;
    });
  };

  // Compare toggles
  const handleToggleCompare = (id: string) => {
    setComparedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Vendor Add/Edit/Delete
  const handleSaveVendor = (vendorData: Partial<Vendor>) => {
    let nextVendors: Vendor[] = [];
    if (vendorData.id) {
      // Edit existing
      nextVendors = vendors.map((v) => (v.id === vendorData.id ? ({ ...v, ...vendorData } as Vendor) : v));
    } else {
      // Add new
      const newVendor: Vendor = {
        id: `v-${Date.now()}`,
        name: vendorData.name || '新商戶',
        category: vendorData.category || 'Venue',
        cost: vendorData.cost || 0,
        pricingModel: vendorData.pricingModel || 'fixed',
        guestCountMultiplier: vendorData.guestCountMultiplier,
        serviceDetails: vendorData.serviceDetails || '',
        image: vendorData.image || '',
        contact: vendorData.contact || {},
        rating: vendorData.rating || 5,
        isSelected: true,
        status: vendorData.status || 'considering',
        notes: vendorData.notes || '',
        tags: vendorData.tags || [],
        createdAt: Date.now(),
      };
      nextVendors = [newVendor, ...vendors];
    }

    setVendors(nextVendors);
    handleSyncSupabase(nextVendors);
  };

  const handleDeleteVendor = (id: string) => {
    const vendorToDelete = vendors.find((v) => v.id === id);
    const vendorName = vendorToDelete ? `「${vendorToDelete.name}」` : '此商戶';

    setConfirmModalConfig({
      isOpen: true,
      title: '刪除商戶確認',
      message: `確定要刪除 ${vendorName} 嗎？此操作將無法復原。`,
      confirmText: '確定刪除',
      variant: 'danger',
      onConfirm: async () => {
        const nextVendors = vendors.filter((v) => v.id !== id);
        setVendors(nextVendors);
        setComparedIds((prev) => prev.filter((item) => item !== id));
        if (detailVendor?.id === id) {
          setDetailVendor(null);
        }
        await deleteVendorFromSupabase(id);
        handleSyncSupabase(nextVendors);
      },
    });
  };

  // Export / Import / Reset
  const handleExportJSON = () => {
    exportDataAsJSON(vendors, settings);
  };

  const handleImportJSON = (data: { vendors: Vendor[]; settings: WeddingSettings }) => {
    if (data.vendors && Array.isArray(data.vendors)) {
      setVendors(data.vendors);
      handleSyncSupabase(data.vendors);
    }
    if (data.settings) {
      setSettings(data.settings);
    }
  };

  const handleResetData = () => {
    setVendors([]);
    setComparedIds([]);
    handleSyncSupabase([]);
  };

  // Calculations
  const selectedVendors = useMemo(() => vendors.filter((v) => v.isSelected), [vendors]);
  const totalSelectedCost = useMemo(() => {
    return selectedVendors.reduce(
      (sum, v) => sum + calculateVendorTotalCost(v, settings.estimatedGuests),
      0
    );
  }, [selectedVendors, settings.estimatedGuests]);

  // Dynamic categories
  const categoriesList = useMemo(() => {
    return settings.customCategories && settings.customCategories.length > 0
      ? settings.customCategories
      : DEFAULT_CATEGORIES_LIST;
  }, [settings.customCategories]);

  const handleAddInlineCategory = useCallback((newCat: CustomCategory) => {
    setSettings((prev) => {
      const currentList = prev.customCategories && prev.customCategories.length > 0
        ? prev.customCategories
        : DEFAULT_CATEGORIES_LIST;
      const updated = [...currentList, newCat];
      return { ...prev, customCategories: updated };
    });
  }, []);

  // Counts by category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    vendors.forEach((v) => {
      counts[v.category] = (counts[v.category] || 0) + 1;
    });
    return counts;
  }, [vendors]);

  // Filtered & Sorted Vendors
  const filteredVendors = useMemo(() => {
    return vendors
      .filter((vendor) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = vendor.name.toLowerCase().includes(q);
          const matchService = vendor.serviceDetails.toLowerCase().includes(q);
          const matchNotes = vendor.notes?.toLowerCase().includes(q);
          const matchRep = vendor.contact?.contactPerson?.toLowerCase().includes(q);
          if (!matchName && !matchService && !matchNotes && !matchRep) return false;
        }

        // Category filter
        if (selectedCategory !== 'All' && vendor.category !== selectedCategory) {
          return false;
        }

        // Status filter
        if (selectedStatus !== 'All' && vendor.status !== selectedStatus) {
          return false;
        }

        // Selected Only (Cart filter)
        if (showOnlySelected && !vendor.isSelected) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const costA = calculateVendorTotalCost(a, settings.estimatedGuests);
        const costB = calculateVendorTotalCost(b, settings.estimatedGuests);

        switch (sortOption) {
          case 'price-asc':
            return costA - costB;
          case 'price-desc':
            return costB - costA;
          case 'rating-desc':
            return b.rating - a.rating;
          case 'name-asc':
            return a.name.localeCompare(b.name);
          case 'category':
            return a.category.localeCompare(b.category);
          case 'date-newest':
            return b.createdAt - a.createdAt;
          default:
            return 0;
        }
      });
  }, [vendors, searchQuery, selectedCategory, selectedStatus, showOnlySelected, sortOption, settings.estimatedGuests]);

  const comparedVendors = useMemo(() => {
    return vendors.filter((v) => comparedIds.includes(v.id));
  }, [vendors, comparedIds]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans transition-colors selection:bg-orange-500 selection:text-white">
      
      {/* Top Sticky Header */}
      <Navbar
        settings={settings}
        selectedCount={selectedVendors.length}
        totalSelectedCost={totalSelectedCost}
        compareCount={comparedIds.length}
        onOpenAddModal={() => {
          setEditingVendor(null);
          setIsAddModalOpen(true);
        }}
        onOpenCompareModal={() => setIsCompareModalOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenGitHubModal={() => setIsGitHubModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
      />

      {/* Google Sheets Status Toast Notification */}
      {supabaseStatusMsg && (
        <div className="bg-orange-500 text-white text-xs font-bold py-2 px-4 text-center shadow-md flex items-center justify-center gap-2">
          <Database className="w-3.5 h-3.5" />
          <span>{supabaseStatusMsg}</span>
        </div>
      )}

      {/* Main Wide-Screen Split View Area */}
      <main className="flex-1 max-w-[1800px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Split Container: Left Side Vendors vs Right Side Cart Summary */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* LEFT HAND SIDE: Vendor Listing & Filters */}
          <div className="flex-1 min-w-0 w-full space-y-6">
            
            {/* Top Bar Banner / Add Vendor Callout */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                  <h2 className="text-lg font-bold text-slate-900">
                    婚禮商戶備選資料庫
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  正在為 <strong className="text-slate-800">{settings.coupleNames || 'Jerry & Cwing 婚禮策劃'}</strong> 試算與整理婚禮服務供應商
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingVendor(null);
                  setIsAddModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-100 transition-all cursor-pointer active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>新增商戶</span>
              </button>
            </div>

            {/* Filter, Search & View Control Bar */}
            <VendorFilterBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
              sortOption={sortOption}
              setSortOption={setSortOption}
              viewMode={viewMode}
              setViewMode={setViewMode}
              categoryCounts={categoryCounts}
              totalCount={vendors.length}
              categoriesList={categoriesList}
              onOpenManageCategories={() => setIsSettingsModalOpen(true)}
            />

            {/* Vendors Grid or Table */}
            {filteredVendors.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 my-2 shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto">
                  <Filter className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  {vendors.length === 0 ? '目前尚無商戶資料' : '找不到符合條件的商戶'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {vendors.length === 0 
                    ? '點擊下方按鈕開始新增您的第一筆婚禮服務供應商，自由比較價格與服務內容！'
                    : '嘗試清除搜尋關鍵字或篩選條件以檢視所有商戶。'}
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setEditingVendor(null);
                      setIsAddModalOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    新增第一個商戶
                  </button>
                  {vendors.length > 0 && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('All');
                        setSelectedStatus('All');
                        setShowOnlySelected(false);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                    >
                      清除篩選條件
                    </button>
                  )}
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredVendors.map((vendor) => (
                  <VendorCard
                    key={vendor.id}
                    vendor={vendor}
                    settings={settings}
                    isCompared={comparedIds.includes(vendor.id)}
                    onToggleSelect={handleToggleSelect}
                    onToggleCompare={handleToggleCompare}
                    onEdit={(v) => {
                      setEditingVendor(v);
                      setIsAddModalOpen(true);
                    }}
                    onDelete={handleDeleteVendor}
                    onViewDetails={(v) => setDetailVendor(v)}
                  />
                ))}
              </div>
            ) : (
              <VendorListView
                vendors={filteredVendors}
                settings={settings}
                comparedIds={comparedIds}
                onToggleSelect={handleToggleSelect}
                onToggleCompare={handleToggleCompare}
                onEdit={(v) => {
                  setEditingVendor(v);
                  setIsAddModalOpen(true);
                }}
                onDelete={handleDeleteVendor}
                onViewDetails={(v) => setDetailVendor(v)}
              />
            )}

            {/* Visual Budget Category Breakdown Chart */}
            {selectedVendors.length > 0 && (
              <div className="pt-4">
                <BudgetChart vendors={vendors} settings={settings} />
              </div>
            )}

          </div>

          {/* RIGHT HAND SIDE: Persistent Cart Summary Panel */}
          <RightCartPanel
            vendors={vendors}
            settings={settings}
            onToggleSelect={handleToggleSelect}
            onDeleteVendor={handleDeleteVendor}
            onOpenAddModal={() => {
              setEditingVendor(null);
              setIsAddModalOpen(true);
            }}
            onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
            onExportJSON={handleExportJSON}
            onSyncSupabase={() => handleSyncSupabase(vendors)}
            isSupabaseSyncing={isSupabaseSyncing}
          />

        </div>

      </main>

      {/* Footer Status Bar */}
      <footer className="mt-auto border-t border-slate-200 bg-slate-900 text-slate-400 px-6 sm:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between text-xs gap-2 shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium text-slate-200">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            Jerry &amp; Cwing 婚禮籌備試算系統
          </span>
          <span className="hidden md:inline text-slate-700">|</span>
          <span className="hidden md:inline text-slate-400">極簡白 + 活力橘主題</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsGitHubModalOpen(true)}
            className="hover:text-white transition-colors cursor-pointer text-orange-400 font-bold"
          >
            匯出資料與 GitHub 部署
          </button>
          <span className="text-slate-600">v2.6.0-google-sheets</span>
        </div>
      </footer>

      {/* Modals & Slide-over Drawers */}
      <AddVendorModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingVendor(null);
        }}
        onSave={handleSaveVendor}
        editingVendor={editingVendor}
        categoriesList={categoriesList}
        onAddCategory={handleAddInlineCategory}
      />

      <CompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        comparedVendors={comparedVendors}
        settings={settings}
        onToggleSelect={handleToggleSelect}
        onRemoveFromCompare={(id) => setComparedIds((prev) => prev.filter((i) => i !== id))}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        vendors={vendors}
        settings={settings}
        onToggleSelect={handleToggleSelect}
        onDeleteVendor={handleDeleteVendor}
        onExportJSON={handleExportJSON}
      />

      <GitHubDeployModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        vendors={vendors}
        settings={settings}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
      />

      <VendorDetailModal
        isOpen={!!detailVendor}
        onClose={() => setDetailVendor(null)}
        vendor={detailVendor}
        settings={settings}
        onToggleSelect={handleToggleSelect}
        onDeleteVendor={handleDeleteVendor}
        onEdit={(v) => {
          setEditingVendor(v);
          setIsAddModalOpen(true);
        }}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
        onResetData={handleResetData}
        onSupabaseConnected={() => handleSyncSupabase(vendors)}
      />

      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        onClose={() => setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModalConfig.onConfirm}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText={confirmModalConfig.confirmText}
        variant={confirmModalConfig.variant}
      />

    </div>
  );
}
