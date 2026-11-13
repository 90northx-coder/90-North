import { FormEvent, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  CATEGORY_LABELS,
  CITY_LABELS,
  CURRENCY_LABELS,
  FIELD_LIMITS,
  formatPrice,
  formatRelativeArabicDate,
  Inquiry,
  INQUIRY_STATUS_LABELS,
  Listing,
  ListingCity,
  ListingStatus,
  STATUS_LABELS,
  UserPrivateProfile,
} from '../types/classifieds';
import { ActiveView } from './Header';
import { ListingCard } from './ListingCard';
import { ListingImage } from './ListingImage';

interface AccountWorkspaceProps {
  activeView: Exclude<ActiveView, 'browse'>;
  user: User | null;
  myListings: Listing[];
  favoriteListings: Listing[];
  favoriteIds: Set<string>;
  incomingInquiries: Inquiry[];
  outgoingInquiries: Inquiry[];
  privateProfile: UserPrivateProfile | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenPostModal: () => void;
  onSelectListing: (listing: Listing) => void;
  onEditListing: (listing: Listing) => void;
  onStatusChange: (listingId: string, status: ListingStatus) => Promise<void>;
  onDeleteListing: (listingId: string) => Promise<void>;
  onToggleFavorite: (listing: Listing) => void;
  onReplyInquiry: (inquiryId: string, replyText: string) => Promise<void>;
  onCloseInquiry: (inquiryId: string) => Promise<void>;
  onSaveProfile: (data: {
    displayName: string;
    defaultCity: ListingCity;
    phone?: string;
  }) => Promise<void>;
}

