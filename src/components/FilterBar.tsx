import {
  CATEGORY_LABELS,
  CITY_LABELS,
  CONDITION_LABELS,
  ListingCategory,
  ListingCity,
  ListingCondition,
} from '../types/classifieds';

export type SortOrder = 'newest' | 'price_asc' | 'price_desc';

interface FilterBarProps {
  selectedCategory: ListingCategory | 'all';
  onCategoryChange: (cat: ListingCategory | 'all') => void;
  selectedCity: ListingCity | 'all';
  onCityChange: (city: ListingCity | 'all') => void;
  selectedCondition: ListingCondition | 'all';
  onConditionChange: (cond: ListingCondition | 'all') => void;
  sortOrder: SortOrder;
  onSortChange: (sort: SortOrder) => void;
  totalCount: number;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

export function FilterBar({
  selectedCategory,
  onCategoryChange,
  selectedCity,
  onCityChange,
  selectedCondition,
  onConditionChange,
  sortOrder,
  onSortChange,
  totalCount,
  hasActiveFilters,
  onResetFilters,
}: FilterBarProps) {
  const categories: (ListingCategory | 'all')[] = [
    'all',
    ...(Object.keys(CATEGORY_LABELS) as ListingCategory[]),
  ];

  return (
    <div className="space-y-4">
      {/* Promotional Banner */}
      <div className="rounded-xl bg-gradient-to-l from-[#0D5C46] via-[#0B4C3A] to-[#163B36] text-white px-5 py-4 sm:px-6 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-white/80">
            الأكثر رواجاً هذا الأسبوع · عقارات ومركبات مختارة
          </p>
          <h2 className="text-base sm:text-lg font-bold text-white leading-snug">
            عروض مميزة في العقارات والسيارات مباشرة من المعلنين
          </h2>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() =>
              onCategoryChange(
                selectedCategory === 'real_estate' ? 'vehicles' : 'real_estate'
              )
            }
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#0D5C46] bg-white hover:bg-[#FAF9F7] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D5C46]"
          >
            {selectedCategory === 'real_estate'
              ? 'تصفح عروض المركبات'
              : 'استكشف عروض العقارات'}
          </button>
        </div>
      </div>

      {/* Segmented Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {categories.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onCategoryChange(cat)}
              className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-[#18181B] text-white'
                  : 'bg-[#F2EFE9] text-[#57534E] hover:text-[#18181B] hover:bg-[#E6E1D8]'
              }`}
            >
              {cat === 'all' ? 'جميع الفئات' : CATEGORY_LABELS[cat]}
            </button>
          );
        })}
      </div>

      {/* Secondary Filter & Sort Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E6E1D8]">
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedCity}
            onChange={(e) => onCityChange(e.target.value as ListingCity | 'all')}
            aria-label="المدينة"
            className="h-10 px-3 text-xs sm:text-sm bg-white border border-[#E6E1D8] rounded-lg text-[#18181B] focus:outline-none focus:border-[#0D5C46]"
          >
            <option value="all">جميع المدن</option>
            {(Object.keys(CITY_LABELS) as ListingCity[]).map((city) => (
              <option key={city} value={city}>
                {CITY_LABELS[city]}
              </option>
            ))}
          </select>

          <select
            value={selectedCondition}
            onChange={(e) =>
              onConditionChange(e.target.value as ListingCondition | 'all')
            }
            aria-label="الحالة"
            className="h-10 px-3 text-xs sm:text-sm bg-white border border-[#E6E1D8] rounded-lg text-[#18181B] focus:outline-none focus:border-[#0D5C46]"
          >
            <option value="all">كل الحالات</option>
            {(Object.keys(CONDITION_LABELS) as ListingCondition[]).map((cond) => (
              <option key={cond} value={cond}>
                {CONDITION_LABELS[cond]}
              </option>
            ))}
          </select>

          <select
            value={sortOrder}
            onChange={(e) => onSortChange(e.target.value as SortOrder)}
            aria-label="ترتيب النتائج"
            className="h-10 px-3 text-xs sm:text-sm bg-white border border-[#E6E1D8] rounded-lg text-[#18181B] focus:outline-none focus:border-[#0D5C46]"
          >
            <option value="newest">الأحدث أولاً</option>
            <option value="price_asc">السعر: من الأقل</option>
            <option value="price_desc">السعر: من الأعلى</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="h-10 px-3 text-xs font-medium text-[#0D5C46] hover:underline whitespace-nowrap cursor-pointer"
            >
              إعادة ضبط الفلاتر
            </button>
          )}
        </div>

        <p className="text-xs sm:text-sm text-[#57534E] tabular-nums">
          {totalCount} {totalCount === 1 ? 'إعلان' : 'إعلاناً'}
        </p>
      </div>
    </div>
  );
}
