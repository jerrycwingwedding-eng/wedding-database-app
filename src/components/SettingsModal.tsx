import React, { useState, useEffect } from 'react';
import { WeddingSettings, CustomCategory } from '../types';
import { DEFAULT_CATEGORIES_LIST } from '../utils/formatters';
import { 
  X, 
  Heart, 
  RefreshCw, 
  Database, 
  Check, 
  Copy, 
  Code2,
  CheckCircle2,
  AlertCircle,
  Tag,
  Plus,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  testSupabaseConnection, 
  SUPABASE_SQL_SCHEMA,
  SupabaseConfig 
} from '../lib/supabase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: WeddingSettings;
  onSaveSettings: (newSettings: WeddingSettings) => void;
  onResetData: () => void;
  onSupabaseConnected?: () => void;
  initialTab?: 'wedding' | 'categories' | 'supabase';
}

const PRESET_ACCENT_COLORS = [
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#0ea5e9', // Sky
  '#6366f1', // Indigo
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#14b8a6', // Teal
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#64748b', // Slate
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onResetData,
  onSupabaseConnected,
  initialTab = 'wedding',
}) => {
  const [activeTab, setActiveTab] = useState<'wedding' | 'categories' | 'supabase'>(initialTab);

  // Wedding settings state
  const [coupleNames, setCoupleNames] = useState(settings.coupleNames || 'Jerry & Cwing 婚禮策劃');
  const [weddingDate, setWeddingDate] = useState(settings.weddingDate);
  const [totalBudget, setTotalBudget] = useState(settings.totalBudget.toString());
  const [estimatedGuests, setEstimatedGuests] = useState(settings.estimatedGuests.toString());
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol);

  // Categories state
  const [categories, setCategories] = useState<CustomCategory[]>(
    settings.customCategories && settings.customCategories.length > 0
      ? settings.customCategories
      : DEFAULT_CATEGORIES_LIST
  );
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#f97316');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  // Google Sheets state
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [sirvFolder, setSirvFolder] = useState('');
  const [autoSync, setAutoSync] = useState(true);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSql, setShowSql] = useState(false);

  const [confirmResetCategories, setConfirmResetCategories] = useState(false);
  const [confirmResetData, setConfirmResetData] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setCoupleNames(settings.coupleNames || 'Jerry & Cwing 婚禮策劃');
      setWeddingDate(settings.weddingDate);
      setTotalBudget(settings.totalBudget.toString());
      setEstimatedGuests(settings.estimatedGuests.toString());
      setCurrencySymbol(settings.currencySymbol);
      setCategories(
        settings.customCategories && settings.customCategories.length > 0
          ? settings.customCategories
          : DEFAULT_CATEGORIES_LIST
      );

      const config = getSupabaseConfig();
      setSupabaseUrl(config.spreadsheetId);
      setSupabaseAnonKey(config.sheetName);
      setSirvFolder(config.sirvFolder || 'wedding-vendors');
      setAutoSync(config.autoSync);
    }
  }, [isOpen, settings, initialTab]);

  if (!isOpen) return null;

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const catId = `cat_${Date.now()}`;
    const newCategoryItem: CustomCategory = {
      id: catId,
      nameZh: newCatName.trim(),
      nameEn: newCatName.trim(),
      accent: newCatColor,
      isSystem: false,
    };
    setCategories((prev) => [...prev, newCategoryItem]);
    setNewCatName('');
  };

  const handleDeleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const handleStartRenameCategory = (cat: CustomCategory) => {
    setEditingCatId(cat.id);
    setEditingCatName(cat.nameZh);
  };

  const handleSaveRenameCategory = (id: string) => {
    if (!editingCatName.trim()) return;
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, nameZh: editingCatName.trim() } : c))
    );
    setEditingCatId(null);
    setEditingCatName('');
  };

  const handleResetCategories = () => {
    setCategories(DEFAULT_CATEGORIES_LIST);
    setConfirmResetCategories(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save Wedding Settings
    onSaveSettings({
      coupleNames,
      weddingDate,
      totalBudget: parseFloat(totalBudget) || 0,
      estimatedGuests: parseInt(estimatedGuests) || 100,
      currencySymbol,
      customCategories: categories,
    });

    // Save Google Sheets Config
    const config: SupabaseConfig = {
      spreadsheetId: supabaseUrl.trim(),
      sheetName: supabaseAnonKey.trim() || '工作表1',
      sirvFolder: sirvFolder.trim() || 'wedding-vendors',
      autoSync,
    };
    saveSupabaseConfig(config);

    if (config.spreadsheetId && config.sheetName && onSupabaseConnected) {
      onSupabaseConnected();
    }

    onClose();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection(supabaseUrl.trim(), supabaseAnonKey.trim());
    setIsTesting(false);
    setTestResult(res);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-100 text-orange-600">
              <Heart className="w-5 h-5 fill-orange-500/20" />
            </span>
            <h3 className="text-lg font-bold text-slate-900">
              系統設定與自訂類別
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-5 pt-2 gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('wedding')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'wedding'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            婚禮基本資料
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'categories'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-orange-500" />
            自訂商戶類別
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-orange-100 text-orange-800 font-bold">
              {categories.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('supabase')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'supabase'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Google Sheets 資料庫
            {supabaseUrl && supabaseAnonKey && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          
          {activeTab === 'wedding' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  新人姓名 / 婚禮主題名稱
                </label>
                <input
                  type="text"
                  required
                  value={coupleNames}
                  onChange={(e) => setCoupleNames(e.target.value)}
                  placeholder="Jerry & Cwing 婚禮策劃"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    婚禮日期
                  </label>
                  <input
                    type="date"
                    value={weddingDate}
                    onChange={(e) => setWeddingDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    預計受邀賓客數
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={estimatedGuests}
                    onChange={(e) => setEstimatedGuests(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    總預算目標上限
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={totalBudget}
                    onChange={(e) => setTotalBudget(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    貨幣單位
                  </label>
                  <select
                    value={currencySymbol}
                    onChange={(e) => setCurrencySymbol(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900"
                  >
                    <option value="HK$">HK$ (港幣 HKD)</option>
                    <option value="$">$ (美元 USD / 澳幣 AUD)</option>
                    <option value="NT$">NT$ (新台幣 TWD)</option>
                    <option value="€">€ (歐元 EUR)</option>
                    <option value="£">£ (英鎊 GBP)</option>
                    <option value="¥">¥ (日圓 JPY / 人民幣 CNY)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="space-y-5">
              <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-2xl text-xs text-orange-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-orange-800">
                  <Tag className="w-4 h-4 text-orange-600" />
                  自訂商戶類別管理
                </div>
                <p>
                  您可以新增符合自己婚禮需求的特殊類別（如「喜餅蛋糕」、「婚禮主持」、「寵物花童」），或微調類別名稱與標籤顏色。
                </p>
              </div>

              {/* Add New Category Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  新增自訂類別
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="輸入新類別名稱，例如：婚禮主持..."
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-orange-500/50"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={!newCatName.trim()}
                    className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    新增
                  </button>
                </div>

                {/* Color swatches */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                    選擇類別代表色
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {PRESET_ACCENT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewCatColor(color)}
                        className={`w-6 h-6 rounded-full transition-transform cursor-pointer border ${
                          newCatColor === color ? 'scale-125 ring-2 ring-slate-800 border-white' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Category List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                  <span>現有類別列表 ({categories.length})</span>
                  {confirmResetCategories ? (
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                      <span className="text-[11px] text-amber-800">確定恢復預設類別？</span>
                      <button
                        type="button"
                        onClick={handleResetCategories}
                        className="px-2 py-0.5 bg-orange-500 hover:bg-orange-600 text-white rounded text-[10px] font-bold cursor-pointer"
                      >
                        確定
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmResetCategories(false)}
                        className="px-1.5 py-0.5 text-slate-500 hover:text-slate-800 text-[10px] cursor-pointer"
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmResetCategories(true)}
                      className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      恢復預設類別
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.accent || '#f97316' }}
                        />
                        {editingCatId === cat.id ? (
                          <input
                            type="text"
                            value={editingCatName}
                            onChange={(e) => setEditingCatName(e.target.value)}
                            onBlur={() => handleSaveRenameCategory(cat.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRenameCategory(cat.id);
                            }}
                            autoFocus
                            className="px-2 py-1 rounded border border-slate-300 text-xs text-slate-900 w-36"
                          />
                        ) : (
                          <span
                            onClick={() => handleStartRenameCategory(cat)}
                            className="font-bold text-slate-800 truncate cursor-pointer hover:text-orange-600"
                            title="點擊修改名稱"
                          >
                            {cat.nameZh}
                          </span>
                        )}

                        {cat.isSystem ? (
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-medium shrink-0">
                            預設
                          </span>
                        ) : (
                          <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.2 rounded font-bold shrink-0">
                            自訂
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartRenameCategory(cat)}
                          className="px-2 py-1 text-[11px] text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100 cursor-pointer"
                        >
                          重新命名
                        </button>
                        {!cat.isSystem && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                            title="刪除此類別"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {activeTab === 'supabase' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-2xl text-xs text-orange-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-orange-800">
                  <Database className="w-4 h-4 text-orange-600" />
                  Google Sheets 雲端資料庫同步
                </div>
                <p>
                  連結您的 Google Sheet，可跨裝置備份與同步所有商戶資料及預算設定。
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Spreadsheet ID
                </label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="例如：1IF-15JCvxSF_Uy6kl-f7CgmAG473gkveoLPkMZ54S-I"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sheet Name
                </label>
                <input
                  type="text"
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  placeholder="工作表1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-900 font-mono"
                />
              </div>

              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={(e) => setAutoSync(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                  />
                  開啟即時自動同步
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sirv Folder
                </label>
                <input
                  type="text"
                  value={sirvFolder}
                  onChange={(e) => setSirvFolder(e.target.value)}
                  placeholder="例如：wedding-vendors"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-900 font-mono"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  上傳圖片會進入此 Sirv 資料夾，並在商戶圖片欄位儲存公開 URL。
                </p>
              </div>

              {/* Action & Test Controls */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !supabaseUrl || !supabaseAnonKey}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isTesting ? '測試連線中...' : '測試 Google Sheets 連線'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowSql(!showSql)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Code2 className="w-3.5 h-3.5 text-orange-500" />
                  {showSql ? '隱藏設定提示' : '查看連線設定提示'}
                </button>
              </div>

              {testResult && (
                <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              {showSql && (
                <div className="p-3 bg-slate-950 text-slate-200 rounded-xl space-y-2 border border-slate-800">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span>Google Sheets 連線提示</span>
                    <button
                      type="button"
                      onClick={handleCopySql}
                      className="text-orange-400 hover:text-orange-300 flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      {copiedSql ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> 已複製！
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> 複製提示
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono whitespace-pre-wrap overflow-x-auto p-2 bg-slate-900 rounded border border-slate-800 text-slate-300">
                    {SUPABASE_SQL_SCHEMA}
                  </pre>
                </div>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            {confirmResetData ? (
              <div className="flex items-center gap-1.5 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
                <span className="text-xs text-rose-800 font-semibold">確定清除所有本機快取資料？</span>
                <button
                  type="button"
                  onClick={() => {
                    onResetData();
                    setConfirmResetData(false);
                    onClose();
                  }}
                  className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold cursor-pointer"
                >
                  確定
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmResetData(false)}
                  className="px-1.5 py-0.5 text-slate-500 hover:text-slate-800 text-xs cursor-pointer"
                >
                  取消
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmResetData(true)}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                重設本機資料
              </button>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-100 cursor-pointer"
              >
                儲存設定
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
