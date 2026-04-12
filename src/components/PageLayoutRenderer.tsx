import type { BookPage, BookPhoto } from '@/types/book';
import { MapPin, Calendar } from 'lucide-react';

interface Props {
  page: BookPage;
  onPhotoClick?: (index: number) => void;
  showCaption?: boolean;
}

const Photo = ({ photo, index, onClick }: { photo?: BookPhoto; index: number; onClick?: (i: number) => void }) => {
  const handleClick = onClick ? () => onClick(index) : undefined;
  
  if (!photo) {
    return (
      <div className="w-full h-full bg-muted flex items-center justify-center cursor-pointer" onClick={handleClick}>
        <span className="text-[10px] text-muted-foreground">Tap</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden cursor-pointer" onClick={handleClick}>
      <img src={photo.url} alt="" className="w-full h-full object-cover" />
    </div>
  );
};

const Overlays = ({ page }: { page: BookPage }) => (
  <>
    {/* Date label overlay */}
    {page.dateLabel && (
      <div className="absolute top-2 left-2 z-20 flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-full px-2 py-0.5">
        <Calendar size={10} strokeWidth={1.5} className="text-primary" />
        <span className="text-[9px] font-medium text-foreground">{page.dateLabel}</span>
      </div>
    )}
    {/* Map overlay */}
    {page.mapUrl && (
      <div className="absolute bottom-2 right-2 z-20 w-16 h-16 rounded-lg overflow-hidden border-2 border-background shadow-md">
        <img src={page.mapUrl} alt="Location" className="w-full h-full object-cover" />
        {page.mapPinLabel && (
          <div className="absolute inset-0 flex items-end justify-center pb-0.5">
            <div className="flex items-center gap-0.5 bg-background/90 rounded-full px-1 py-px">
              <MapPin size={7} className="text-primary" />
              <span className="text-[6px] font-medium text-foreground truncate max-w-[40px]">{page.mapPinLabel}</span>
            </div>
          </div>
        )}
      </div>
    )}
  </>
);

const PageLayoutRenderer = ({ page, onPhotoClick, showCaption = true }: Props) => {
  const p = page.photos;
  const click = onPhotoClick;

  const caption = showCaption && page.caption ? (
    <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm px-3 py-1.5 z-10">
      <p className="text-[10px] text-foreground/80">{page.caption}</p>
    </div>
  ) : null;

  const wrap = (children: React.ReactNode, className?: string) => (
    <div className={`w-full h-full relative ${className || ''}`}>
      <Overlays page={page} />
      {children}
      {caption}
    </div>
  );

  switch (page.layout) {
    // ===== 1 PHOTO =====
    case 'full-bleed':
      return wrap(<Photo photo={p[0]} index={0} onClick={click} />);

    case 'matted':
      return wrap(
        <div className="w-full h-full flex items-center justify-center bg-card p-[7.5%]">
          <div className="w-[75%] h-[85%] rounded shadow-lg overflow-hidden">
            <Photo photo={p[0]} index={0} onClick={click} />
          </div>
        </div>
      );

    case 'left-portrait':
      return wrap(
        <div className="w-full h-full flex bg-card">
          <div className="w-[42%] h-full overflow-hidden">
            <Photo photo={p[0]} index={0} onClick={click} />
          </div>
          <div className="flex-1" />
        </div>
      );

    // ===== 2 PHOTOS =====
    case 'split':
      return wrap(
        <div className="w-full h-full flex gap-[2px] bg-background p-[2px]">
          <div className="flex-1 overflow-hidden"><Photo photo={p[0]} index={0} onClick={click} /></div>
          <div className="flex-1 overflow-hidden"><Photo photo={p[1]} index={1} onClick={click} /></div>
        </div>
      );

    case 'hero-detail':
      return wrap(
        <div className="w-full h-full flex gap-[2px] bg-background p-[2px]">
          <div className="w-[65%] overflow-hidden"><Photo photo={p[0]} index={0} onClick={click} /></div>
          <div className="w-[35%] overflow-hidden"><Photo photo={p[1]} index={1} onClick={click} /></div>
        </div>
      );

    case 'two-verticals':
      return wrap(
        <div className="w-full h-full flex items-center justify-center gap-[8%] bg-card px-[12%]">
          <div className="w-[28%] h-[65%] overflow-hidden rounded"><Photo photo={p[0]} index={0} onClick={click} /></div>
          <div className="w-[28%] h-[65%] overflow-hidden rounded"><Photo photo={p[1]} index={1} onClick={click} /></div>
        </div>
      );

    // ===== 3 PHOTOS =====
    case 'triptych':
      return wrap(
        <div className="w-full h-full flex gap-[2px] bg-background p-[2px]">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex-1 overflow-hidden"><Photo photo={p[i]} index={i} onClick={click} /></div>
          ))}
        </div>
      );

    case 'hero-stack':
      return wrap(
        <div className="w-full h-full flex gap-[2px] bg-background p-[2px]">
          <div className="w-[58%] overflow-hidden"><Photo photo={p[0]} index={0} onClick={click} /></div>
          <div className="w-[42%] flex flex-col gap-[2px]">
            <div className="flex-1 overflow-hidden"><Photo photo={p[1]} index={1} onClick={click} /></div>
            <div className="flex-1 overflow-hidden"><Photo photo={p[2]} index={2} onClick={click} /></div>
          </div>
        </div>
      );

    case 'triple-vertical':
      return wrap(
        <div className="w-full h-full flex gap-[4%] bg-card px-[4%] py-0">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex-1 overflow-hidden"><Photo photo={p[i]} index={i} onClick={click} /></div>
          ))}
        </div>
      );

    case 'vert-horiz-pair':
      return wrap(
        <div className="w-full h-full flex gap-[2px] bg-background p-[2px]">
          <div className="w-[40%] overflow-hidden"><Photo photo={p[0]} index={0} onClick={click} /></div>
          <div className="w-[60%] flex flex-col gap-[2px]">
            <div className="flex-1 overflow-hidden"><Photo photo={p[1]} index={1} onClick={click} /></div>
            <div className="flex-1 overflow-hidden"><Photo photo={p[2]} index={2} onClick={click} /></div>
          </div>
        </div>
      );

    case 'landscape-top-two-vert':
      return wrap(
        <div className="w-full h-full flex flex-col gap-[2px] bg-background p-[2px]">
          <div className="h-[50%] overflow-hidden"><Photo photo={p[0]} index={0} onClick={click} /></div>
          <div className="h-[50%] flex gap-[2px]">
            <div className="flex-1 overflow-hidden"><Photo photo={p[1]} index={1} onClick={click} /></div>
            <div className="flex-1 overflow-hidden"><Photo photo={p[2]} index={2} onClick={click} /></div>
          </div>
        </div>
      );

    // ===== 4 PHOTOS =====
    case 'grid-2x2':
      return wrap(
        <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-[2px] bg-background p-[2px]">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="overflow-hidden"><Photo photo={p[i]} index={i} onClick={click} /></div>
          ))}
        </div>
      );

    case 'hero-triptych':
      return wrap(
        <div className="w-full h-full flex gap-[2px] bg-background p-[2px]">
          <div className="w-[62%] overflow-hidden"><Photo photo={p[0]} index={0} onClick={click} /></div>
          <div className="w-[38%] flex flex-col gap-[2px]">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex-1 overflow-hidden"><Photo photo={p[i]} index={i} onClick={click} /></div>
            ))}
          </div>
        </div>
      );

    // ===== 5 PHOTOS =====
    case 'hero-right-stack':
      return wrap(
        <div className="w-full h-full flex gap-[2px] bg-background p-[2px]">
          <div className="w-[58%] overflow-hidden"><Photo photo={p[0]} index={0} onClick={click} /></div>
          <div className="w-[42%] flex flex-col gap-[2px]">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex-1 overflow-hidden"><Photo photo={p[i]} index={i} onClick={click} /></div>
            ))}
          </div>
        </div>
      );

    case 'two-large-three-wide':
      return wrap(
        <div className="w-full h-full flex flex-col gap-[2px] bg-background p-[2px]">
          <div className="h-[50%] flex gap-[2px]">
            <div className="flex-1 overflow-hidden"><Photo photo={p[0]} index={0} onClick={click} /></div>
            <div className="flex-1 overflow-hidden"><Photo photo={p[1]} index={1} onClick={click} /></div>
          </div>
          <div className="h-[50%] flex gap-[2px]">
            {[2, 3, 4].map(i => (
              <div key={i} className="flex-1 overflow-hidden"><Photo photo={p[i]} index={i} onClick={click} /></div>
            ))}
          </div>
        </div>
      );

    // ===== 6 PHOTOS =====
    case 'grid-3x2':
      return wrap(
        <div className="w-full h-full grid grid-cols-3 grid-rows-2 gap-[2px] bg-background p-[2px]">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className="overflow-hidden"><Photo photo={p[i]} index={i} onClick={click} /></div>
          ))}
        </div>
      );

    case 'hero-mixed-stack':
      return wrap(
        <div className="w-full h-full flex gap-[2px] bg-background p-[2px]">
          <div className="w-[58%] overflow-hidden"><Photo photo={p[0]} index={0} onClick={click} /></div>
          <div className="w-[42%] flex flex-col gap-[2px]">
            <div className="flex-1 overflow-hidden"><Photo photo={p[1]} index={1} onClick={click} /></div>
            <div className="flex-1 overflow-hidden"><Photo photo={p[2]} index={2} onClick={click} /></div>
            <div className="flex-1 flex gap-[2px]">
              {[3, 4, 5].map(i => (
                <div key={i} className="flex-1 overflow-hidden"><Photo photo={p[i]} index={i} onClick={click} /></div>
              ))}
            </div>
          </div>
        </div>
      );

    default:
      return wrap(<Photo photo={p[0]} index={0} onClick={click} />);
  }
};

export default PageLayoutRenderer;
