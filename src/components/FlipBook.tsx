import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { BookPage } from '@/types/book';
import PageRenderer from './PageRenderer';

interface FlipBookProps {
  pages: BookPage[];
  title: string;
}

const FlipBook = ({ pages, title }: FlipBookProps) => {
  const [currentPage, setCurrentPage] = useState(-1); // -1 = cover
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next');

  const totalPages = pages.length;

  const flip = (direction: 'next' | 'prev') => {
    if (isFlipping) return;
    setFlipDirection(direction);
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentPage(prev =>
        direction === 'next'
          ? Math.min(prev + 1, totalPages - 1)
          : Math.max(prev - 1, -1)
      );
      setIsFlipping(false);
    }, 400);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Book container */}
      <div className="relative" style={{ perspective: '1200px' }}>
        <div
          className="w-72 h-72 sm:w-80 sm:h-80 rounded-lg overflow-hidden book-shadow bg-white relative"
          style={{
            transformStyle: 'preserve-3d',
            transition: 'transform 0.4s ease-in-out',
            transform: isFlipping
              ? flipDirection === 'next'
                ? 'rotateY(-15deg)'
                : 'rotateY(15deg)'
              : 'rotateY(0deg)',
          }}
        >
          {currentPage === -1 ? (
            /* Cover — show first page in cover layout, or a default */
            <div className="w-full h-full bg-primary flex flex-col items-center justify-center p-8">
              <h2 className="text-primary-foreground text-xl font-semibold text-center">{title}</h2>
              <p className="text-primary-foreground/60 text-xs mt-2 tracking-widest uppercase">Snapora</p>
            </div>
          ) : (
            <PageRenderer page={pages[currentPage]} title={title} />
          )}

          {/* Page edge effect */}
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-l from-foreground/5 to-transparent pointer-events-none" />
        </div>

        {/* Shadow under book */}
        <div className="w-64 h-4 mx-auto mt-2 bg-foreground/5 rounded-full blur-md" />
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-6">
        <button
          onClick={() => flip('prev')}
          disabled={currentPage === -1 || isFlipping}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
        >
          <ChevronLeft size={20} strokeWidth={1.5} />
        </button>

        <span className="text-xs text-muted-foreground tabular-nums min-w-[80px] text-center">
          {currentPage === -1 ? 'Cover' : `${currentPage + 1} of ${totalPages}`}
        </span>

        <button
          onClick={() => flip('next')}
          disabled={currentPage === totalPages - 1 || isFlipping}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
        >
          <ChevronRight size={20} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
};

export default FlipBook;
