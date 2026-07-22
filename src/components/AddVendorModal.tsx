import React, { useState, useEffect } from 'react';
import { PricingModel, Vendor, VendorCategory, VendorStatus, CustomCategory } from '../types';
import { DEFAULT_CATEGORIES_LIST, getCategoryDisplayName } from '../utils/formatters';
import { PRESET_SAMPLE_IMAGES } from '../data/initialVendors';
import { uploadVendorImage } from '../lib/supabase';
import { X, Upload, Star, Link as LinkIcon, Check, DollarSign, Plus, Tag } from 'lucide-react';

interface AddVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vendorData: Partial<Vendor>) => void;
  editingVendor?: Vendor | null;
  categoriesList?: CustomCategory[];
  onAddCategory?: (newCat: CustomCategory) => void;
}

export const AddVendorModal: React.FC<AddVendorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingVendor,
  categoriesList = DEFAULT_CATEGORIES_LIST,
  onAddCategory,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<VendorCategory>('Venue');
  const [cost, setCost] = useState('');
  const [pricingModel, setPricingModel] = useState<PricingModel>('fixed');
  const [guestMultiplier, setGuestMultiplier] = useState('');
  const [serviceDetails, setServiceDetails] = useState('');
  const [image, setImage] = useState('');
  const [rating, setRating] = useState(5);
  const [status, setStatus] = useState<VendorStatus>('considering');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  // Inline custom category state
  const [showInlineAddCat, setShowInlineAddCat] = useState(false);
  const [inlineCatName, setInlineCatName] = useState('');

  const [activeImageTab, setActiveImageTab] = useState<'preset' | 'url' | 'upload'>('preset');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [imageUploadSuccess, setImageUploadSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (editingVendor) {
      setName(editingVendor.name || '');
      setCategory(editingVendor.category || 'Venue');
      setCost(editingVendor.cost?.toString() || '');
      setPricingModel(editingVendor.pricingModel || 'fixed');
      setGuestMultiplier(editingVendor.guestCountMultiplier?.toString() || '');
      setServiceDetails(editingVendor.serviceDetails || '');
      setImage(editingVendor.image || '');
      setRating(editingVendor.rating || 5);
      setStatus(editingVendor.status || 'considering');
      setPhone(editingVendor.contact?.phone || '');
      setEmail(editingVendor.contact?.email || '');
      setWebsite(editingVendor.contact?.website || '');
      setContactPerson(editingVendor.contact?.contactPerson || '');
      setNotes(editingVendor.notes || '');
      setTagsInput(editingVendor.tags ? editingVendor.tags.join(', ') : '');
    } else {
      setName('');
      setCategory(categoriesList[0]?.id || 'Venue');
      setCost('');
      setPricingModel('fixed');
      setGuestMultiplier('');
      setServiceDetails('');
      setImage(PRESET_SAMPLE_IMAGES[0].url);
      setRating(5);
      setStatus('considering');
      setPhone('');
      setEmail('');
      setWebsite('');
      setContactPerson('');
      setNotes('');
      setTagsInput('');
    }
  }, [editingVendor, isOpen, categoriesList]);

  if (!isOpen) return null;

  const handleInlineAddCategory = () => {
    if (!inlineCatName.trim()) return;
    const newCatId = `cat_${Date.now()}`;
    const newCatObj: CustomCategory = {
      id: newCatId,
      nameZh: inlineCatName.trim(),
      nameEn: inlineCatName.trim(),
      accent: '#f97316',
      isSystem: false,
    };
    if (onAddCategory) {
      onAddCategory(newCatObj);
    }
    setCategory(newCatId);
    setInlineCatName('');
    setShowInlineAddCat(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageUploadError(null);
      setImageUploadSuccess(null);
      setIsUploadingImage(true);
      const result = await uploadVendorImage(file);
      setIsUploadingImage(false);

      if (result.success && result.imageUrl) {
        setImage(result.imageUrl);
        setImageUploadSuccess('圖片已上傳成功，預覽已更新。');
      } else {
        setImageUploadError(result.error || '圖片上傳失敗，請稍後再試。');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isUploadingImage) return;

    const parsedCost = parseFloat(cost) || 0;
    const parsedGuestMultiplier = parseFloat(guestMultiplier) || undefined;
    const tags = tagsInput
      ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    onSave({
      ...(editingVendor ? { id: editingVendor.id } : {}),
      name,
      category,
      cost: parsedCost,
      pricingModel,
      guestCountMultiplier: parsedGuestMultiplier,
      serviceDetails,
      image,
      rating,
      status,
      contact: {
        phone,
        email,
        website,
        contactPerson,
      },
      notes,
      tags,
      isSelected: editingVendor ? editingVendor.isSelected : true,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-white">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {editingVendor ? '編輯商戶詳細資料' : '新增婚禮商戶'}
            </h3>
            <p className="text-xs text-slate-500">
              請填寫商戶名稱、價格試算模式、服務細節及參考圖片。
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Row 1: Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                商戶名稱 *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：日落海景婚宴會館"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-orange-500/50 focus:outline-hidden"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  商戶類別 *
                </label>
                <button
                  type="button"
                  onClick={() => setShowInlineAddCat(!showInlineAddCat)}
                  className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  新增自訂類別
                </button>
              </div>

              {showInlineAddCat ? (
                <div className="flex items-center gap-1.5 bg-orange-50 p-1.5 rounded-xl border border-orange-200">
                  <input
                    type="text"
                    value={inlineCatName}
                    onChange={(e) => setInlineCatName(e.target.value)}
                    placeholder="輸入新類別名稱..."
                    autoFocus
                    className="w-full px-2 py-1 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={handleInlineAddCategory}
                    disabled={!inlineCatName.trim()}
                    className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shrink-0 disabled:opacity-50 cursor-pointer"
                  >
                    確定
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInlineAddCat(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as VendorCategory)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-orange-500/50 focus:outline-hidden"
                >
                  {categoriesList.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nameZh}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Row 2: Cost & Pricing Model */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-orange-50/50 border border-orange-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                計價模式
              </label>
              <select
                value={pricingModel}
                onChange={(e) => setPricingModel(e.target.value as PricingModel)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900"
              >
                <option value="fixed">固定總價 ($)</option>
                <option value="per_guest">按賓客每人計價 ($/人)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {pricingModel === 'per_guest' ? '每位賓客費用 ($)' : '費用總額 ($)'} *
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  required
                  step="any"
                  min="0"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder={pricingModel === 'per_guest' ? '800' : '28000'}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-orange-500/50"
                />
              </div>
            </div>

            {pricingModel === 'per_guest' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  預估賓客受邀人數
                </label>
                <input
                  type="number"
                  value={guestMultiplier}
                  onChange={(e) => setGuestMultiplier(e.target.value)}
                  placeholder="120"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-900"
                />
              </div>
            )}
          </div>

          {/* Row 3: Reference Image Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              參考圖片
            </label>

            <div className="flex items-center gap-2 mb-3 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActiveImageTab('preset')}
                className={`pb-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                  activeImageTab === 'preset'
                    ? 'border-orange-600 text-orange-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                精選範例圖
              </button>
              <button
                type="button"
                onClick={() => setActiveImageTab('url')}
                className={`pb-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                  activeImageTab === 'url'
                    ? 'border-orange-600 text-orange-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                貼上圖片網址
              </button>
              <button
                type="button"
                onClick={() => setActiveImageTab('upload')}
                className={`pb-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                  activeImageTab === 'upload'
                    ? 'border-orange-600 text-orange-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                上傳本地檔案
              </button>
            </div>

            {activeImageTab === 'preset' && (
              <div className="grid grid-cols-5 gap-2 max-h-28 overflow-y-auto p-1">
                {PRESET_SAMPLE_IMAGES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setImage(preset.url)}
                    className={`relative rounded-xl overflow-hidden h-16 border-2 transition-all cursor-pointer ${
                      image === preset.url
                        ? 'border-orange-600 scale-95 shadow-xs'
                        : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    {image === preset.url && (
                      <div className="absolute inset-0 bg-orange-600/30 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {activeImageTab === 'url' && (
              <div className="relative">
                <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-900"
                />
              </div>
            )}

            {activeImageTab === 'upload' && (
              <label className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs font-semibold text-slate-600">
                  {isUploadingImage ? '上傳至 Sirv 中...' : '點擊選擇電腦中的圖片檔案'}
                </span>
                <span className="text-[10px] text-slate-400">支援 PNG, JPG 或 WebP 格式（會上傳到 Sirv）</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploadingImage}
                  className="hidden"
                />
              </label>
            )}

            {imageUploadError && (
              <p className="mt-2 text-[11px] text-rose-600 font-semibold">
                {imageUploadError}
              </p>
            )}

            {imageUploadSuccess && (
              <p className="mt-2 text-[11px] text-emerald-600 font-semibold">
                {imageUploadSuccess}
              </p>
            )}

            {/* Always show current selected image preview */}
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
              <p className="text-[11px] font-semibold text-slate-600 mb-2">目前圖片預覽</p>
              {image ? (
                <img
                  src={image}
                  alt="Vendor preview"
                  referrerPolicy="no-referrer"
                  className="w-full h-40 object-cover rounded-lg border border-slate-200 bg-white"
                />
              ) : (
                <div className="w-full h-40 rounded-lg border border-dashed border-slate-300 bg-white flex items-center justify-center text-xs text-slate-400">
                  尚未選擇圖片
                </div>
              )}
            </div>
          </div>

          {/* Row 4: Service Details */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              服務細節說明 / 包含項目
            </label>
            <textarea
              rows={3}
              value={serviceDetails}
              onChange={(e) => setServiceDetails(e.target.value)}
              placeholder="例如：雙攝影師全天拍攝、航拍花絮、當日SDE精華影片、精修照片300張..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-900 focus:ring-2 focus:ring-orange-500/50"
            />
          </div>

          {/* Row 5: Rating & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                評分星級
              </label>
              <div className="flex items-center gap-1 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= rating ? 'fill-amber-400' : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-slate-700 ml-2">
                  {rating}/5
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                洽談狀態
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as VendorStatus)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-900"
              >
                <option value="considering">考慮中 (Considering)</option>
                <option value="contacted">已聯絡 (Contacted)</option>
                <option value="shortlisted">已入圍 (Shortlisted)</option>
                <option value="booked">已預訂 / 已付訂金 (Booked)</option>
              </select>
            </div>
          </div>

          {/* Row 6: Contact Info */}
          <div className="p-4 rounded-2xl bg-slate-50 space-y-3">
            <span className="text-xs font-bold text-slate-800 block">
              聯絡方式資料
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="對接聯絡人（例如：陳小姐）"
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-900"
              />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="聯絡電話（例如：91234567）"
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-900"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="電子郵件"
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-900"
              />
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="官方網站 / IG網址"
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-900"
              />
            </div>
          </div>

          {/* Row 7: Tags & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                標籤（逗號分隔）
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="例如：戶外草地, 航拍, 素食菜單"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                個人筆記 / 付款條款備註
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="例如：訂金需於三個月前支付..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-900"
              />
            </div>
          </div>

          {/* Submit Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isUploadingImage}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-100 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isUploadingImage
                ? '圖片上傳中...'
                : editingVendor
                  ? '儲存變更'
                  : '新增商戶至列表'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
