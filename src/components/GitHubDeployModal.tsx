import React, { useRef, useState } from 'react';
import { Vendor, WeddingSettings } from '../types';
import { calculateVendorTotalCost, formatCurrency } from '../utils/formatters';
import { 
  X, 
  Github, 
  Download, 
  Upload, 
  Copy, 
  Check, 
  Database, 
  Globe
} from 'lucide-react';

interface GitHubDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendors: Vendor[];
  settings: WeddingSettings;
  onExportJSON: () => void;
  onImportJSON: (data: { vendors: Vendor[]; settings: WeddingSettings }) => void;
}

export const GitHubDeployModal: React.FC<GitHubDeployModalProps> = ({
  isOpen,
  onClose,
  vendors,
  settings,
  onExportJSON,
  onImportJSON,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('');
    setImportSuccess('');
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.vendors)) {
          onImportJSON({
            vendors: parsed.vendors,
            settings: parsed.settings || settings,
          });
          setImportSuccess(`成功匯入 ${parsed.vendors.length} 個商戶資料！`);
        } else if (Array.isArray(parsed)) {
          onImportJSON({ vendors: parsed, settings });
          setImportSuccess(`成功匯入 ${parsed.length} 個商戶資料！`);
        } else {
          setImportError('JSON 格式無效，請確保檔案包含商戶列表。');
        }
      } catch (err) {
        setImportError('無法解析 JSON 檔案，請檢查檔案內容格式。');
      }
    };
    reader.readAsText(file);
  };

  const generateMarkdownSummary = () => {
    const selected = vendors.filter((v) => v.isSelected);
    const totalCost = selected.reduce(
      (sum, v) => sum + calculateVendorTotalCost(v, settings.estimatedGuests),
      0
    );

    let md = `# 婚禮商戶規劃表：${settings.coupleNames}\n`;
    md += `**婚禮日期：** ${settings.weddingDate || '未定'} | **預計賓客數：** ${settings.estimatedGuests}\n`;
    md += `**勾選商戶預算小計：** ${formatCurrency(totalCost, settings.currencySymbol)} / 總預算上限：${formatCurrency(settings.totalBudget, settings.currencySymbol)}\n\n`;
    md += `| 商戶名稱 | 類別 | 計費模式 | 預算開支 | 狀態 |\n`;
    md += `| -------- | ---- | -------- | -------- | ---- |\n`;

    vendors.forEach((v) => {
      const cost = calculateVendorTotalCost(v, settings.estimatedGuests);
      md += `| ${v.name} | ${v.category} | ${v.pricingModel} | ${formatCurrency(cost, settings.currencySymbol)} | ${v.isSelected ? '✅ 已勾選試算' : '未勾選'} |\n`;
    });

    return md;
  };

  const handleCopyMarkdown = () => {
    const text = generateMarkdownSummary();
    navigator.clipboard.writeText(text);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-white">
              <Github className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                資料雲端備份與 GitHub Pages 部署
              </h3>
              <p className="text-xs text-slate-400">
                匯出 JSON 備份檔，或將靜態網頁發布至 GitHub 免費託管。
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Section 1: JSON Export & Import */}
          <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-100 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-orange-500" />
                JSON 資料備份與還原
              </h4>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                瀏覽器已自動儲存
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              您的所有商戶資料、服務備註及勾選試算狀態均會自動保存在本地瀏覽器快取中。您可以隨時下載獨立的 <code className="bg-orange-100 px-1 py-0.5 rounded text-[11px]">wedding-vendors.json</code> 備份檔，上傳至 GitHub 或在其他裝置匯入。
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={onExportJSON}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                下載 JSON 備份檔
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-slate-800 border border-slate-300 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-slate-500" />
                匯入 JSON 備份檔
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                onClick={handleCopyMarkdown}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                title="複製 GitHub README Markdown 表格"
              >
                {copiedMarkdown ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    <span>已複製 Markdown！</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-400" />
                    <span>複製 Markdown 表格</span>
                  </>
                )}
              </button>
            </div>

            {importSuccess && (
              <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 p-2 rounded-lg">
                {importSuccess}
              </div>
            )}
            {importError && (
              <div className="text-xs font-semibold text-rose-600 bg-rose-50 p-2 rounded-lg">
                {importError}
              </div>
            )}
          </div>

          {/* Section 2: GitHub Pages Deploy Instructions */}
          <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between font-sans">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-400" />
                如何部署至 GitHub Pages
              </h4>
              <span className="text-[10px] bg-slate-800 text-amber-400 px-2 py-0.5 rounded-full font-semibold">
                靜態網頁 (Static SPA)
              </span>
            </div>

            <p className="text-slate-300 font-sans text-xs leading-relaxed">
              本系統採用 Vite + React 前端架構，只需簡單 3 個步驟即可部署至 GitHub Pages 免費託管網址：
            </p>

            <div className="space-y-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-amber-200/90 text-[11px] leading-relaxed">
              <div className="font-bold text-white">1. 編譯建置靜態檔案：</div>
              <div className="text-slate-400 bg-slate-900 p-2 rounded border border-slate-800">
                npm run build
              </div>

              <div className="font-bold text-white pt-2">2. 提交代碼至您的 Git 儲存庫：</div>
              <div className="text-slate-400 bg-slate-900 p-2 rounded border border-slate-800">
                git add . &amp;&amp; git commit -m &quot;新增婚禮商戶規劃工具&quot;
              </div>

              <div className="font-bold text-white pt-2">3. 發布 `dist` 目錄至 `gh-pages` 分支：</div>
              <div className="text-slate-400 bg-slate-900 p-2 rounded border border-slate-800">
                npx gh-pages -d dist
              </div>
            </div>

            <p className="text-slate-400 font-sans text-[11px]">
              亦可於 GitHub Repository 設定中開啟 <strong>GitHub Pages</strong>，選取 <strong>GitHub Actions (Vite)</strong> 自動於 Commit 時完成部署！
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
