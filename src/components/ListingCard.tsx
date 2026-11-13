import { Heart } from 'lucide-react';
import {
  CATEGORY_LABELS,
  CITY_LABELS,
  formatPrice,
  formatRelativeArabicDate,
  Listing,
} from '../types/classifieds';
import { ListingImage } from './ListingImage';

interface ListingCardProps {
  listing: Listing;
  isFavorite: boolean;
  onToggleFavorite: (listing: Listing) => void;
  onSelect: (listing: Listing) => void;
}

export function ListingCard({
  listing,
  isFavorite,
  onToggleFavorite,
  onSelect,
}: ListingCardProps) {
  return (
    <article className="group bg-white border border-[#E6E1D8] rounded-xl overflow-hidden flex flex-col transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-md">
      {/* 4:3 Image Slot */}
      <div className="relative aspect-[4/3] bg-[#F2EFE9] overflow-hidden">
        <button
          type="button"
          onClick={() => onSelect(listing)}
          className="w-full h-full block text-right cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0D5C46]"
          aria-label={`عرض تفاصيل ${listing.title}`}
        >
          <ListingImage
            imageUrl={listing.imageUrl}
            title={listing.title}
            category={listing.category}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(listing);
          }}
          aria-label={isFavorite ? 'إزالة من المحفوظات' : 'حفظ في المحفوظات'}
          aria-pressed={isFavorite}
          className={`absolute top-3 left-3 w-10 h-10 rounded-lg flex items-center justify-center border transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D5C46] ${
            isFavorite
              ? 'bg-[#0D5C46] text-white border-[#0D5C46]'
              : 'bg-white/95 text-[#18181B] border-[#E6E1D8] hover:bg-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Card Body — Zero-pill clean metadata + title + tabular price */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-[#57534E] truncate">
            <span>{CATEGORY_LABELS[listing.category]}</span>
            <span aria-hidden="true">·</span>
            <span>{CITY_LABELS[listing.city]}</span>
            <span aria-hidden="true">·</span>
            <span>{formatRelativeArabicDate(listing.createdAt)}</span>
          </div>

          <h3 className="text-base font-semibold text-[#18181B] leading-snug line-clamp-2">
            <button
              type="button"
              onClick={() => onSelect(listing)}
              className="text-right hover:text-[#0D5C46] transition-colors cursor-pointer"
            >
              {listing.title}
            </button>
          </h3>
        </div>

        <div className="pt-2 border-t border-[#F2EFE9] flex items-baseline justify-between gap-2">
          <span className="text-base font-bold text-[#0D5C46] tabular-nums">
            {formatPrice(listing.price, listing.currency)}
          </span>
          <span className="text-xs text-[#57534E] truncate">
            {listing.negotiable && listing.price > 0 ? 'قابل للتفاوض' : listing.sellerName}
          </span>
        </div>
      </div>
    </article>
  );
}
