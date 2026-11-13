import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  Unsubscribe,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  FIELD_LIMITS,
  Inquiry,
  Listing,
  ListingCategory,
  ListingCity,
  ListingCondition,
  ListingCurrency,
  ListingStatus,
  UserPrivateProfile,
} from '../types/classifieds';

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  if (value instanceof Date) {
    return value;
  }
  return new Date();
}

function generateSafeId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${random}`;
}

function clampString(val: string, max: number): string {
  return val.trim().slice(0, max);
}

function mapDocToListing(id: string, data: Record<string, unknown>): Listing {
  return {
    id,
    ownerId: String(data.ownerId ?? ''),
    sellerName: String(data.sellerName ?? ''),
    title: String(data.title ?? ''),
    description: String(data.description ?? ''),
    category: (data.category as ListingCategory) ?? 'electronics',
    city: (data.city as ListingCity) ?? 'riyadh',
    district: data.district ? String(data.district) : undefined,
    condition: (data.condition as ListingCondition) ?? 'good',
    price: Number(data.price ?? 0),
    currency: (data.currency as ListingCurrency) ?? 'SAR',
    negotiable: Boolean(data.negotiable),
    imageUrl: String(data.imageUrl ?? ''),
    status: (data.status as ListingStatus) ?? 'active',
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function mapDocToInquiry(id: string, data: Record<string, unknown>): Inquiry {
  return {
    id,
    listingId: String(data.listingId ?? ''),
    listingTitle: String(data.listingTitle ?? ''),
    sellerId: String(data.sellerId ?? ''),
    buyerId: String(data.buyerId ?? ''),
    buyerName: String(data.buyerName ?? ''),
    message: String(data.message ?? ''),
    offerPrice: typeof data.offerPrice === 'number' ? data.offerPrice : undefined,
    status: (data.status as Inquiry['status']) ?? 'open',
    sellerReply: data.sellerReply ? String(data.sellerReply) : undefined,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export async function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('تعذر قراءة ملف الصورة.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('صيغة الصورة غير صالحة.'));
      img.onload = () => {
        const maxDim = 900;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('تعذر معالجة الصورة.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        let dataUrl = canvas.toDataURL('image/jpeg', 0.78);
        if (dataUrl.length > FIELD_LIMITS.imageUrlMax) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.55);
        }
        if (dataUrl.length > FIELD_LIMITS.imageUrlMax) {
          reject(new Error('حجم الصورة كبير جداً حتى بعد الضغط. يرجى اختيار صورة أصغر.'));
          return;
        }
        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function subscribeActiveListings(
  onData: (listings: Listing[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'listings';
  const q = query(collection(db, path), where('status', '==', 'active'), limit(80));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => mapDocToListing(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      onData(items);
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    }
  );
}

export function subscribeMyListings(
  uid: string,
  onData: (listings: Listing[]) => void
): Unsubscribe {
  const path = 'listings';
  const q = query(collection(db, path), where('ownerId', '==', uid), limit(60));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => mapDocToListing(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeFavorites(
  uid: string,
  onData: (favoriteIds: Set<string>) => void
): Unsubscribe {
  const path = `users/${uid}/favorites`;
  const q = query(collection(db, path), where('userId', '==', uid), limit(100));
  return onSnapshot(
    q,
    (snapshot) => {
      onData(new Set(snapshot.docs.map((d) => d.id)));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeInquiries(
  uid: string,
  onData: (incoming: Inquiry[], outgoing: Inquiry[]) => void
): Unsubscribe {
  const path = 'inquiries';
  let incomingList: Inquiry[] = [];
  let outgoingList: Inquiry[] = [];

  const emit = () => {
    onData([...incomingList], [...outgoingList]);
  };

  const unsubIncoming = onSnapshot(
    query(collection(db, path), where('sellerId', '==', uid), limit(60)),
    (snapshot) => {
      incomingList = snapshot.docs
        .map((d) => mapDocToInquiry(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      emit();
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );

  const unsubOutgoing = onSnapshot(
    query(collection(db, path), where('buyerId', '==', uid), limit(60)),
    (snapshot) => {
      outgoingList = snapshot.docs
        .map((d) => mapDocToInquiry(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      emit();
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );

  return () => {
    unsubIncoming();
    unsubOutgoing();
  };
}

export interface CreateListingInput {
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
}

export async function createListing(input: CreateListingInput): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('يرجى تسجيل الدخول لنشر إعلان جديد.');
  }

  const listingId = generateSafeId('ad');
  const path = `listings/${listingId}`;

  const cleanPrice = Math.min(
    FIELD_LIMITS.priceMax,
    Math.max(FIELD_LIMITS.priceMin, Number.isFinite(input.price) ? input.price : 0)
  );

  const payload: Record<string, unknown> = {
    ownerId: user.uid,
    sellerName: clampString(input.sellerName || user.displayName || 'معلن', FIELD_LIMITS.sellerNameMax),
    title: clampString(input.title, FIELD_LIMITS.titleMax),
    description: clampString(input.description, FIELD_LIMITS.descriptionMax),
    category: input.category,
    city: input.city,
    condition: input.condition,
    price: cleanPrice,
    currency: input.currency,
    negotiable: Boolean(input.negotiable),
    imageUrl: clampString(input.imageUrl, FIELD_LIMITS.imageUrlMax),
    status: 'active' as ListingStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const cleanDistrict = input.district ? clampString(input.district, FIELD_LIMITS.districtMax) : '';
  if (cleanDistrict) {
    payload.district = cleanDistrict;
  }

  try {
    await setDoc(doc(db, 'listings', listingId), payload);
    return listingId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateListingDetails(
  listingId: string,
  input: CreateListingInput,
  status: ListingStatus
): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('يرجى تسجيل الدخول لتعديل الإعلان.');
  }
  const path = `listings/${listingId}`;
  const cleanPrice = Math.min(
    FIELD_LIMITS.priceMax,
    Math.max(FIELD_LIMITS.priceMin, Number.isFinite(input.price) ? input.price : 0)
  );

  const payload: Record<string, unknown> = {
    sellerName: clampString(input.sellerName || user.displayName || 'معلن', FIELD_LIMITS.sellerNameMax),
    title: clampString(input.title, FIELD_LIMITS.titleMax),
    description: clampString(input.description, FIELD_LIMITS.descriptionMax),
    category: input.category,
    city: input.city,
    district: input.district ? clampString(input.district, FIELD_LIMITS.districtMax) : '',
    condition: input.condition,
    price: cleanPrice,
    currency: input.currency,
    negotiable: Boolean(input.negotiable),
    imageUrl: clampString(input.imageUrl, FIELD_LIMITS.imageUrlMax),
    status,
    updatedAt: serverTimestamp(),
  };

  try {
    await updateDoc(doc(db, 'listings', listingId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateListingStatus(
  listingId: string,
  status: ListingStatus
): Promise<void> {
  const path = `listings/${listingId}`;
  try {
    await updateDoc(doc(db, 'listings', listingId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteListing(listingId: string): Promise<void> {
  const path = `listings/${listingId}`;
  try {
    await deleteDoc(doc(db, 'listings', listingId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function toggleFavorite(listingId: string, isCurrentlySaved: boolean): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('يرجى تسجيل الدخول لحفظ الإعلانات.');
  }
  const path = `users/${user.uid}/favorites/${listingId}`;
  const ref = doc(db, 'users', user.uid, 'favorites', listingId);

  try {
    if (isCurrentlySaved) {
      await deleteDoc(ref);
    } else {
      await setDoc(ref, {
        userId: user.uid,
        listingId,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, isCurrentlySaved ? OperationType.DELETE : OperationType.CREATE, path);
  }
}

export async function sendInquiry(params: {
  listing: Listing;
  buyerName: string;
  message: string;
  offerPrice?: number;
}): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('يرجى تسجيل الدخول لمراسلة المعلن.');
  }
  if (params.listing.ownerId === user.uid) {
    throw new Error('لا يمكنك إرسال استفسار لإعلانك الخاص.');
  }

  const inquiryId = generateSafeId('inq');
  const path = `inquiries/${inquiryId}`;

  const payload: Record<string, unknown> = {
    listingId: params.listing.id,
    listingTitle: clampString(params.listing.title, FIELD_LIMITS.titleMax),
    sellerId: params.listing.ownerId,
    buyerId: user.uid,
    buyerName: clampString(params.buyerName || user.displayName || 'مشتري', FIELD_LIMITS.sellerNameMax),
    message: clampString(params.message, FIELD_LIMITS.inquiryMessageMax),
    status: 'open',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (typeof params.offerPrice === 'number' && Number.isFinite(params.offerPrice) && params.offerPrice > 0) {
    payload.offerPrice = Math.min(FIELD_LIMITS.priceMax, Math.max(0, params.offerPrice));
  }

  try {
    await setDoc(doc(db, 'inquiries', inquiryId), payload);
    return inquiryId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function replyToInquiry(inquiryId: string, replyText: string): Promise<void> {
  const path = `inquiries/${inquiryId}`;
  const cleanReply = clampString(replyText, FIELD_LIMITS.inquiryMessageMax);
  if (!cleanReply) {
    throw new Error('يرجى كتابة نص الرد أولاً.');
  }
  try {
    await updateDoc(doc(db, 'inquiries', inquiryId), {
      sellerReply: cleanReply,
      status: 'replied',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function closeInquiry(inquiryId: string): Promise<void> {
  const path = `inquiries/${inquiryId}`;
  try {
    await updateDoc(doc(db, 'inquiries', inquiryId), {
      status: 'closed',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function getPrivateProfile(uid: string): Promise<UserPrivateProfile | null> {
  const path = `users/${uid}/private/profile`;
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'private', 'profile'));
    if (!snap.exists()) return null;
    const data = snap.data() as Record<string, unknown>;
    return {
      userId: String(data.userId ?? uid),
      displayName: String(data.displayName ?? ''),
      defaultCity: (data.defaultCity as ListingCity) ?? 'riyadh',
      phone: data.phone ? String(data.phone) : undefined,
      updatedAt: toDate(data.updatedAt),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function savePrivateProfile(input: {
  displayName: string;
  defaultCity: ListingCity;
  phone?: string;
}): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('يرجى تسجيل الدخول لحفظ الملف الشخصي.');
  }
  const path = `users/${user.uid}/private/profile`;
  const payload: Record<string, unknown> = {
    userId: user.uid,
    displayName: clampString(input.displayName || user.displayName || 'مستخدم', FIELD_LIMITS.sellerNameMax),
    defaultCity: input.defaultCity,
    phone: input.phone ? clampString(input.phone, FIELD_LIMITS.phoneMax) : '',
    updatedAt: serverTimestamp(),
  };
  try {
    await setDoc(doc(db, 'users', user.uid, 'private', 'profile'), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
