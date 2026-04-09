import { useState, useCallback } from "react";
import { Plus, LayoutGrid, ArrowLeftRight, GripVertical } from "lucide-react";
import { PhotoEvent, Photo } from "@/data/samplePhotos";
import { cn } from "@/lib/utils";

interface PhotobookPreviewProps {
  events: PhotoEvent[];
  title: string;
  subtitle: string;
  onTitleChange: (val: string) => void;
  onSubtitleChange: (val: string) => void;
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

const Img = ({ src }: { src: string }) => (
  <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
);

/* ── Layout types ────────────────────────────────── */

type LayoutType = "full" | "matted" | "hero-detail" | "3-portrait" | "portrait-landscape" | "2-stack" | "1top-2bottom";

const LAYOUT_OPTIONS: { id: LayoutType; label: string; icon: string }[] = [
  { id: "full", label: "Full bleed", icon: "▣" },
  { id: "matted", label: "Matted", icon: "◻" },
  { id: "2-stack", label: "2 Stack", icon: "▥" },
  { id: "hero-detail", label: "Hero + Detail", icon: "▤" },
  { id: "3-portrait", label: "3 Portrait", icon: "▦" },
  { id: "portrait-landscape", label: "Portrait + 2", icon: "▧" },
  { id: "1top-2bottom", label: "1 + 2", icon: "▩" },
];

/* ── Single-page layouts ─────────────────────────── */

const Page1 = ({ photos }: { photos: Photo[] }) => (
  <div className="w-full h-full"><Img src={photos[0].url} /></div>
);

const PageMatted = ({ photos }: { photos: Photo[] }) => (
  <div className="w-full h-full flex items-center justify-center bg-white">
    <div className="w-[72%] h-[78%] shadow-[0_2px_8px_rgba(0,0,0,0.1)] overflow-hidden rounded-sm">
      <Img src={photos[0].url} />
    </div>
  </div>
);

const PageHeroDetail = ({ photos }: { photos: Photo[] }) => (
  <div className="flex gap-[2px] h-full w-full">
    <div className="w-[63%] h-full overflow-hidden"><Img src={photos[0].url} /></div>
    <div className="w-[37%] h-full overflow-hidden"><Img src={photos[Math.min(1, photos.length - 1)].url} /></div>
  </div>
);

const Page3Portraits = ({ photos }: { photos: Photo[] }) => (
  <div className="flex gap-[2px] h-full w-full">
    {photos.slice(0, 3).map((p) => (
      <div key={p.id} className="flex-1 h-full overflow-hidden"><Img src={p.url} /></div>
    ))}
  </div>
);

const PagePortraitAndLandscapes = ({ photos }: { photos: Photo[] }) => (
  <div className="flex gap-[2px] h-full w-full">
    <div className="w-[40%] h-full overflow-hidden"><Img src={photos[0].url} /></div>
    <div className="w-[60%] h-full flex flex-col gap-[2px]">
      <div className="flex-1 overflow-hidden"><Img src={photos[Math.min(1, photos.length - 1)].url} /></div>
      <div className="flex-1 overflow-hidden"><Img src={photos[Math.min(2, photos.length - 1)].url} /></div>
    </div>
  </div>
);

const Page2Stack = ({ photos }: { photos: Photo[] }) => (
  <div className="flex flex-col gap-[2px] h-full w-full">
    <div className="flex-1 overflow-hidden"><Img src={photos[0].url} /></div>
    <div className="flex-1 overflow-hidden"><Img src={photos[Math.min(1, photos.length - 1)].url} /></div>
  </div>
);

const Page1Top2Bottom = ({ photos }: { photos: Photo[] }) => (
  <div className="flex flex-col gap-[2px] h-full w-full">
    <div className="flex-1 overflow-hidden"><Img src={photos[0].url} /></div>
    <div className="flex-1 flex gap-[2px]">
      <div className="flex-1 overflow-hidden"><Img src={photos[Math.min(1, photos.length - 1)].url} /></div>
      <div className="flex-1 overflow-hidden"><Img src={photos[Math.min(2, photos.length - 1)].url} /></div>
    </div>
  </div>
);

const PageEmpty = () => <div className="w-full h-full bg-muted/20" />;

/* ── Render a page by layout type ────────────────── */

const renderPage = (layout: LayoutType, photos: Photo[]): React.ReactNode => {
  if (photos.length === 0) return <PageEmpty />;
  switch (layout) {
    case "full": return <Page1 photos={photos} />;
    case "matted": return <PageMatted photos={photos} />;
    case "hero-detail": return <PageHeroDetail photos={photos} />;
    case "3-portrait": return photos.length >= 3 ? <Page3Portraits photos={photos} /> : <Page1 photos={photos} />;
    case "portrait-landscape": return photos.length >= 3 ? <PagePortraitAndLandscapes photos={photos} /> : <Page1 photos={photos} />;
    case "2-stack": return photos.length >= 2 ? <Page2Stack photos={photos} /> : <Page1 photos={photos} />;
    case "1top-2bottom": return photos.length >= 3 ? <Page1Top2Bottom photos={photos} /> : <Page1 photos={photos} />;
    default: return <Page1 photos={photos} />;
  }
};

/* ── Auto-pick default layout ────────────────────── */

const autoLayout = (count: number): { left: LayoutType; right: LayoutType } => {
  switch (count) {
    case 1: return { left: "full", right: "full" };
    case 2: return { left: "matted", right: "matted" };
    case 3: return { left: "portrait-landscape", right: "full" };
    case 4: return { left: "2-stack", right: "2-stack" };
    case 5: return { left: "hero-detail", right: "3-portrait" };
    default: return { left: "1top-2bottom", right: "1top-2bottom" };
  }
};

/* ── Layout picker popover ───────────────────────── */

const LayoutPicker = ({
  currentLayout,
  onSelect,
  onClose,
}: {
  currentLayout: LayoutType;
  onSelect: (l: LayoutType) => void;
  onClose: () => void;
}) => (
  <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-card border border-border rounded-xl shadow-lg p-2 grid grid-cols-4 gap-1.5">
    {LAYOUT_OPTIONS.map((opt) => (
      <button
        key={opt.id}
        onClick={() => { onSelect(opt.id); onClose(); }}
        className={cn(
          "flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg text-center transition-colors",
          currentLayout === opt.id
            ? "bg-[hsl(var(--tangible-teal))]/10 text-[hsl(var(--tangible-teal))]"
            : "hover:bg-muted/50 text-muted-foreground"
        )}
      >
        <span className="text-lg leading-none">{opt.icon}</span>
        <span className="text-[8px] leading-tight">{opt.label}</span>
      </button>
    ))}
  </div>
);

/* ── Cover spread ────────────────────────────────── */

const CoverSpread = ({ coverPhoto, title, subtitle, onTitleChange, onSubtitleChange }: {
  coverPhoto?: Photo; title: string; subtitle: string;
  onTitleChange: (v: string) => void; onSubtitleChange: (v: string) => void;
}) => (
  <div className="flex flex-col items-center gap-1.5">
    <div
      className="w-full rounded-md overflow-hidden shadow-[0_8px_30px_-6px_rgba(0,0,0,0.18)] border border-border/40 bg-white"
      style={{ aspectRatio: "297 / 105" }}
    >
      <div className="flex h-full">
        <div className="flex-1 flex items-center justify-center bg-white">
          <span className="text-[7px] tracking-[0.3em] uppercase font-normal text-muted-foreground/30">Tangible</span>
        </div>
        <div className="w-px bg-border/30 flex-shrink-0" />
        <div className="flex-1 overflow-hidden relative">
          {coverPhoto && <Img src={coverPhoto.url} />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <input type="text" value={title} onChange={(e) => onTitleChange(e.target.value)}
              className="text-sm font-bold text-white tracking-wide bg-transparent border-none outline-none w-full placeholder:text-white/50"
              placeholder="Your Photobook Title" />
            <input type="text" value={subtitle} onChange={(e) => onSubtitleChange(e.target.value)}
              className="text-[9px] text-white/70 mt-0.5 bg-transparent border-none outline-none w-full placeholder:text-white/40"
              placeholder="Subtitle" />
          </div>
        </div>
      </div>
    </div>
    <div className="flex justify-between w-full px-1">
      <span className="text-[10px] text-muted-foreground">Back</span>
      <span className="text-[10px] text-muted-foreground">Front</span>
    </div>
  </div>
);

/* ── End spread ──────────────────────────────────── */

const EndSpread = () => (
  <div className="flex flex-col items-center gap-1.5">
    <div
      className="w-full rounded-md overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.12)] border border-border/40 bg-white"
      style={{ aspectRatio: "297 / 105" }}
    >
      <div className="flex h-full">
        <div className="flex-1 flex items-end justify-center bg-white pb-4">
          <span className="text-[6px] tracking-[0.3em] uppercase font-normal text-muted-foreground/25">Made with Tangible</span>
        </div>
        <div className="w-px bg-border/30 flex-shrink-0" />
        <div className="flex-1 bg-white" />
      </div>
    </div>
    <div className="flex justify-between w-full px-1">
      <span className="text-[10px] text-muted-foreground">End</span>
      <span className="text-[10px] text-muted-foreground"></span>
    </div>
  </div>
);

/* ── Photo arrangement strip ─────────────────────── */

const PhotoArrangement = ({
  photos,
  onReorder,
  onClose,
}: {
  photos: Photo[];
  onReorder: (photos: Photo[]) => void;
  onClose: () => void;
}) => {
  const [selected, setSelected] = useState<number | null>(null);

  const handleTap = (idx: number) => {
    if (selected === null) {
      setSelected(idx);
    } else {
      // Swap
      const newPhotos = [...photos];
      [newPhotos[selected], newPhotos[idx]] = [newPhotos[idx], newPhotos[selected]];
      onReorder(newPhotos);
      setSelected(null);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <ArrowLeftRight className="w-3 h-3" />
          Tap two photos to swap
        </span>
        <button onClick={onClose} className="text-[10px] text-[hsl(var(--tangible-teal))] font-medium">
          Done
        </button>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {photos.map((p, i) => (
          <button
            key={p.id}
            onClick={() => handleTap(i)}
            className={cn(
              "relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all",
              selected === i
                ? "border-[hsl(var(--tangible-teal))] scale-105 shadow-md"
                : "border-transparent hover:border-border"
            )}
          >
            <img src={p.url} alt="" className="w-full h-full object-cover" />
            <span className="absolute bottom-0.5 right-0.5 bg-black/50 text-white text-[8px] px-1 rounded">
              {i + 1}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ── Spread with layout + arrange controls ───────── */

const SpreadWithControls = ({
  event,
  pageNum,
  leftLayout,
  rightLayout,
  onChangeLeft,
  onChangeRight,
  onReorderPhotos,
}: {
  event: PhotoEvent;
  pageNum: number;
  leftLayout: LayoutType;
  rightLayout: LayoutType;
  onChangeLeft: (l: LayoutType) => void;
  onChangeRight: (l: LayoutType) => void;
  onReorderPhotos: (photos: Photo[]) => void;
}) => {
  const [pickerSide, setPickerSide] = useState<"left" | "right" | null>(null);
  const [showArrange, setShowArrange] = useState(false);
  const p = event.photos;

  // Split photos between left and right pages
  const half = Math.ceil(p.length / 2);
  const leftPhotos = p.slice(0, Math.max(1, half));
  const rightPhotos = p.length > 1 ? p.slice(half) : [];

  return (
    <div className="flex flex-col items-center gap-1.5 relative">
      <div className="w-full px-1 flex items-center justify-between">
        <p className="text-[10px] font-semibold text-foreground/60 tracking-wide">
          {formatDate(event.date)}
          {event.location && <span className="text-muted-foreground font-normal"> · {event.location}</span>}
        </p>
        <div className="flex items-center gap-2.5">
          {p.length > 1 && (
            <button
              onClick={() => { setShowArrange(!showArrange); setPickerSide(null); }}
              className={cn(
                "flex items-center gap-1 text-[10px] transition-opacity",
                showArrange ? "text-[hsl(var(--tangible-teal))] font-medium" : "text-[hsl(var(--tangible-teal))] hover:opacity-70"
              )}
            >
              <ArrowLeftRight className="w-3 h-3" />
              Arrange
            </button>
          )}
          <button
            onClick={() => { setPickerSide(pickerSide ? null : "left"); setShowArrange(false); }}
            className="flex items-center gap-1 text-[10px] text-[hsl(var(--tangible-teal))] hover:opacity-70 transition-opacity"
          >
            <LayoutGrid className="w-3 h-3" />
            Layout
          </button>
        </div>
      </div>

      {pickerSide && (
        <div className="relative w-full">
          <LayoutPicker
            currentLayout={pickerSide === "left" ? leftLayout : rightLayout}
            onSelect={(l) => {
              if (pickerSide === "left") onChangeLeft(l);
              else onChangeRight(l);
            }}
            onClose={() => setPickerSide(null)}
          />
        </div>
      )}

      {showArrange && (
        <div className="w-full">
          <PhotoArrangement
            photos={p}
            onReorder={onReorderPhotos}
            onClose={() => setShowArrange(false)}
          />
        </div>
      )}

      <div
        className="w-full rounded-md overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.12)] border border-border/40 bg-white"
        style={{ aspectRatio: "297 / 105" }}
      >
        <div className="flex h-full">
          <div
            className="flex-1 overflow-hidden cursor-pointer hover:ring-2 hover:ring-[hsl(var(--tangible-teal))]/30 hover:ring-inset transition-shadow"
            onClick={() => { setPickerSide(pickerSide === "left" ? null : "left"); setShowArrange(false); }}
          >
            <div className="w-full h-full">{renderPage(leftLayout, leftPhotos)}</div>
          </div>
          <div className="w-px bg-border/30 flex-shrink-0" />
          <div
            className="flex-1 overflow-hidden cursor-pointer hover:ring-2 hover:ring-[hsl(var(--tangible-teal))]/30 hover:ring-inset transition-shadow"
            onClick={() => { setPickerSide(pickerSide === "right" ? null : "right"); setShowArrange(false); }}
          >
            <div className="w-full h-full">{rightPhotos.length > 0 ? renderPage(rightLayout, rightPhotos) : <PageEmpty />}</div>
          </div>
        </div>
      </div>
      <div className="flex justify-between w-full px-1">
        <span className="text-[10px] text-muted-foreground">{pageNum}</span>
        <span className="text-[10px] text-muted-foreground">{pageNum + 1}</span>
      </div>
    </div>
  );
};

/* ── Main preview ────────────────────────────────── */

const PhotobookPreview = ({ events, title, subtitle, onTitleChange, onSubtitleChange }: PhotobookPreviewProps) => {
  // Local photo order overrides per event index
  const [photoOrders, setPhotoOrders] = useState<Record<number, Photo[]>>({});
  const allPhotos = events.flatMap((e) => e.photos);

  // Track layout per spread
  const [layouts, setLayouts] = useState<Record<number, { left: LayoutType; right: LayoutType }>>({});

  // Blank pages that have been added (inserted after spread index)
  const [blankPages, setBlankPages] = useState<number[]>([]);

  const getPhotosForEvent = (idx: number, event: PhotoEvent) => {
    return photoOrders[idx] || event.photos;
  };

  const getLayout = (idx: number, event: PhotoEvent) => {
    if (layouts[idx]) return layouts[idx];
    return autoLayout(event.photos.length);
  };

  const setLayout = (idx: number, side: "left" | "right", layout: LayoutType) => {
    setLayouts((prev) => {
      const current = prev[idx] || autoLayout(events[idx]?.photos.length || 1);
      return { ...prev, [idx]: { ...current, [side]: layout } };
    });
  };

  const handleReorderPhotos = useCallback((idx: number, newPhotos: Photo[]) => {
    setPhotoOrders((prev) => ({ ...prev, [idx]: newPhotos }));
  }, []);

  const addBlankPage = (afterIdx: number) => {
    setBlankPages((prev) => [...prev, afterIdx]);
  };

  const totalPages = (events.length + blankPages.length) * 2 + 4;

  let pageCounter = 3;

  return (
    <div className="flex flex-col gap-6 pb-8">
      <span className="text-xs text-muted-foreground font-medium">
        {events.length} events · {totalPages} pages
      </span>

      <CoverSpread coverPhoto={allPhotos[0]} title={title} subtitle={subtitle} onTitleChange={onTitleChange} onSubtitleChange={onSubtitleChange} />

      {events.map((event, i) => {
        const layout = getLayout(i, event);
        const currentPage = pageCounter;
        pageCounter += 2;

        const arrangedEvent = { ...event, photos: getPhotosForEvent(i, event) };

        // Count blank pages inserted after this spread
        const blanksAfter = blankPages.filter((b) => b === i).length;

        return (
          <div key={`${event.date}-${event.location}-${i}`} className="flex flex-col gap-4">
            <SpreadWithControls
              event={arrangedEvent}
              pageNum={currentPage}
              leftLayout={layout.left}
              rightLayout={layout.right}
              onChangeLeft={(l) => setLayout(i, "left", l)}
              onChangeRight={(l) => setLayout(i, "right", l)}
              onReorderPhotos={(photos) => handleReorderPhotos(i, photos)}
            />

            {/* Render blank pages */}
            {Array.from({ length: blanksAfter }).map((_, bi) => {
              const blankPage = pageCounter;
              pageCounter += 2;
              return (
                <div key={`blank-${i}-${bi}`} className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-full rounded-md overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.12)] border border-border/40 bg-white"
                    style={{ aspectRatio: "297 / 105" }}
                  >
                    <div className="flex h-full">
                      <div className="flex-1 flex items-center justify-center bg-muted/10">
                        <span className="text-xs text-muted-foreground/40">Blank page</span>
                      </div>
                      <div className="w-px bg-border/30 flex-shrink-0" />
                      <div className="flex-1 flex items-center justify-center bg-muted/10">
                        <span className="text-xs text-muted-foreground/40">Blank page</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between w-full px-1">
                    <span className="text-[10px] text-muted-foreground">{blankPage}</span>
                    <span className="text-[10px] text-muted-foreground">{blankPage + 1}</span>
                  </div>
                </div>
              );
            })}

            {/* Add page button between spreads */}
            <button
              onClick={() => addBlankPage(i)}
              className="mx-auto flex items-center gap-1.5 text-[11px] text-[hsl(var(--tangible-teal))] hover:opacity-70 transition-opacity py-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add pages
            </button>
          </div>
        );
      })}

      <EndSpread />
    </div>
  );
};

export default PhotobookPreview;