export function AccountWorkspace({
  activeView,
  user,
  myListings,
  favoriteListings,
  favoriteIds,
  incomingInquiries,
  outgoingInquiries,
  privateProfile,
  onSignIn,
  onSignOut,
  onOpenPostModal,
  onSelectListing,
  onEditListing,
  onStatusChange,
  onDeleteListing,
  onToggleFavorite,
  onReplyInquiry,
  onCloseInquiry,
  onSaveProfile,
}: AccountWorkspaceProps) {
  const [inquiryTab, setInquiryTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState(
    privateProfile?.displayName || user?.displayName || ''
  );
  const [defaultCity, setDefaultCity] = useState<ListingCity>(
    privateProfile?.defaultCity || 'riyadh'
  );
  const [phone, setPhone] = useState(privateProfile?.phone || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  useEffect(() => {
    setDisplayName(privateProfile?.displayName || user?.displayName || '');
    setDefaultCity(privateProfile?.defaultCity || 'riyadh');
    setPhone(privateProfile?.phone || '');
  }, [privateProfile, user]);

  if (!user) {
    return (
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16">
        <div className="max-w-md mx-auto bg-white border border-[#E6E1D8] rounded-xl p-8 text-center space-y-4">
          <h2 className="text-xl font-bold text-[#18181B]">
            سجّل الدخول لإدارة حسابك
          </h2>
          <p className="text-sm text-[#57534E] leading-relaxed">
            يمكنك نشر إعلاناتك، تعديلها، حفظ المفضلة، ومراسلة المشترين والبائعين
            بعد تسجيل الدخول بحساب جوجل.
          </p>
          <button
            type="button"
            onClick={onSignIn}
            className="w-full h-11 px-5 text-sm font-semibold text-white bg-[#0D5C46] hover:bg-[#094333] rounded-lg transition-colors cursor-pointer"
          >
            تسجيل الدخول بحساب جوجل
          </button>
        </div>
      </section>
    );
  }

  const handleReplySubmit = async (e: FormEvent, inquiryId: string) => {
    e.preventDefault();
    const text = (replyDrafts[inquiryId] || '').trim();
    if (!text) return;
    setBusyId(inquiryId);
    try {
      await onReplyInquiry(inquiryId, text);
      setReplyDrafts((prev) => ({ ...prev, [inquiryId]: '' }));
    } finally {
      setBusyId(null);
    }
  };

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setProfileMessage('');
    setProfileSaving(true);
    try {
      await onSaveProfile({
        displayName: displayName.trim() || user.displayName || 'مستخدم',
        defaultCity,
        phone: phone.trim() || undefined,
      });
      setProfileMessage('تم حفظ بيانات الملف الشخصي بنجاح.');
    } catch (err) {
      setProfileMessage(
        err instanceof Error ? err.message : 'تعذر حفظ الملف الشخصي.'
      );
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* My Ads View */}
      {activeView === 'my_ads' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E6E1D8] pb-4">
            <div>
              <h2 className="text-2xl font-bold text-[#18181B]">إعلاناتي</h2>
              <p className="text-sm text-[#57534E] mt-1">
                أدر إعلاناتك المنشورة، حدّث حالتها، أو عدّل تفاصيلها في أي وقت.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenPostModal}
              className="h-10 px-4 text-sm font-semibold text-white bg-[#0D5C46] hover:bg-[#094333] rounded-lg cursor-pointer"
            >
              إعلان جديد
            </button>
          </div>

          {myListings.length === 0 ? (
            <div className="bg-white border border-[#E6E1D8] rounded-xl p-10 text-center space-y-3">
              <p className="text-base font-medium text-[#18181B]">
                لم تنشر أي إعلان بعد
              </p>
              <p className="text-sm text-[#57534E]">
                ابدأ بإضافة أول إعلان ليظهر لجميع المتصفحين فوراً.
              </p>
              <button
                type="button"
                onClick={onOpenPostModal}
                className="h-10 px-5 text-sm font-semibold text-white bg-[#0D5C46] hover:bg-[#094333] rounded-lg cursor-pointer"
              >
                أضف إعلانك الأول
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myListings.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-[#E6E1D8] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <button
                      type="button"
                      onClick={() => onSelectListing(item)}
                      className="w-24 h-18 rounded-lg overflow-hidden border border-[#E6E1D8] bg-[#F2EFE9] shrink-0 cursor-pointer"
                    >
                      <ListingImage
                        imageUrl={item.imageUrl}
                        title={item.title}
                        category={item.category}
                      />
                    </button>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 text-xs text-[#57534E]">
                        <span className="font-medium text-[#0D5C46]">
                          {STATUS_LABELS[item.status]}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{CATEGORY_LABELS[item.category]}</span>
                        <span aria-hidden="true">·</span>
                        <span>{CITY_LABELS[item.city]}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelectListing(item)}
                        className="block text-base font-semibold text-[#18181B] hover:text-[#0D5C46] truncate text-right cursor-pointer"
                      >
                        {item.title}
                      </button>
                      <p className="text-sm font-bold text-[#18181B] tabular-nums">
                        {formatPrice(item.price, item.currency)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditListing(item)}
                      className="h-9 px-3 text-xs font-medium bg-[#FAF9F7] hover:bg-[#F2EFE9] border border-[#E6E1D8] rounded-lg cursor-pointer"
                    >
                      تعديل
                    </button>
                    {item.status !== 'sold' ? (
                      <button
                        type="button"
                        onClick={() => onStatusChange(item.id, 'sold')}
                        className="h-9 px-3 text-xs font-medium bg-[#FAF9F7] hover:bg-[#F2EFE9] border border-[#E6E1D8] rounded-lg cursor-pointer"
                      >
                        تمييز كمباع
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onStatusChange(item.id, 'active')}
                        className="h-9 px-3 text-xs font-medium bg-[#FAF9F7] hover:bg-[#F2EFE9] border border-[#E6E1D8] rounded-lg cursor-pointer"
                      >
                        إعادة تنشيط
                      </button>
                    )}

                    {confirmDeleteId !== item.id ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(item.id)}
                        className="h-9 px-3 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg cursor-pointer"
                      >
                        حذف
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          await onDeleteListing(item.id);
                          setConfirmDeleteId(null);
                        }}
                        className="h-9 px-3 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
                      >
                        تأكيد
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Favorites View */}
      {activeView === 'favorites' && (
        <div className="space-y-6">
          <div className="border-b border-[#E6E1D8] pb-4">
            <h2 className="text-2xl font-bold text-[#18181B]">المحفوظات</h2>
            <p className="text-sm text-[#57534E] mt-1">
              الإعلانات التي قمت بحفظها للعودة إليها لاحقاً.
            </p>
          </div>

          {favoriteListings.length === 0 ? (
            <div className="bg-white border border-[#E6E1D8] rounded-xl p-10 text-center">
              <p className="text-base font-medium text-[#18181B]">
                لا توجد إعلانات محفوظة حالياً
              </p>
              <p className="text-sm text-[#57534E] mt-1">
                اضغط على أيقونة القلب في أي إعلان لحفظه هنا.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isFavorite={favoriteIds.has(listing.id)}
                  onToggleFavorite={onToggleFavorite}
                  onSelect={onSelectListing}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Inquiries View */}
      {activeView === 'inquiries' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E6E1D8] pb-4">
            <div>
              <h2 className="text-2xl font-bold text-[#18181B]">الرسائل والاستفسارات</h2>
              <p className="text-sm text-[#57534E] mt-1">
                تواصل مباشر بين البائعين والمشترين حول الإعلانات.
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-[#F2EFE9] rounded-lg">
              <button
                type="button"
                onClick={() => setInquiryTab('incoming')}
                className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer ${
                  inquiryTab === 'incoming'
                    ? 'bg-white text-[#18181B] shadow-xs'
                    : 'text-[#57534E] hover:text-[#18181B]'
                }`}
              >
                واردة ({incomingInquiries.length})
              </button>
              <button
                type="button"
                onClick={() => setInquiryTab('outgoing')}
                className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer ${
                  inquiryTab === 'outgoing'
                    ? 'bg-white text-[#18181B] shadow-xs'
                    : 'text-[#57534E] hover:text-[#18181B]'
                }`}
              >
                مرسلة ({outgoingInquiries.length})
              </button>
            </div>
          </div>

          {(inquiryTab === 'incoming' ? incomingInquiries : outgoingInquiries).length === 0 ? (
            <div className="bg-white border border-[#E6E1D8] rounded-xl p-10 text-center">
              <p className="text-sm text-[#57534E]">
                {inquiryTab === 'incoming'
                  ? 'لا توجد استفسارات واردة على إعلاناتك حتى الآن.'
                  : 'لم ترسل أي استفسارات للمعلنين بعد.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {(inquiryTab === 'incoming' ? incomingInquiries : outgoingInquiries).map(
                (inq) => (
                  <div
                    key={inq.id}
                    className="bg-white border border-[#E6E1D8] rounded-xl p-5 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#57534E]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#18181B]">
                          {inq.listingTitle}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{inq.buyerName}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatRelativeArabicDate(inq.createdAt)}</span>
                      </div>
                      <span className="font-medium text-[#0D5C46]">
                        {INQUIRY_STATUS_LABELS[inq.status]}
                      </span>
                    </div>

                    <p className="text-sm text-[#18181B] leading-relaxed">
                      {inq.message}
                    </p>

                    {inq.offerPrice && (
                      <p className="text-xs font-semibold text-[#0D5C46] tabular-nums">
                        العرض المقدم: {inq.offerPrice.toLocaleString('en-US')}{' '}
                        {CURRENCY_LABELS.SAR}
                      </p>
                    )}

                    {inq.sellerReply && (
                      <div className="bg-[#FAF9F7] border border-[#E6E1D8] rounded-lg p-3 text-sm text-[#18181B]">
                        <span className="text-xs font-medium text-[#57534E] block mb-1">
                          رد المعلن:
                        </span>
                        {inq.sellerReply}
                      </div>
                    )}

                    {inq.status !== 'closed' && inquiryTab === 'incoming' && (
                      <form
                        onSubmit={(e) => handleReplySubmit(e, inq.id)}
                        className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[#F2EFE9]"
                      >
                        <input
                          type="text"
                          value={replyDrafts[inq.id] || ''}
                          onChange={(e) =>
                            setReplyDrafts((prev) => ({
                              ...prev,
                              [inq.id]: e.target.value,
                            }))
                          }
                          maxLength={FIELD_LIMITS.inquiryMessageMax}
                          placeholder="اكتب ردك للمشتري..."
                          className="flex-1 h-10 px-3 text-sm bg-[#FAF9F7] border border-[#E6E1D8] rounded-lg focus:outline-none focus:border-[#0D5C46]"
                        />
                        <button
                          type="submit"
                          disabled={busyId === inq.id}
                          className="h-10 px-4 text-xs font-semibold text-white bg-[#0D5C46] hover:bg-[#094333] rounded-lg cursor-pointer"
                        >
                          إرسال الرد
                        </button>
                        <button
                          type="button"
                          onClick={() => onCloseInquiry(inq.id)}
                          className="h-10 px-3 text-xs font-medium text-[#57534E] bg-[#FAF9F7] hover:bg-[#F2EFE9] border border-[#E6E1D8] rounded-lg cursor-pointer"
                        >
                          إغلاق
                        </button>
                      </form>
                    )}

                    {inq.status !== 'closed' && inquiryTab === 'outgoing' && (
                      <div className="pt-2 border-t border-[#F2EFE9] flex justify-end">
                        <button
                          type="button"
                          onClick={() => onCloseInquiry(inq.id)}
                          className="h-9 px-3 text-xs font-medium text-[#57534E] bg-[#FAF9F7] hover:bg-[#F2EFE9] border border-[#E6E1D8] rounded-lg cursor-pointer"
                        >
                          إغلاق الاستفسار
                        </button>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}

      {/* Profile View */}
      {activeView === 'profile' && (
        <div className="max-w-xl space-y-6">
          <div className="border-b border-[#E6E1D8] pb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#18181B]">الملف الشخصي</h2>
              <p className="text-sm text-[#57534E] mt-1">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="h-10 px-4 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg cursor-pointer"
            >
              تسجيل الخروج
            </button>
          </div>

          <form
            onSubmit={handleProfileSubmit}
            className="bg-white border border-[#E6E1D8] rounded-xl p-6 space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-[#57534E] mb-1.5">
                اسم المعلن الافتراضي
              </label>
              <input
                type="text"
                required
                minLength={FIELD_LIMITS.sellerNameMin}
                maxLength={FIELD_LIMITS.sellerNameMax}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full h-11 px-3.5 text-sm bg-[#FAF9F7] border border-[#E6E1D8] rounded-lg focus:outline-none focus:border-[#0D5C46]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#57534E] mb-1.5">
                المدينة الافتراضية
              </label>
              <select
                value={defaultCity}
                onChange={(e) => setDefaultCity(e.target.value as ListingCity)}
                className="w-full h-11 px-3 text-sm bg-[#FAF9F7] border border-[#E6E1D8] rounded-lg focus:outline-none focus:border-[#0D5C46]"
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
                رقم الجوال الخاص (محفوظ لحسابك فقط ولا يظهر للعامة)
              </label>
              <input
                type="tel"
                maxLength={FIELD_LIMITS.phoneMax}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="05XXXXXXXX"
                className="w-full h-11 px-3.5 text-sm bg-[#FAF9F7] border border-[#E6E1D8] rounded-lg tabular-nums focus:outline-none focus:border-[#0D5C46]"
              />
            </div>

            {profileMessage && (
              <p className="text-xs text-[#0D5C46] bg-[#0D5C46]/10 border border-[#0D5C46]/20 rounded-lg p-3">
                {profileMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={profileSaving}
              className="h-11 px-6 text-sm font-semibold text-white bg-[#0D5C46] hover:bg-[#094333] rounded-lg cursor-pointer disabled:opacity-60"
            >
              {profileSaving ? 'جاري الحفظ...' : 'حفظ التفضيلات'}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
