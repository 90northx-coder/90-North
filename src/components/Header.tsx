import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { User } from 'firebase/auth';

export type ActiveView = 'browse' | 'my_ads' | 'favorites' | 'inquiries' | 'profile';

interface HeaderProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  onOpenPostModal: () => void;
  user: User | null;
  onSignIn: () => void;
  unreadInquiriesCount: number;
}

export function Header({
  activeView,
  onNavigate,
  onOpenPostModal,
  user,
  onSignIn,
  unreadInquiriesCount,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (view: ActiveView) => {
    setMobileMenuOpen(false);
    onNavigate(view);
  };

  const navLinkClass = (view: ActiveView) =>
    `text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 py-1 border-b-2 ${
      activeView === view
        ? 'text-[#0D5C46] border-[#0D5C46]'
        : 'text-[#57534E] border-transparent hover:text-[#18181B] hover:border-[#D6D0C4]'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F7]/95 backdrop-blur-sm border-b border-[#E6E1D8]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element brand wordmark */}
        <button
          type="button"
          onClick={() => handleNavClick('browse')}
          className="text-xl font-bold tracking-tight text-[#18181B] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D5C46] rounded-sm"
        >
          المدار
        </button>

        {/* Zone 2: Concise single-line nav links */}
        <nav
          aria-label="التنقل الرئيسي"
          className="hidden md:flex items-center gap-6"
        >
          <button
            type="button"
            onClick={() => handleNavClick('browse')}
            className={navLinkClass('browse')}
          >
            تصفح الإعلانات
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('my_ads')}
            className={navLinkClass('my_ads')}
          >
            إعلاناتي
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('favorites')}
            className={navLinkClass('favorites')}
          >
            المحفوظات
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('inquiries')}
            className={navLinkClass('inquiries')}
          >
            {unreadInquiriesCount > 0
              ? `الرسائل (${unreadInquiriesCount})`
              : 'الرسائل'}
          </button>
          {user ? (
            <button
              type="button"
              onClick={() => handleNavClick('profile')}
              className={navLinkClass('profile')}
            >
              حسابي
            </button>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              className="text-sm font-medium text-[#57534E] hover:text-[#18181B] transition-colors duration-150 whitespace-nowrap shrink-0 py-1 cursor-pointer"
            >
              تسجيل الدخول
            </button>
          )}
        </nav>

        {/* Zone 3: Single primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenPostModal}
            className="px-4 py-2 text-sm font-semibold text-white bg-[#0D5C46] hover:bg-[#094333] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D5C46] focus-visible:ring-offset-2"
          >
            أضف إعلانك
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg border border-[#E6E1D8] text-[#18181B] hover:bg-[#F2EFE9] transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E6E1D8] bg-[#FAF9F7] px-4 py-3 flex flex-col gap-1">
          <button
            type="button"
            onClick={() => handleNavClick('browse')}
            className="text-right px-3 py-2.5 rounded-lg text-sm font-medium text-[#18181B] hover:bg-[#F2EFE9]"
          >
            تصفح الإعلانات
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('my_ads')}
            className="text-right px-3 py-2.5 rounded-lg text-sm font-medium text-[#18181B] hover:bg-[#F2EFE9]"
          >
            إعلاناتي
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('favorites')}
            className="text-right px-3 py-2.5 rounded-lg text-sm font-medium text-[#18181B] hover:bg-[#F2EFE9]"
          >
            المحفوظات
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('inquiries')}
            className="text-right px-3 py-2.5 rounded-lg text-sm font-medium text-[#18181B] hover:bg-[#F2EFE9]"
          >
            {unreadInquiriesCount > 0 ? `الرسائل (${unreadInquiriesCount})` : 'الرسائل'}
          </button>
          {user ? (
            <button
              type="button"
              onClick={() => handleNavClick('profile')}
              className="text-right px-3 py-2.5 rounded-lg text-sm font-medium text-[#18181B] hover:bg-[#F2EFE9]"
            >
              حسابي
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onSignIn();
              }}
              className="text-right px-3 py-2.5 rounded-lg text-sm font-medium text-[#0D5C46] hover:bg-[#F2EFE9]"
            >
              تسجيل الدخول بحساب جوجل
            </button>
          )}
        </div>
      )}
    </header>
  );
}
