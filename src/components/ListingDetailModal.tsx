import { FormEvent, useState } from 'react';
import { User } from 'firebase/auth';
import { Heart, MapPin, Pencil, Trash2, X } from 'lucide-react';
import {
  CATEGORY_LABELS,
  CITY_LABELS,
  CONDITION_LABELS,
  FIELD_LIMITS,
  formatPrice,
  formatRelativeArabicDate,
  Listing,
  ListingStatus,
  STATUS_LABELS,
} from '../types/classifieds';
import { ListingImage } from './ListingImage';

interface ListingDetailModalProps {
  listing: Listing;
  user: User | null;
  isFavorite: boolean;
  onClose: () => void;
  onToggleFavorite: (listing: Listing) => void;
  onEdit: (listing: Listing) => void;
  onStatusChange: (listingId: string, status: ListingStatus) => Promise<void>;
  onDelete: (listingId: string) => Promise<void>;
  onSendInquiry: (params: {
    listing: Listing;
    buyerName: string;
    message: string;
    offerPrice?: number;
  }) => Promise<void>;
  onRequestSignIn: () => void;
}

export function ListingDetailModal({
  listing,
  user,
  isFavorite,
  onClose,
  onToggleFavorite,
  onEdit,
  onStatusChange,
  onDelete,
  onSendInquiry,
  onRequestSignIn,
}: ListingDetailModalProps) {
  const isOwner = Boolean(user && user.uid === listing.ownerId && !listing.isDemo);

  const [buyerName, setBuyerName] = useState(user?.displayName || '');
  const [message, setMessage] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);

  const handleInquirySubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!user) {
      onRequestSignIn();
      return;
    }
    if (listing.isDemo) {
      setErrorMsg('هذا إعلان تعريفي للعرض. يمكنك نشر إعلان حقيقي أو مراسلة المعلنين المسجلين.');
      return;
    }
    const cleanMsg = message.trim();
    const cleanName = (buyerName || user.displayName || '').trim();
    if (cleanName.length < FIELD_LIMITS.sellerNameMin) {
      setErrorMsg('يرجى إدخال اسمك (حرفان على الأقل).');
      return;
    }
    if (cleanMsg.length < FIELD_LIMITS.inquiryMessageMin) {
      setErrorMsg('يرجى كتابة رسالتك للمعلن.');
      return;
    }

    const parsedOffer = offerPrice.trim() ? Number(offerPrice) : undefined;
    if (parsedOffer !== undefined && (!Number.isFinite(parsedOffer) || parsedOffer < 0)) {
      setErrorMsg('يرجى إدخال قيمة عرض صحيحة.');
      return;
    }

    setSending(true);
    try {
      await onSendInquiry({
        listing,
        buyerName: cleanName,
        message: cleanMsg,
        offerPrice: parsedOffer,
      });
      setSentSuccess(true);
      setMessage('');
      setOfferPrice('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'تعذر إرسال الرسالة.');
    } finally {
      setSending(false);
    }
  };

  const handleStatusUpdate = async (newStatus: ListingStatus) => {
    setStatusBusy(true);
    setErrorMsg('');
    try {
      await onStatusChange(listing.id, newStatus);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'تعذر تحديث الحالة.');
    } finally {
      setStatusBusy(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setStatusBusy(true);
    setErrorMsg('');
    try {
      await onDelete(listing.id);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'تعذر حذف الإعلان.');
      setStatusBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="listing-detail-title"
      onClick={onClose}
    >
      <div
        className="bg-[#FAF9F7] border border-[#E6E1D8] rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Bar */}
        <div className="sticky top-0 z-10 bg-[#FAF9F7]/95 backdrop-blur-sm border-b border-[#E6E1D8] px-5 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-[#57534E] truncate">
            <span>{CATEGORY_LABELS[listing.category]}</span>
            <span aria-hidden="true">·</span>
            <span>{CITY_LABELS[listing.city]}</span>
            {listing.district && (
              <>
                <span aria-hidden="true">·</span>
                <span>{listing.district}</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق النافذة"
            className="w-10 h-10 rounded-lg border border-[#E6E1D8] bg-white flex items-center justify-center text-[#18181B] hover:bg-[#F2EFE9] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Two-column Detail Body */}
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Media & Description Column */}
          <div className="lg:col-span-7 space-y-5">
            <div className="aspect-[4/3] rounded-xl overflow-hidden border border-[#E6E1D8] bg-[#F2EFE9]">
              <ListingImage
                imageUrl={listing.imageUrl}
                title={listing.title}
                category={listing.category}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="bg-white border border-[#E6E1D8] rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-[#18181B]">تفاصيل الإعلان</h3>
              <p className="text-sm sm:text-[15px] text-[#3F3F46] leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
            </div>
          </div>

          {/* Contiguous Specs & Contact / Owner Module */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-[#E6E1D8] rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h2
                  id="listing-detail-title"
                  className="text-xl font-bold text-[#18181B] leading-snug"
                >
                  {listing.title}
                </h2>
                <button
                  type="button"
                  onClick={() => onToggleFavorite(listing)}
                  aria-label={isFavorite ? 'إزالة من المحفوظات' : 'حفظ الإعلان'}
                  className={`w-10 h-10 shrink-0 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                    isFavorite
                      ? 'bg-[#0D5C46] border-[#0D5C46] text-white'
                      : 'bg-[#FAF9F7] border-[#E6E1D8] text-[#18181B] hover:bg-[#F2EFE9]'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>

              <div className="pt-2 border-t border-[#F2EFE9] flex items-baseline justify-between gap-2">
                <span className="text-2xl font-bold text-[#0D5C46] tabular-nums">
                  {formatPrice(listing.price, listing.currency)}
                </span>
                {listing.negotiable && listing.price > 0 && (
                  <span className="text-xs font-medium text-[#57534E]">
                    قابل للتفاوض
                  </span>
                )}
              </div>

              {/* Structured Specs List */}
              <dl className="pt-3 border-t border-[#F2EFE9] grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs sm:text-sm">
                <div>
                  <dt className="text-[#78716C]">المعلن</dt>
                  <dd className="font-medium text-[#18181B] mt-0.5">{listing.sellerName}</dd>
                </div>
                <div>
                  <dt className="text-[#78716C]">الحالة</dt>
                  <dd className="font-medium text-[#18181B] mt-0.5">
                    {CONDITION_LABELS[listing.condition]}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#78716C]">الموقع</dt>
                  <dd className="font-medium text-[#18181B] mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#57534E]" />
                    <span>
                      {CITY_LABELS[listing.city]}
                      {listing.district ? ` — ${listing.district}` : ''}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-[#78716C]">النشر</dt>
                  <dd className="font-medium text-[#18181B] mt-0.5">
                    {formatRelativeArabicDate(listing.createdAt)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Owner Management OR Buyer Inquiry Box */}
            {isOwner ? (
              <div className="bg-white border border-[#E6E1D8] rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#18181B]">إدارة إعلانك</h3>
                  <span className="text-xs font-medium text-[#0D5C46]">
                    {STATUS_LABELS[listing.status]}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(['active', 'paused', 'sold'] as ListingStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      disabled={statusBusy || listing.status === st}
                      onClick={() => handleStatusUpdate(st)}
                      className={`py-2 px-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer disabled:opacity-60 ${
                        listing.status === st
                          ? 'bg-[#18181B] text-white border-[#18181B]'
                          : 'bg-[#FAF9F7] text-[#18181B] border-[#E6E1D8] hover:bg-[#F2EFE9]'
                      }`}
                    >
                      {STATUS_LABELS[st]}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[#F2EFE9]">
                  <button
                    type="button"
                    onClick={() => onEdit(listing)}
                    className="flex-1 h-10 px-3 text-xs font-medium text-[#18181B] bg-[#FAF9F7] hover:bg-[#F2EFE9] border border-[#E6E1D8] rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>تعديل</span>
                  </button>

                  {!confirmDelete ? (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="h-10 px-3 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={statusBusy}
                      onClick={handleDeleteConfirm}
                      className="h-10 px-3 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
                    >
                      تأكيد الحذف
                    </button>
                  )}
                </div>

                {errorMsg && (
                  <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">
                    {errorMsg}
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-white border border-[#E6E1D8] rounded-xl p-5 space-y-3.5">
                <h3 className="text-sm font-semibold text-[#18181B]">مراسلة المعلن</h3>

                {listing.isDemo ? (
                  <p className="text-xs text-[#57534E] leading-relaxed bg-[#FAF9F7] border border-[#E6E1D8] rounded-lg p-3">
                    هذا إعلان نموذجي لاستعراض تنسيق المبوبة. يمكنك نشر إعلانك الخاص
                    أو مراسلة المعلنين الحقيقيين بعد تسجيل الدخول.
                  </p>
                ) : sentSuccess ? (
                  <div className="bg-[#0D5C46]/10 border border-[#0D5C46]/20 rounded-lg p-3.5 space-y-2">
                    <p className="text-sm font-medium text-[#0D5C46]">
                      تم إرسال استفسارك للمعلن بنجاح.
                    </p>
                    <p className="text-xs text-[#57534E]">
                      يمكنك متابعة الردود من قسم «الرسائل» في الشريط العلوي.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleInquirySubmit} className="space-y-3">
                    {!user && (
                      <p className="text-xs text-[#57534E]">
                        يلزم تسجيل الدخول بحساب جوجل لإرسال رسالة للمعلن.
                      </p>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-[#57534E] mb-1">
                        الاسم
                      </label>
                      <input
                        type="text"
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        maxLength={FIELD_LIMITS.sellerNameMax}
                        placeholder="اسمك الكريم"
                        className="w-full h-10 px-3 text-sm bg-[#FAF9F7] border border-[#E6E1D8] rounded-lg focus:outline-none focus:border-[#0D5C46]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#57534E] mb-1">
                        السعر المقترح (اختياري)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={FIELD_LIMITS.priceMax}
                        value={offerPrice}
                        onChange={(e) => setOfferPrice(e.target.value)}
                        placeholder="مثال: 4500"
                        className="w-full h-10 px-3 text-sm bg-[#FAF9F7] border border-[#E6E1D8] rounded-lg tabular-nums focus:outline-none focus:border-[#0D5C46]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#57534E] mb-1">
                        الرسالة
                      </label>
                      <textarea
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        maxLength={FIELD_LIMITS.inquiryMessageMax}
                        placeholder="استفسر عن التفاصيل أو اطلب معاينة..."
                        className="w-full p-3 text-sm bg-[#FAF9F7] border border-[#E6E1D8] rounded-lg resize-none focus:outline-none focus:border-[#0D5C46]"
                      />
                    </div>

                    {errorMsg && (
                      <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">
                        {errorMsg}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={sending}
                      className="w-full h-11 px-4 text-sm font-semibold text-white bg-[#0D5C46] hover:bg-[#094333] rounded-lg transition-colors cursor-pointer disabled:opacity-60"
                    >
                      {user
                        ? sending
                          ? 'جاري الإرسال...'
                          : 'إرسال الاستفسار'
                        : 'تسجيل الدخول للمراسلة'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
