import heroShowcaseImg from '../assets/images/hero_classifieds_showcase_1794586104854.jpg';
import apartmentImg from '../assets/images/ad_apartment_riyadh_1794586104637.jpg';
import sedanCarImg from '../assets/images/ad_sedan_car_1794586105214.jpg';
import cameraImg from '../assets/images/ad_mirrorless_camera_1794586104138.jpg';
import leatherSofaImg from '../assets/images/ad_leather_sofa_1794586105358.jpg';
import espressoImg from '../assets/images/ad_espresso_machine_1794586105903.jpg';
import { Listing, ListingCategory } from '../types/classifieds';

export const HERO_SHOWCASE_IMAGE = heroShowcaseImg;

export const PRESET_IMAGE_MAP: Record<string, string> = {
  'preset:apartment': apartmentImg,
  'preset:sedan': sedanCarImg,
  'preset:camera': cameraImg,
  'preset:sofa': leatherSofaImg,
  'preset:espresso': espressoImg,
  'preset:showcase': heroShowcaseImg,
};

export const PRESET_IMAGE_OPTIONS: {
  key: string;
  label: string;
  category: ListingCategory;
  src: string;
}[] = [
  { key: 'preset:apartment', label: 'عقار وشقق', category: 'real_estate', src: apartmentImg },
  { key: 'preset:sedan', label: 'سيارة سيدان', category: 'vehicles', src: sedanCarImg },
  { key: 'preset:camera', label: 'كاميرا وعدسات', category: 'electronics', src: cameraImg },
  { key: 'preset:sofa', label: 'أثاث وصالة', category: 'furniture', src: leatherSofaImg },
  { key: 'preset:espresso', label: 'جهاز قهوة', category: 'appliances', src: espressoImg },
  { key: 'preset:showcase', label: 'مقتنيات ومنزل', category: 'fashion', src: heroShowcaseImg },
];

export function resolveListingImageUrl(imageUrl: string): string {
  if (!imageUrl) return '';
  if (imageUrl in PRESET_IMAGE_MAP) {
    return PRESET_IMAGE_MAP[imageUrl];
  }
  return imageUrl;
}

const now = Date.now();

