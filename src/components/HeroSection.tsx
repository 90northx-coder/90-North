import { FormEvent } from 'react';
import { Search } from 'lucide-react';
import { HERO_SHOWCASE_IMAGE } from '../data/featuredCatalog';
import {
  CATEGORY_LABELS,
  CITY_LABELS,
  ListingCategory,
  ListingCity,
} from '../types/classifieds';

interface HeroSectionProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedCategory: ListingCategory | 'all';
  onCategoryChange: (cat: ListingCategory | 'all') => void;
  selectedCity: ListingCity | 'all';
  onCityChange: (city: ListingCity | 'all') => void;
  onScrollToResults: () => void;
}

export function HeroSection({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedCity,
  onCityChange,
  onScrollToResults,
}: HeroSectionProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onScrollToResults();
  };

  return (
    <section className="border-b border-[#E6E1D8] bg-[#F2EFE9]/55">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* Editorial Search Column */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-8">
            <div className="space-y-4">
              <p className="text-xs font-medium text-[#57534E]">
                سوق الإعلانات المبوبة الموثوق · عقارات · مركبات · إلكترونيات · أثاث
              </p>
              <h1
                className="text-3xl sm:text-4xl lg:text-[2.65rem] font-bold text-[#18181B] leading-[1.22] tracking-tight"
                style={{ textWrap: 'balance' }}
              >
                اعثر على ما تبحث عنه، أو اعرض مقتنياتك للمهتمين مباشرة.
              </h1>
              <p className="text-base text-[#57534E] leading-relaxed max-w-xl">
                منصة مبوبة واضحة ومنظمة تربط البائعين والمشترين في مختلف المدن، مع
                تصفح فوري حسب الفئة والمنطقة ومراسلة مباشرة داخل المنصة.
              </p>
            </div>

            {/* Integrated Search Box */}
            <form
              onSubmit={handleSubmit}
              className="bg-white border border-[#E6E1D8] rounded-xl p-3 shadow-xs grid grid-cols-1 sm:grid-cols-12 gap-2.5"
            >
              <div className="sm:col-span-5 relative flex items-center">
                <Search className="w-4 h-4 text-[#57534E] absolute right-3 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="ابحث عن شقة، سيارة، كاميرا..."
                  aria-label="كلمة البحث"
                  className="w-full h-11 pr-9 pl-3 text-sm bg-[#FAF9F7] border border-[#E6E1D8] rounded-lg text-[#18181B] placeholder:text-[#78716C] focus:outline-none focus:border-[#0D5C46]"
                />
              </div>

              <div className="sm:col-span-3">
                <select
                  value={selectedCategory}
                  onChange={(e) =>
                    onCategoryChange(e.target.value as ListingCategory | 'all')
                  }
                  aria-label="تصفية حسب الفئة"
                  className="w-full h-11 px-3 text-sm bg-[#FAF9F7] border border-[#E6E1D8] rounded-lg text-[#18181B] focus:outline-none focus:border-[#0D5C46]"
                >
                  <option value="all">كل الفئات</option>
                  {(Object.keys(CATEGORY_LABELS) as ListingCategory[]).map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <select
                  value={selectedCity}
                  onChange={(e) =>
                    onCityChange(e.target.value as ListingCity | 'all')
                  }
                  aria-label="تصفية حسب المدينة"
                  className="w-full h-11 px-2.5 text-sm bg-[#FAF9F7] border border-[#E6E1D8] rounded-lg text-[#18181B] focus:outline-none focus:border-[#0D5C46]"
                >
                  <option value="all">كل المدن</option>
                  {(Object.keys(CITY_LABELS) as ListingCity[]).map((city) => (
                    <option key={city} value={city}>
                      {CITY_LABELS[city]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="w-full h-11 px-4 text-sm font-semibold text-white bg-[#0D5C46] hover:bg-[#094333] rounded-lg transition-colors duration-150 whitespace-nowrap cursor-pointer"
                >
                  بحث
                </button>
              </div>
            </form>
          </div>

          {/* Editorial Showcase Image Column */}
          <div className="lg:col-span-5">
            <div className="h-64 sm:h-72 lg:h-full min-h-[260px] rounded-xl overflow-hidden border border-[#E6E1D8] bg-[#E6E1D8]">
              <img
                src={HERO_SHOWCASE_IMAGE}
                alt="مختارات معمارية ومنزلية في مبوبة المدار"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
