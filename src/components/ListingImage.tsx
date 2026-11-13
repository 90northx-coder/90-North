import { useState } from 'react';
import {
  Building2,
  Car,
  Laptop,
  Armchair,
  Coffee,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { resolveListingImageUrl } from '../data/featuredCatalog';
import { CATEGORY_LABELS, ListingCategory } from '../types/classifieds';

interface ListingImageProps {
  imageUrl: string;
  title: string;
  category: ListingCategory;
  className?: string;
}

function CategoryFallbackIcon({ category }: { category: ListingCategory }) {
  const iconClass = 'w-8 h-8 text-[#57534E]/60';
  switch (category) {
    case 'real_estate':
      return <Building2 className={iconClass} />;
    case 'vehicles':
      return <Car className={iconClass} />;
    case 'electronics':
      return <Laptop className={iconClass} />;
    case 'furniture':
      return <Armchair className={iconClass} />;
    case 'appliances':
      return <Coffee className={iconClass} />;
    case 'fashion':
      return <Sparkles className={iconClass} />;
    case 'services':
      return <Wrench className={iconClass} />;
  }
}

export function ListingImage({
  imageUrl,
  title,
  category,
  className = 'w-full h-full object-cover',
}: ListingImageProps) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = resolveListingImageUrl(imageUrl);

  if (!resolvedSrc || failed) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#F2EFE9] to-[#E6E1D8] flex flex-col items-center justify-center gap-2 p-4 text-center">
        <CategoryFallbackIcon category={category} />
        <span className="text-xs font-medium text-[#57534E]">
          {CATEGORY_LABELS[category]}
        </span>
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={title}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
