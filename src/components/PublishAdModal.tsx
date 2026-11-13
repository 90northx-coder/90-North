import { ChangeEvent, FormEvent, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { PRESET_IMAGE_OPTIONS } from '../data/featuredCatalog';
import { compressImageFile } from '../services/classifiedsService';
import {
  CATEGORY_LABELS,
  CITY_LABELS,
  CONDITION_LABELS,
  CURRENCY_LABELS,
  FIELD_LIMITS,
  Listing,
  ListingCategory,
  ListingCity,
  ListingCondition,
  ListingCurrency,
} from '../types/classifieds';
import { ListingImage } from './ListingImage';

interface PublishAdModalProps {
  defaultSellerName: string;
  defaultCity: ListingCity;
  editingListing?: Listing | null;
  onClose: () => void;
  onSubmit: (data: {
    sellerName: string;
    title: string;
    description: string;
    category: ListingCategory;
    city: ListingCity;
    district?: string;
    condition: ListingCondition;
    price: number;
    currency: ListingCurrency;
    negotiable: boolean;
    imageUrl: string;
  }) => Promise<void>;
}

export function PublishAdModal({
  defaultSellerName,
  defaultCity,
  editingListing,
  onClose,
  onSubmit,
}: PublishAdModalProps) {
  const [sellerName, setSellerName] = useState(
    editingListing?.sellerName || defaultSellerName || ''
  );
  const [title, setTitle] = useState(editingListing?.title || '');
  const [category, setCategory] = useState<ListingCategory>(
    editingListing?.category || 'electronics'
  );
  const [city, setCity] = useState<ListingCity>(editingListing?.city || defaultCity || 'riyadh');
  const [district, setDistrict] = useState(editingListing?.district || '');
  const [condition, setCondition] = useState<ListingCondition>(
    editingListing?.condition || 'like_new'
  );
  const [price, setPrice] = useState(
    editingListing ? String(editingListing.price) : ''
  );
  const [currency, setCurrency] = useState<ListingCurrency>(
    editingListing?.currency || 'SAR'
  );
  const [negotiable, setNegotiable] = useState(
    editingListing?.negotiable ?? true
  );
  const [description, setDescription] = useState(editingListing?.description || '');
  const [imageUrl, setImageUrl] = useState(
    editingListing?.imageUrl || 'preset:camera'
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    setUploadingImage(true);
    try {
      const compressed = await compressImageFile(file);
      setImageUrl(compressed);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'تعذر تحميل الصورة.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanSeller = sellerName.trim();
    const cleanTitle = title.trim();
    const cleanDesc = description.trim();
    const numericPrice = price.trim() === '' ? 0 : Number(price);

    if (cleanSeller.length < FIELD_LIMITS.sellerNameMin) {
      setErrorMsg('يرجى كتابة اسم المعلن (حرفان على الأقل).');
      return;
    }
    if (cleanTitle.length < FIELD_LIMITS.titleMin) {
      setErrorMsg('عنوان الإعلان قصير جداً (4 أحرف على الأقل).');
      return;
    }
    if (cleanDesc.length < FIELD_LIMITS.descriptionMin) {
      setErrorMsg('يرجى كتابة وصف واضح لا يقل عن 10 أحرف.');
      return;
    }
    if (!Number.isFinite(numericPrice) || numericPrice < 0 || numericPrice > FIELD_LIMITS.priceMax) {
      setErrorMsg('يرجى إدخال سعر صحيح.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        sellerName: cleanSeller,
        title: cleanTitle,
        description: cleanDesc,
        category,
        city,
        district: district.trim() || undefined,
        condition,
        price: numericPrice,
        currency,
        negotiable,
        imageUrl,
      });
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ الإعلان.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-[#FAF9F7] border border-[#E6E1D8] rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-[#FAF9F7]/95 backdrop-blur-sm border-b border-[#E6E1D8] px-6 py-4 flex items-center justify-between">
          <h2 id="publish-modal-title" className="text-lg font-bold text-[#18181B]">
            {editingListing ? 'تعديل الإعلان' : 'نشر إعلان جديد'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="w-10 h-10 rounded-lg border border-[#E6E1D8] bg-white flex items-center justify-center text-[#18181B] hover:bg-[#F2EFE9] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
          {/* Image Preview & Selector */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-[#18181B]">
              صورة الإعلان
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
              <div className="sm:col-span-5 aspect-[4/3] rounded-xl overflow-hidden border border-[#E6E1D8] bg-[#F2EFE9]">
                <ListingImage
                  imageUrl={imageUrl}
                  title={title || 'معاينة الصورة'}
                  category={category}
                />
              </div>

              <div className="sm:col-span-7 space-y-3">
                <label className="flex items-center justify-center gap-2 h-10 px-4 text-xs sm:text-sm font-medium bg-white border border-[#E6E1D8] rounded-lg text-[#18181B] hover:bg-[#F2EFE9] cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>{uploadingImage ? 'جاري معالجة الصورة...' : 'رفع صورة من جهازك'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>

                <div>
                  <p className="text-xs text-[#57534E] mb-2">أو اختر صورة جاهزة:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_IMAGE_OPTIONS.map((preset) => (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => setImageUrl(preset.key)}
                        className={`p-1 rounded-lg border text-right transition-colors cursor-pointer ${
                          imageUrl === preset.key
                            ? 'border-[#0D5C46] bg-[#0D5C46]/5'
                            : 'border-[#E6E1D8] bg-white hover:bg-[#F2EFE9]'
                        }`}
                      >
                        <img
                          src={preset.src}
                          alt={preset.label}
                          className="w-full h-11 object-cover rounded"
                        />
                        <span className="block text-[11px] text-[#57534E] mt-1 truncate">
                          {preset.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#57534E] mb-1.5">
                عنوان الإعلان
              </label>
              <input
                type="text"
                required
                minLength={FIELD_LIMITS.titleMin}
                maxLength={FIELD_LIMITS.titleMax}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: شقة ثلاث غرف بحي النرجس"
                className="w-full h-11 px-3.5 text-sm bg-white border border-[#E6E1D8] rounded-lg focus:outline-none focus:border-[#0D5C46]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#57534E] mb-1.5">
                الفئة
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ListingCategory)}
                className="w-full h-11 px-3 text-sm bg-white border border-[#E6E1D8] rounded-lg focus:outline-none focus:border-[#0D5C46]"
              >
                {(Object.keys(CATEGORY_LABELS) as ListingCategory[]).map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#57534E] mb-1.5">
                الحالة
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ListingCondition)}
                className="w-full h-11 px-3 text-sm bg-white border border-[#E6E1D8] rounded-lg focus:outline-none focus:border-[#0D5C46]"
              >
                {(Object.keys(CONDITION_LABELS) as ListingCondition[]).map((cond) => (
                  <option key={cond} value={cond}>
                    {CONDITION_LABELS[cond]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#57534E] mb-1.5">
                المدينة
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value as ListingCity)}
                className="w-full h-11 px-3 text-sm bg-white border border-[#E6E1D8] rounded-lg focus:outline-none focus:border-[#0D5C46]"
              >
                {(Object.keys(CITY_LABELS) as ListingCity[]).map((c) => (
                  <option key={c} value={c}>
                    {CITY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#57534E] mb-1.5">
                الحي (اختياري)
              </label>
              <input
                type="text"
                maxLength={FIELD_LIMITS.districtMax}
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="مثال: حي الياسمين"
                className="w-full h-11 px-3.5 text-sm bg-white border border-[#E6E1D8] rounded-lg focus:outline-none focus:border-[#0D5C46]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#57534E] mb-1.5">
                السعر (اتركه 0 لعبارة «على السوم»)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  max={FIELD_LIMITS.priceMax}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  className="flex-1 h-11 px-3.5 text-sm bg-white border border-[#E6E1D8] rounded-lg tabular-nums focus:outline-none focus:border-[#0D5C46]"
                />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as ListingCurrency)}
                  aria-label="العملة"
                  className="w-24 h-11 px-2.5 text-sm bg-white border border-[#E6E1D8] rounded-lg focus:outline-none focus:border-[#0D5C46]"
                >
                  {(Object.keys(CURRENCY_LABELS) as ListingCurrency[]).map((cur) => (
                    <option key={cur} value={cur}>
                      {CURRENCY_LABELS[cur]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#57534E] mb-1.5">
                اسم المعلن الظاهر للعامة
              </label>
              <input
                type="text"
                required
                minLength={FIELD_LIMITS.sellerNameMin}
                maxLength={FIELD_LIMITS.sellerNameMax}
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                placeholder="الاسم أو المتجر"
                className="w-full h-11 px-3.5 text-sm bg-white border border-[#E6E1D8] rounded-lg focus:outline-none focus:border-[#0D5C46]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="inline-flex items-center gap-2.5 text-sm text-[#18181B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={negotiable}
                  onChange={(e) => setNegotiable(e.target.checked)}
                  className="w-4 h-4 accent-[#0D5C46] rounded"
                />
                <span>السعر قابل للتفاوض</span>
              </label>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#57534E] mb-1.5">
                الوصف الكامل
              </label>
              <textarea
                rows={4}
                required
                minLength={FIELD_LIMITS.descriptionMin}
                maxLength={FIELD_LIMITS.descriptionMax}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="اكتب المواصفات الكاملة، المميزات، وأي ملاحظات تهم المشتري..."
                className="w-full p-3.5 text-sm bg-white border border-[#E6E1D8] rounded-lg resize-y focus:outline-none focus:border-[#0D5C46]"
              />
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
              {errorMsg}
            </p>
          )}

          <div className="pt-2 border-t border-[#E6E1D8] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-5 text-sm font-medium text-[#57534E] hover:text-[#18181B] bg-white border border-[#E6E1D8] rounded-lg cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting || uploadingImage}
              className="h-11 px-6 text-sm font-semibold text-white bg-[#0D5C46] hover:bg-[#094333] rounded-lg transition-colors cursor-pointer disabled:opacity-60"
            >
              {submitting
                ? 'جاري الحفظ...'
                : editingListing
                  ? 'حفظ التعديلات'
                  : 'نشر الإعلان'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
