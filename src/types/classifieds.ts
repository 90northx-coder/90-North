export type ListingCategory =
  | 'real_estate'
  | 'vehicles'
  | 'electronics'
  | 'furniture'
  | 'appliances'
  | 'fashion'
  | 'services';

export type ListingCity =
  | 'riyadh'
  | 'jeddah'
  | 'dammam'
  | 'makkah'
  | 'madinah'
  | 'khobar'
  | 'abha'
  | 'other';

export type ListingCondition =
  | 'new'
  | 'like_new'
  | 'good'
  | 'fair'
  | 'not_applicable';

export type ListingCurrency = 'SAR' | 'AED' | 'USD';

export type ListingStatus = 'active' | 'sold' | 'paused';

export type InquiryStatus = 'open' | 'replied' | 'closed';

export interface Listing {
  id: string;
  ownerId: string;
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
  status: ListingStatus;
  createdAt: Date;
  updatedAt: Date;
  isDemo?: boolean;
}

export interface Inquiry {
  id: string;
  listingId: string;
  listingTitle: string;
  sellerId: string;
  buyerId: string;
  buyerName: string;
  message: string;
  offerPrice?: number;
  status: InquiryStatus;
  sellerReply?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPrivateProfile {
  userId: string;
  displayName: string;
  defaultCity: ListingCity;
  phone?: string;
  updatedAt: Date;
}

export const FIELD_LIMITS = {
  idMaxLength: 128,
  idPattern: /^[a-zA-Z0-9_\-]+$/,
  sellerNameMin: 2,
  sellerNameMax: 80,
  titleMin: 4,
  titleMax: 120,
  descriptionMin: 10,
  descriptionMax: 2000,
  districtMax: 60,
  imageUrlMax: 250000,
  priceMin: 0,
  priceMax: 100000000,
  inquiryMessageMin: 2,
  inquiryMessageMax: 1000,
  phoneMax: 30,
} as const;

export const CATEGORY_LABELS: Record<ListingCategory, string> = {
  real_estate: 'عقارات',
  vehicles: 'مركبات',
  electronics: 'إلكترونيات',
  furniture: 'أثاث وديكور',
  appliances: 'أجهزة منزلية',
  fashion: 'أزياء ومقتنيات',
  services: 'خدمات مهنية',
};

export const CITY_LABELS: Record<ListingCity, string> = {
  riyadh: 'الرياض',
  jeddah: 'جدة',
  dammam: 'الدمام',
  makkah: 'مكة المكرمة',
  madinah: 'المدينة المنورة',
  khobar: 'الخبر',
  abha: 'أبها',
  other: 'مدينة أخرى',
};

export const CONDITION_LABELS: Record<ListingCondition, string> = {
  new: 'جديد',
  like_new: 'شبه جديد',
  good: 'مستعمل بحالة جيدة',
  fair: 'مستعمل بحالة مقبولة',
  not_applicable: 'لا ينطبق',
};

export const CURRENCY_LABELS: Record<ListingCurrency, string> = {
  SAR: 'ر.س',
  AED: 'د.إ',
  USD: '$',
};

export const STATUS_LABELS: Record<ListingStatus, string> = {
  active: 'نشط',
  sold: 'تم البيع',
  paused: 'موقوف مؤقتاً',
};

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  open: 'بانتظار الرد',
  replied: 'تم الرد',
  closed: 'مغلق',
};

export function formatPrice(price: number, currency: ListingCurrency): string {
  if (price === 0) {
    return 'على السوم';
  }
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(price);
  return `${formatted} ${CURRENCY_LABELS[currency]}`;
}

export function formatRelativeArabicDate(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMins < 60) {
    return diffMins === 1 ? 'منذ دقيقة' : `منذ ${diffMins} د`;
  }
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return diffHours === 1 ? 'منذ ساعة' : `منذ ${diffHours} س`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return diffDays === 1 ? 'منذ يوم' : `منذ ${diffDays} يوم`;
  }
  return new Intl.DateTimeFormat('ar-SA', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}
