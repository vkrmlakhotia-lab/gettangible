import type { BookPage, BookPhoto } from '@/types/book'

interface PageRendererProps {
  page: BookPage
  title?: string            // used for cover layout
  onPhotoClick?: (index: number) => void
  interactive?: boolean     // shows tap affordance when true
}

interface PhotoSlotProps {
  photo?: BookPhoto
  onClick?: () => void
  className?: string
  objectPosition?: string
}

const PhotoSlot = ({ photo, onClick, className = '', objectPosition = 'center' }: PhotoSlotProps) => (
  <div
    className={`overflow-hidden bg-muted ${onClick ? 'cursor-pointer' : ''} ${className}`}
    onClick={onClick}
  >
    {photo ? (
      <img
        src={photo.url}
        alt=""
        className="w-full h-full object-cover"
        style={{ objectPosition }}
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-[10px] text-muted-foreground">{onClick ? 'Tap to add' : ''}</span>
      </div>
    )}
  </div>
)

const Divider = () => (
  <div className="flex items-center gap-2 my-2">
    <div className="h-px bg-foreground/20 w-8" />
  </div>
)

const PageRenderer = ({ page, title, onPhotoClick, interactive }: PageRendererProps) => {
  const click = (i: number) => onPhotoClick ? () => onPhotoClick(i) : undefined
  const p = page.photos

  switch (page.layout) {

    // ── Photos Only ───────────────────────────────────────────

    case 'full-bleed':
    case '1-up':
      return (
        <PhotoSlot photo={p[0]} onClick={click(0)} className="w-full h-full" />
      )

    case 'single-bordered':
      return (
        <div className="w-full h-full bg-white flex items-center justify-center p-6">
          <PhotoSlot photo={p[0]} onClick={click(0)} className="w-full h-full rounded" />
        </div>
      )

    case 'two-stacked':
      return (
        <div className="w-full h-full flex flex-col gap-0.5 bg-white">
          <PhotoSlot photo={p[0]} onClick={click(0)} className="flex-1" />
          <PhotoSlot photo={p[1]} onClick={click(1)} className="flex-1" />
        </div>
      )

    case 'two-side':
    case '2-up':
      return (
        <div className="w-full h-full flex flex-row gap-0.5 bg-white">
          <PhotoSlot photo={p[0]} onClick={click(0)} className="flex-1" />
          <PhotoSlot photo={p[1]} onClick={click(1)} className="flex-1" />
        </div>
      )

    case 'three-mixed':
    case '3-up':
      return (
        <div className="w-full h-full flex flex-col gap-0.5 bg-white">
          <PhotoSlot photo={p[0]} onClick={click(0)} className="flex-[3]" />
          <div className="flex flex-row gap-0.5 flex-[2]">
            <PhotoSlot photo={p[1]} onClick={click(1)} className="flex-1" />
            <PhotoSlot photo={p[2]} onClick={click(2)} className="flex-1" />
          </div>
        </div>
      )

    case 'four-grid':
      return (
        <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-0.5 bg-white">
          {[0, 1, 2, 3].map(i => (
            <PhotoSlot key={i} photo={p[i]} onClick={click(i)} className="w-full h-full" />
          ))}
        </div>
      )

    case 'five-collage':
      return (
        <div className="w-full h-full flex flex-col gap-0.5 bg-white">
          <div className="flex flex-row gap-0.5 flex-1">
            <PhotoSlot photo={p[0]} onClick={click(0)} className="flex-1" />
            <PhotoSlot photo={p[1]} onClick={click(1)} className="flex-1" />
          </div>
          <div className="flex flex-row gap-0.5 flex-1">
            <PhotoSlot photo={p[2]} onClick={click(2)} className="flex-1" />
            <PhotoSlot photo={p[3]} onClick={click(3)} className="flex-1" />
            <PhotoSlot photo={p[4]} onClick={click(4)} className="flex-1" />
          </div>
        </div>
      )

    // ── Photos & Text ─────────────────────────────────────────

    case 'photo-caption-below':
      return (
        <div className="w-full h-full bg-white flex flex-col">
          <PhotoSlot photo={p[0]} onClick={click(0)} className="flex-[3]" />
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-2">
            {page.caption && (
              <p className="text-[11px] text-foreground/70 text-center font-light tracking-wide leading-relaxed">
                {page.caption}
              </p>
            )}
            {!page.caption && interactive && (
              <p className="text-[10px] text-muted-foreground">Add a caption</p>
            )}
          </div>
        </div>
      )

    case 'photo-caption-above':
      return (
        <div className="w-full h-full bg-white flex flex-col">
          <div className="flex-1 flex flex-col items-start justify-center px-5 py-2">
            {page.caption ? (
              <>
                <p className="text-xs font-semibold text-foreground tracking-widest uppercase">
                  {page.caption.split('\n')[0]}
                </p>
                <Divider />
                {page.caption.split('\n')[1] && (
                  <p className="text-[10px] text-foreground/60 leading-relaxed">
                    {page.caption.split('\n')[1]}
                  </p>
                )}
              </>
            ) : interactive ? (
              <p className="text-[10px] text-muted-foreground">Add a title</p>
            ) : null}
          </div>
          <PhotoSlot photo={p[0]} onClick={click(0)} className="flex-[3]" />
        </div>
      )

    case 'text-left-photo-right':
      return (
        <div className="w-full h-full bg-white flex flex-row">
          <div className="flex-1 flex flex-col items-start justify-center px-4 py-4">
            {page.caption ? (
              <>
                <p className="text-xs font-semibold text-foreground tracking-widest uppercase leading-snug">
                  {page.caption.split('\n')[0]}
                </p>
                <Divider />
                {page.caption.split('\n')[1] && (
                  <p className="text-[9px] text-foreground/60 leading-relaxed">
                    {page.caption.split('\n')[1]}
                  </p>
                )}
              </>
            ) : interactive ? (
              <p className="text-[10px] text-muted-foreground">Add text</p>
            ) : null}
          </div>
          <PhotoSlot photo={p[0]} onClick={click(0)} className="flex-[2]" />
        </div>
      )

    case 'photo-left-text-right':
      return (
        <div className="w-full h-full bg-white flex flex-row">
          <PhotoSlot photo={p[0]} onClick={click(0)} className="flex-[2]" />
          <div className="flex-1 flex flex-col items-start justify-end px-4 py-4">
            {page.caption ? (
              <>
                <Divider />
                <p className="text-[9px] text-foreground/60 leading-relaxed">
                  {page.caption}
                </p>
              </>
            ) : interactive ? (
              <p className="text-[10px] text-muted-foreground">Add text</p>
            ) : null}
          </div>
        </div>
      )

    // ── Text Only ─────────────────────────────────────────────

    case 'text-only':
      return (
        <div className="w-full h-full bg-white flex flex-col items-center justify-center px-8 text-center">
          {page.caption ? (
            <>
              <p className="text-sm font-semibold text-foreground tracking-wide">
                {page.caption.split('\n')[0]}
              </p>
              <Divider />
              {page.caption.split('\n')[1] && (
                <p className="text-[10px] text-foreground/50 leading-relaxed max-w-[200px]">
                  {page.caption.split('\n')[1]}
                </p>
              )}
            </>
          ) : (
            <p className="text-[10px] text-muted-foreground">
              {interactive ? 'Add title text via Caption' : ''}
            </p>
          )}
        </div>
      )

    // ── Cover ─────────────────────────────────────────────────

    case 'cover':
      return (
        <div className="w-full h-full relative">
          <PhotoSlot photo={p[0]} onClick={click(0)} className="w-full h-full" />
          <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm px-5 py-4">
            <p className="text-sm font-semibold text-foreground tracking-widest uppercase">
              {title || page.caption?.split('\n')[0] || 'My Photobook'}
            </p>
            {page.caption?.split('\n')[1] && (
              <p className="text-[10px] text-foreground/50 mt-0.5 tracking-wide">
                {page.caption.split('\n')[1]}
              </p>
            )}
          </div>
        </div>
      )

    default:
      return (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Unknown layout</span>
        </div>
      )
  }
}

export default PageRenderer
