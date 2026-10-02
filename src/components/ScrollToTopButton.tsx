import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

interface ScrollToTopButtonProps {
  label?: string;
}

export const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({ 
  label = 'Kembali ke atas' 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 280) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      title={label}
      aria-label={label}
      className="fixed bottom-6 right-6 z-40 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-white dark:bg-[#131b2e] text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-900/10 dark:shadow-violet-950/40 hover:border-violet-400 dark:hover:border-violet-500 hover:text-violet-600 dark:hover:text-violet-400 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer animate-in fade-in slide-in-from-bottom-3"
    >
      <ArrowUp className="h-5 w-5 stroke-[2.5]" />
    </button>
  );
};
