/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { AccountWorkspace } from './components/AccountWorkspace';
import { FilterBar, SortOrder } from './components/FilterBar';
import { ActiveView, Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { ListingCard } from './components/ListingCard';
import { ListingDetailModal } from './components/ListingDetailModal';
import { PublishAdModal } from './components/PublishAdModal';
import { DEMO_FEATURED_LISTINGS } from './data/featuredCatalog';
import { auth, googleProvider, testFirestoreConnection } from './lib/firebase';
import {
  closeInquiry,
  createListing,
  deleteListing,
  getPrivateProfile,
  replyToInquiry,
  savePrivateProfile,
  sendInquiry,
  subscribeActiveListings,
  subscribeFavorites,
  subscribeInquiries,
  subscribeMyListings,
  toggleFavorite,
  updateListingDetails,
  updateListingStatus,
} from './services/classifiedsService';
import {
  Inquiry,
  Listing,
  ListingCategory,
  ListingCity,
  ListingCondition,
  ListingCurrency,
  ListingStatus,
  UserPrivateProfile,
} from './types/classifieds';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [activeView, setActiveView] = useState<ActiveView>('browse');
  const [liveListings, setLiveListings] = useState<Listing[]>([]);
  const [listingsLoaded, setListingsLoaded] = useState(false);

  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [incomingInquiries, setIncomingInquiries] = useState<Inquiry[]>([]);
  const [outgoingInquiries, setOutgoingInquiries] = useState<Inquiry[]>([]);
  const [privateProfile, setPrivateProfile] = useState<UserPrivateProfile | null>(null);

  // Filters & search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ListingCategory | 'all'>('all');
  const [selectedCity, setSelectedCity] = useState<ListingCity | 'all'>('all');
  const [selectedCondition, setSelectedCondition] = useState<ListingCondition | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  // Modals & UI feedback
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [notice, setNotice] = useState<{ type: 'info' | 'error'; text: string } | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    testFirestoreConnection();
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    const unsub = subscribeActiveListings(
      (items) => {
        setLiveListings(items);
        setListingsLoaded(true);
      },
      () => {
        setListingsLoaded(true);
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authReady || !user) {
      setMyListings([]);
      setFavoriteIds(new Set());
      setIncomingInquiries([]);
      setOutgoingInquiries([]);
      setPrivateProfile(null);
      return;
    }

    const unsubMine = subscribeMyListings(user.uid, setMyListings);
    const unsubFavs = subscribeFavorites(user.uid, setFavoriteIds);
    const unsubInq = subscribeInquiries(user.uid, (incoming, outgoing) => {
      setIncomingInquiries(incoming);
      setOutgoingInquiries(outgoing);
    });

    getPrivateProfile(user.uid)
      .then(setPrivateProfile)
      .catch(() => {
        // Handled by service
      });

    return () => {
      unsubMine();
      unsubFavs();
      unsubInq();
    };
  }, [authReady, user]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  const showNotice = (type: 'info' | 'error', text: string) => {
    setNotice({ type, text });
  };

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      showNotice('info', 'تم تسجيل الدخول بنجاح.');
    } catch (err) {
      const msg =
        err instanceof Error && err.message.includes('popup-closed-by-user')
          ? 'تم إلغاء نافذة تسجيل الدخول.'
          : 'تعذر إتمام تسجيل الدخول. تأكد من السماح للنوافذ المنبثقة.';
      showNotice('error', msg);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setActiveView('browse');
    showNotice('info', 'تم تسجيل الخروج.');
  };

  const handleOpenPostModal = () => {
    if (!user) {
      handleSignIn();
      return;
    }
    setEditingListing(null);
    setPostModalOpen(true);
  };

  // Combine live Firestore listings with curated starter showcase listings
  const allBrowseListings = useMemo(() => {
    if (liveListings.length === 0) {
      return DEMO_FEATURED_LISTINGS;
    }
    return [...liveListings, ...DEMO_FEATURED_LISTINGS];
  }, [liveListings]);

  const filteredListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = allBrowseListings.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      if (selectedCity !== 'all' && item.city !== selectedCity) {
        return false;
      }
      if (selectedCondition !== 'all' && item.condition !== selectedCondition) {
        return false;
      }
      if (q) {
        const haystack = `${item.title} ${item.description} ${item.district || ''} ${item.sellerName}`.toLowerCase();
        if (!haystack.includes(q)) {
          return false;
        }
      }
      return true;
    });

    if (sortOrder === 'price_asc') {
      return [...list].sort((a, b) => a.price - b.price);
    }
    if (sortOrder === 'price_desc') {
      return [...list].sort((a, b) => b.price - a.price);
    }
    return [...list].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [
    allBrowseListings,
    searchQuery,
    selectedCategory,
    selectedCity,
    selectedCondition,
    sortOrder,
  ]);

  const favoriteListings = useMemo(() => {
    const mergedMap = new Map<string, Listing>();
    for (const item of allBrowseListings) mergedMap.set(item.id, item);
    for (const item of myListings) mergedMap.set(item.id, item);
    return Array.from(favoriteIds)
      .map((id) => mergedMap.get(id))
      .filter((item): item is Listing => Boolean(item));
  }, [allBrowseListings, myListings, favoriteIds]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'all' ||
    selectedCity !== 'all' ||
    selectedCondition !== 'all' ||
    sortOrder !== 'newest';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedCity('all');
    setSelectedCondition('all');
    setSortOrder('newest');
  };

  const handleToggleFavorite = async (listing: Listing) => {
    if (!user) {
      await handleSignIn();
      return;
    }
    try {
      await toggleFavorite(listing.id, favoriteIds.has(listing.id));
    } catch (err) {
      showNotice(
        'error',
        err instanceof Error ? err.message : 'تعذر تحديث المحفوظات.'
      );
    }
  };

  const handleSaveListing = async (data: {
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
  }) => {
    if (editingListing) {
      await updateListingDetails(editingListing.id, data, editingListing.status);
      showNotice('info', 'تم تحديث الإعلان بنجاح.');
      if (selectedListing?.id === editingListing.id) {
        setSelectedListing(null);
      }
    } else {
      await createListing(data);
      showNotice('info', 'تم نشر إعلانك بنجاح وأصبح متاحاً للتصفح.');
      setActiveView('browse');
    }
  };

  const handleStatusChange = async (listingId: string, status: ListingStatus) => {
    await updateListingStatus(listingId, status);
    showNotice('info', 'تم تحديث حالة الإعلان.');
    if (selectedListing?.id === listingId) {
      setSelectedListing((prev) => (prev ? { ...prev, status } : null));
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    await deleteListing(listingId);
    showNotice('info', 'تم حذف الإعلان.');
  };

  const unreadInquiriesCount = incomingInquiries.filter(
    (inq) => inq.status === 'open'
  ).length;

  const activeSelectedListing = useMemo(() => {
    if (!selectedListing) return null;
    const updated =
      liveListings.find((l) => l.id === selectedListing.id) ||
      myListings.find((l) => l.id === selectedListing.id);
    return updated || selectedListing;
  }, [selectedListing, liveListings, myListings]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F7] text-[#18181B]">
      <Header
        activeView={activeView}
        onNavigate={setActiveView}
        onOpenPostModal={handleOpenPostModal}
        user={user}
        onSignIn={handleSignIn}
        unreadInquiriesCount={unreadInquiriesCount}
      />

      {notice && (
        <div className="max-w-[1200px] w-full mx-auto px-4 sm:px-6 pt-4">
          <div
            role="status"
            className={`px-4 py-3 rounded-xl border text-sm flex items-center justify-between gap-4 ${
              notice.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-[#0D5C46]/10 border-[#0D5C46]/25 text-[#0D5C46]'
            }`}
          >
            <span>{notice.text}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-xs font-semibold hover:underline cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      <main className="flex-1">
        {activeView === 'browse' ? (
          <>
            <HeroSection
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedCity={selectedCity}
              onCityChange={setSelectedCity}
              onScrollToResults={() =>
                resultsRef.current?.scrollIntoView({ behavior: 'smooth' })
              }
            />

            <section
              ref={resultsRef}
              className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 space-y-8"
            >
              <FilterBar
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedCity={selectedCity}
                onCityChange={setSelectedCity}
                selectedCondition={selectedCondition}
                onConditionChange={setSelectedCondition}
                sortOrder={sortOrder}
                onSortChange={setSortOrder}
                totalCount={filteredListings.length}
                hasActiveFilters={hasActiveFilters}
                onResetFilters={resetFilters}
              />

              {!listingsLoaded && liveListings.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-[#E6E1D8] rounded-xl overflow-hidden animate-pulse"
                    >
                      <div className="aspect-[4/3] bg-[#F2EFE9]" />
                      <div className="p-4 space-y-3">
                        <div className="h-3 w-1/2 bg-[#F2EFE9] rounded" />
                        <div className="h-4 w-5/6 bg-[#F2EFE9] rounded" />
                        <div className="h-5 w-1/3 bg-[#F2EFE9] rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="bg-white border border-[#E6E1D8] rounded-xl p-12 text-center space-y-3">
                  <p className="text-base font-semibold text-[#18181B]">
                    لا توجد إعلانات مطابقة لخيارات البحث الحالية
                  </p>
                  <p className="text-sm text-[#57534E]">
                    جرّب تعديل الكلمات المفتاحية أو إعادة ضبط الفلاتر لعرض جميع الإعلانات.
                  </p>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="h-10 px-5 text-sm font-medium text-white bg-[#0D5C46] hover:bg-[#094333] rounded-lg cursor-pointer"
                  >
                    عرض جميع الإعلانات
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      isFavorite={favoriteIds.has(listing.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onSelect={setSelectedListing}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          <AccountWorkspace
            activeView={activeView}
            user={user}
            myListings={myListings}
            favoriteListings={favoriteListings}
            favoriteIds={favoriteIds}
            incomingInquiries={incomingInquiries}
            outgoingInquiries={outgoingInquiries}
            privateProfile={privateProfile}
            onSignIn={handleSignIn}
            onSignOut={handleSignOut}
            onOpenPostModal={handleOpenPostModal}
            onSelectListing={setSelectedListing}
            onEditListing={(item) => {
              setEditingListing(item);
              setPostModalOpen(true);
            }}
            onStatusChange={handleStatusChange}
            onDeleteListing={handleDeleteListing}
            onToggleFavorite={handleToggleFavorite}
            onReplyInquiry={async (id, text) => {
              await replyToInquiry(id, text);
              showNotice('info', 'تم إرسال الرد للمشتري.');
            }}
            onCloseInquiry={async (id) => {
              await closeInquiry(id);
              showNotice('info', 'تم إغلاق الاستفسار.');
            }}
            onSaveProfile={async (profileData) => {
              await savePrivateProfile(profileData);
              const updated = await getPrivateProfile(user!.uid);
              setPrivateProfile(updated);
            }}
          />
        )}
      </main>

      <footer className="border-t border-[#E6E1D8] bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs sm:text-sm text-[#57534E]">
          <div className="space-y-1">
            <span className="font-display font-bold text-[#18181B]">المدار</span>
            <p className="text-xs text-[#78716C]">
              مبوبة إعلانية منظمة للبيع والشراء والتواصل المباشر بين المعلنين.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={() => {
                setActiveView('browse');
                setSelectedCategory('real_estate');
              }}
              className="hover:text-[#18181B] cursor-pointer"
            >
              عقارات
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveView('browse');
                setSelectedCategory('vehicles');
              }}
              className="hover:text-[#18181B] cursor-pointer"
            >
              مركبات
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveView('browse');
                setSelectedCategory('electronics');
              }}
              className="hover:text-[#18181B] cursor-pointer"
            >
              إلكترونيات
            </button>
            <button
              type="button"
              onClick={handleOpenPostModal}
              className="font-medium text-[#0D5C46] hover:underline cursor-pointer"
            >
              أضف إعلانك
            </button>
          </div>
        </div>
      </footer>

      {activeSelectedListing && (
        <ListingDetailModal
          listing={activeSelectedListing}
          user={user}
          isFavorite={favoriteIds.has(activeSelectedListing.id)}
          onClose={() => setSelectedListing(null)}
          onToggleFavorite={handleToggleFavorite}
          onEdit={(item) => {
            setSelectedListing(null);
            setEditingListing(item);
            setPostModalOpen(true);
          }}
          onStatusChange={handleStatusChange}
          onDelete={handleDeleteListing}
          onSendInquiry={async (params) => {
            await sendInquiry(params);
          }}
          onRequestSignIn={handleSignIn}
        />
      )}

      {postModalOpen && (
        <PublishAdModal
          defaultSellerName={
            privateProfile?.displayName || user?.displayName || ''
          }
          defaultCity={privateProfile?.defaultCity || 'riyadh'}
          editingListing={editingListing}
          onClose={() => {
            setPostModalOpen(false);
            setEditingListing(null);
          }}
          onSubmit={handleSaveListing}
        />
      )}
    </div>
  );
}