export const DEMO_FEATURED_LISTINGS: Listing[] = [
  {
    id: 'demo-riyadh-apartment',
    ownerId: 'demo-seller-1',
    sellerName: 'مكتب آفاق العقاري',
    title: 'شقة حديثة بإطلالة مفتوحة وتراس واسع — حي الياسمين',
    description:
      'شقة سكنية بتشطيب معماري هادئ ومساحة 168 متر مربع، تضم صالة معيشة مضيئة بنوافذ ممتدة، ثلاث غرف نوم إحداها ماستر، مطبخ مجهز بالكامل، وموقف سيارة خاص في القبو. قريبة من الطرق الرئيسية والخدمات.',
    category: 'real_estate',
    city: 'riyadh',
    district: 'حي الياسمين',
    condition: 'like_new',
    price: 1180000,
    currency: 'SAR',
    negotiable: true,
    imageUrl: 'preset:apartment',
    status: 'active',
    createdAt: new Date(now - 2 * 60 * 60 * 1000),
    updatedAt: new Date(now - 2 * 60 * 60 * 1000),
    isDemo: true,
  },
  {
    id: 'demo-executive-sedan',
    ownerId: 'demo-seller-2',
    sellerName: 'سعد القحطاني',
    title: 'سيدان تنفيذية رمادي ميتاليك موديل 2023 — ممشى 24 ألف كم',
    description:
      'سيارة بحالة الوكالة، صيانة دورية منتظمة في الوكالة، خالية تماماً من الحوادث أو الرش. تشمل سقف بانوراما، كاميرات محيطية 360 درجة، نظام قيادة شبه ذاتية، وحماية كاملة للواجهة.',
    category: 'vehicles',
    city: 'jeddah',
    district: 'حي الشاطئ',
    condition: 'like_new',
    price: 265000,
    currency: 'SAR',
    negotiable: true,
    imageUrl: 'preset:sedan',
    status: 'active',
    createdAt: new Date(now - 5 * 60 * 60 * 1000),
    updatedAt: new Date(now - 5 * 60 * 60 * 1000),
    isDemo: true,
  },
  {
    id: 'demo-mirrorless-camera',
    ownerId: 'demo-seller-3',
    sellerName: 'نورة السبيعي',
    title: 'كاميرا احترافية بدون مرآة مع عدسة 35mm f/1.8 نظيفة جداً',
    description:
      'مناسبة للتصوير المعماري والمنتجات والفيديو بدقة 4K. عدد اللقطات أقل من 4,200 لقطة فقط. تأتي مع الكرتون الأصلي، بطاريتين أصليتين، شاحن مزدوج، وحقيبة حماية.',
    category: 'electronics',
    city: 'khobar',
    district: 'العقربية',
    condition: 'like_new',
    price: 6850,
    currency: 'SAR',
    negotiable: false,
    imageUrl: 'preset:camera',
    status: 'active',
    createdAt: new Date(now - 9 * 60 * 60 * 1000),
    updatedAt: new Date(now - 9 * 60 * 60 * 1000),
    isDemo: true,
  },
  {
    id: 'demo-cognac-sofa',
    ownerId: 'demo-seller-4',
    sellerName: 'دار التصميم للأثاث',
    title: 'كنبة جلد طبيعي ثلاثية المقاعد بتصميم اسكندنافي',
    description:
      'كنبة جلد طبيعي بلون كونياك دافئ وقواعد ستانلس ستيل مصقول، استخدام خفيف لمدة 6 أشهر في مجلس ضيافة. مريحة وعملية وسهلة العناية، المقاس 220 × 90 سم.',
    category: 'furniture',
    city: 'riyadh',
    district: 'حي النرجس',
    condition: 'like_new',
    price: 5400,
    currency: 'SAR',
    negotiable: true,
    imageUrl: 'preset:sofa',
    status: 'active',
    createdAt: new Date(now - 18 * 60 * 60 * 1000),
    updatedAt: new Date(now - 18 * 60 * 60 * 1000),
    isDemo: true,
  },
  {
    id: 'demo-espresso-machine',
    ownerId: 'demo-seller-5',
    sellerName: 'فهد الدوسري',
    title: 'ماكينة إسبريسو احترافية غلاية مزدوجة مع إكسسوارات خشب الجوز',
    description:
      'ماكينة إسبريسو بهيكل ستانلس ستيل ومقابض من خشب الجوز الطبيعي، تحكم دقيق بدرجة الحرارة PID ومضخة دوارة هادئة. تشمل بورتافلتر مكشوف ومكبس ومعاير توزيع.',
    category: 'appliances',
    city: 'dammam',
    district: 'حي الشاطئ الغربي',
    condition: 'good',
    price: 7200,
    currency: 'SAR',
    negotiable: true,
    imageUrl: 'preset:espresso',
    status: 'active',
    createdAt: new Date(now - 28 * 60 * 60 * 1000),
    updatedAt: new Date(now - 28 * 60 * 60 * 1000),
    isDemo: true,
  },
  {
    id: 'demo-interior-curation',
    ownerId: 'demo-seller-6',
    sellerName: 'استوديو مدار للديكور',
    title: 'خدمات تصميم داخلي وإعادة تأهيل الشقق والمكاتب — تسليم مفتاح',
    description:
      'تقديم تصاميم ثلاثية الأبعاد، اختيار المواد والأثاث، والإشراف الكامل على التنفيذ السكني والتجاري في الرياض وجدة والمنطقة الشرقية بأسلوب معماري معاصر.',
    category: 'services',
    city: 'riyadh',
    district: 'حي الملقا',
    condition: 'not_applicable',
    price: 0,
    currency: 'SAR',
    negotiable: true,
    imageUrl: 'preset:showcase',
    status: 'active',
    createdAt: new Date(now - 42 * 60 * 60 * 1000),
    updatedAt: new Date(now - 42 * 60 * 60 * 1000),
    isDemo: true,
  },
];
