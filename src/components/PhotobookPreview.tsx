import { useState, useCallback } from "react";
import { Plus, LayoutGrid, ArrowLeftRight, ChevronUp, ChevronDown } from "lucide-react";
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

type LayoutType =
  | "full" | "matted" | "2-stack" | "2-side"
  | "hero-detail" | "3-portrait" | "portrait-landscape" | "1top-2bottom"
  | "2top-1bottom" | "grid-4" | "grid-2x2" | "5-mosaic" | "grid-6";

interface LayoutOption {
  id: LayoutType;
  label: string;
  minPhotos: number;
  diagram: React.ReactNode;
}

/* ── SVG layout diagrams ─────────────────────────── */

const D = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 32 24" className="w-8 h-6">{children}</svg>
);
const R = (props: { x: number; y: number; width: number; height: number; className?: string }) => (
  <rect rx="1" fill="currentColor" opacity="0.25" {...props} />
);

const LAYOUT_OPTIONS: LayoutOption[] = [
  {
    id: "full", label: "Full", minPhotos: 1,
    diagram: <D><R x={1} y={1} width={30} height={22} /></D>,
  },
  {
    id: "matted", label: "Matted", minPhotos: 1,
    diagram: <D><rect x={0.5} y={0.5} width={31} height={23} rx={1} fill="none" stroke="currentColor" opacity={0.2} strokeWidth={0.5} /><R x={5} y={3} width={22} height={18} /></D>,
  },
  {
    id: "2-side", label: "2 Side", minPhotos: 2,
    diagram: <D><R x={1} y={1} width={14.5} height={22} /><R x={16.5} y={1} width={14.5} height={22} /></D>,
  },
  {
    id: "2-stack", label: "2 Stack", minPhotos: 2,
    diagram: <D><R x={1} y={1} width={30} height={10.5} /><R x={1} y={12.5} width={30} height={10.5} /></D>,
  },
  {
    id: "hero-detail", label: "Hero + 1", minPhotos: 2,
    diagram: <D><R x={1} y={1} width={20} height={22} /><R x={22} y={1} width={9} height={22} /></D>,
  },
  {
    id: "3-portrait", label: "3 Cols", minPhotos: 3,
    diagram: <D><R x={1} y={1} width={9.3} height={22} /><R x={11.3} y={1} width={9.3} height={22} /><R x={21.7} y={1} width={9.3} height={22} /></D>,
  },
  {
    id: "portrait-landscape", label: "1 + 2 Right", minPhotos: 3,
    diagram: <D><R x={1} y={1} width={12} height={22} /><R x={14} y={1} width={17} height={10.5} /><R x={14} y={12.5} width={17} height={10.5} /></D>,
  },
  {
    id: "1top-2bottom", label: "1 Top 2 Bot", minPhotos: 3,
    diagram: <D><R x={1} y={1} width={30} height={10.5} /><R x={1} y={12.5} width={14.5} height={10.5} /><R x={16.5} y={12.5} width={14.5} height={10.5} /></D>,
  },
  {
    id: "2top-1bottom", label: "2 Top 1 Bot", minPhotos: 3,
    diagram: <D><R x={1} y={1} width={14.5} height={10.5} /><R x={16.5} y={1} width={14.5} height={10.5} /><R x={1} y={12.5} width={30} height={10.5} /></D>,
  },
  {
    id: "grid-4", label: "Grid 4", minPhotos: 4,
    diagram: <D><R x={1} y={1} width={14.5} height={10.5} /><R x={16.5} y={1} width={14.5} height={10.5} /><R x={1} y={12.5} width={14.5} height={10.5} /><R x={16.5} y={12.5} width={14.5} height={10.5} /></D>,
  },
  {
    id: "5-mosaic", label: "Mosaic 5", minPhotos: 5,
    diagram: <D><R x={1} y={1} width={20} height={10.5} /><R x={22} y={1} width={9} height={10.5} /><R x={1} y={12.5} width={9} height={10.5} /><R x={11} y={12.5} width={9.5} height={10.5} /><R x={21.5} y={12.5} width={9.5} height={10.5} /></D>,
  },
  {
    id: "grid-6", label: "Grid 6", minPhotos: 6,
    diagram: <D><R x={1} y={1} width={9.3} height={10.5} /><R x={11.3} y={1} width={9.3} height={10.5} /><R x={21.7} y={1} width={9.3} height={10.5} /><R x={1} y={12.5} width={9.3} height={10.5} /><R x={11.3} y={12.5} width={9.3} height={10.5} /><R x={21.7} y={12.5} width={9.3} height={10.5} /></D>,
  },
];

/* ── Single-page layouts ─────────────────────────── */

const s = (photos: Photo[], i: number) => photos[Math.min(i, photos.length - 1)];

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

const Page2Side = ({ photos }: { photos: Photo[] }) => (
  <div className="flex gap-[2px] h-full w-full">
    <div className="flex-1 overflow-hidden"><Img src={s(photos, 0).url} /></div>
    <div className="flex-1 overflow-hidden"><Img src={s(photos, 1).url} /></div>
  </div>
);

const PageHeroDetail = ({ photos }: { photos: Photo[] }) => (
  <div className="flex gap-[2px] h-full w-full">
    <div className="w-[63%] h-full overflow-hidden"><Img src={s(photos, 0).url} /></div>
    <div className="w-[37%] h-full overflow-hidden"><Img src={s(photos, 1).url} /></div>
  </div>
);

const Page3Portraits = ({ photos }: { photos: Photo[] }) => (
  <div className="flex gap-[2px] h-full w-full">
    {[0, 1, 2].map((i) => (
      <div key={i} className="flex-1 h-full overflow-hidden"><Img src={s(photos, i).url} /></div>
    ))}
  </div>
);

const PagePortraitAndLandscapes = ({ photos }: { photos: Photo[] }) => (
  <div className="flex gap-[2px] h-full w-full">
    <div className="w-[40%] h-full overflow-hidden"><Img src={s(photos, 0).url} /></div>
    <div className="w-[60%] h-full flex flex-col gap-[2px]">
      <div className="flex-1 overflow-hidden"><Img src={s(photos, 1).url} /></div>
      <div className="flex-1 overflow-hidden"><Img src={s(photos, 2).url} /></div>
    </div>
  </div>
);

const Page2Stack = ({ photos }: { photos: Photo[] }) => (
  <div className="flex flex-col gap-[2px] h-full w-full">
    <div className="flex-1 overflow-hidden"><Img src={s(photos, 0).url} /></div>
    <div className="flex-1 overflow-hidden"><Img src={s(photos, 1).url} /></div>
  </div>
);

const Page1Top2Bottom = ({ photos }: { photos: Photo[] }) => (
  <div className="flex flex-col gap-[2px] h-full w-full">
    <div className="flex-1 overflow-hidden"><Img src={s(photos, 0).url} /></div>
    <div className="flex-1 flex gap-[2px]">
      <div className="flex-1 overflow-hidden"><Img src={s(photos, 1).url} /></div>
      <div className="flex-1 overflow-hidden"><Img src={s(photos, 2).url} /></div>
    </div>
  </div>
);

const Page2Top1Bottom = ({ photos }: { photos: Photo[] }) => (
  <div className="flex flex-col gap-[2px] h-full w-full">
    <div className="flex-1 flex gap-[2px]">
      <div className="flex-1 overflow-hidden"><Img src={s(photos, 0).url} /></div>
      <div className="flex-1 overflow-hidden"><Img src={s(photos, 1).url} /></div>
    </div>
    <div className="flex-1 overflow-hidden"><Img src={s(photos, 2).url} /></div>
  </div>
);

const PageGrid4 = ({ photos }: { photos: Photo[] }) => (
  <div className="grid grid-cols-2 grid-rows-2 gap-[2px] h-full w-full">
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="overflow-hidden"><Img src={s(photos, i).url} /></div>
    ))}
  </div>
);

const Page5Mosaic = ({ photos }: { photos: Photo[] }) => (
  <div className="flex flex-col gap-[2px] h-full w-full">
    <div className="flex-1 flex gap-[2px]">
      <div className="w-[65%] overflow-hidden"><Img src={s(photos, 0).url} /></div>
      <div className="w-[35%] overflow-hidden"><Img src={s(photos, 1).url} /></div>
    </div>
    <div className="flex-1 flex gap-[2px]">
      <div className="flex-1 overflow-hidden"><Img src={s(photos, 2).url} /></div>
      <div className="flex-1 overflow-hidden"><Img src={s(photos, 3).url} /></div>
      <div className="flex-1 overflow-hidden"><Img src={s(photos, 4).url} /></div>
    </div>
  </div>
);

const PageGrid6 = ({ photos }: { photos: Photo[] }) => (
  <div className="grid grid-cols-3 grid-rows-2 gap-[2px] h-full w-full">
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="overflow-hidden"><Img src={s(photos, i).url} /></div>
    ))}
  </div>
);

const PageEmpty = () => <div className="w-full h-full bg-muted/20" />;

/* ── Render a page by layout type ────────────────── */

const renderPage = (layout: LayoutType, photos: Photo[]): React.ReactNode => {
  if (photos.length === 0) return <PageEmpty />;
  switch (layout) {
    case "full": return <Page1 photos={photos} />;
    case "matted": return <PageMatted photos={photos} />;
    case "2-side": return <Page2Side photos={photos} />;
    case "hero-detail": return <PageHeroDetail photos={photos} />;
    case "3-portrait": return <Page3Portraits photos={photos} />;
    case "portrait-landscape": return <PagePortraitAndLandscapes photos={photos} />;
    case "2-stack": return <Page2Stack photos={photos} />;
    case "1top-2bottom": return <Page1Top2Bottom photos={photos} />;
    case "2top-1bottom": return <Page2Top1Bottom photos={photos} />;
    case "grid-4": return <PageGrid4 photos={photos} />;
    case "grid-2x2": return <PageGrid4 photos={photos} />;
    case "5-mosaic": return <Page5Mosaic photos={photos} />;
    case "grid-6": return <PageGrid6 photos={photos} />;
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
  <div className="w-full bg-card border border-border rounded-xl shadow-lg p-3">
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Choose layout</span>
      <button onClick={onClose} className="text-[10px] text-[hsl(var(--tangible-teal))] font-medium">Done</button>
    </div>
    <div className="grid grid-cols-4 gap-2">
      {LAYOUT_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          onClick={() => { onSelect(opt.id); onClose(); }}
          className={cn(
            "flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-center transition-colors",
            currentLayout === opt.id
              ? "bg-[hsl(var(--tangible-teal))]/10 text-[hsl(var(--tangible-teal))]"
              : "hover:bg-muted/50 text-muted-foreground"
          )}
        >
          {opt.diagram}
          <span className="text-[7px] leading-tight">{opt.label}</span>
        </button>
      ))}
    </div>
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
  photos, onReorder, onClose,
}: { photos: Photo[]; onReorder: (photos: Photo[]) => void; onClose: () => void }) => {
  const [selected, setSelected] = useState<number | null>(null);

  const handleTap = (idx: number) => {
    if (selected === null) {
      setSelected(idx);
    } else {
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
        <button onClick={onClose} className="text-[10px] text-[hsl(var(--tangible-teal))] font-medium">Done</button>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {photos.map((p, i) => (
          <button key={p.id} onClick={() => handleTap(i)}
            className={cn(
              "relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all",
              selected === i ? "border-[hsl(var(--tangible-teal))] scale-105 shadow-md" : "border-transparent hover:border-border"
            )}>
            <img src={p.url} alt="" className="w-full h-full object-cover" />
            <span className="absolute bottom-0.5 right-0.5 bg-black/50 text-white text-[8px] px-1 rounded">{i + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ── Spread with layout + arrange + reorder controls ── */

const SpreadWithControls = ({
  event, pageNum, leftLayout, rightLayout,
  onChangeLeft, onChangeRight, onReorderPhotos,
  onMoveUp, onMoveDown, isFirst, isLast,
}: {
  event: PhotoEvent; pageNum: number;
  leftLayout: LayoutType; rightLayout: LayoutType;
  onChangeLeft: (l: LayoutType) => void; onChangeRight: (l: LayoutType) => void;
  onReorderPhotos: (photos: Photo[]) => void;
  onMoveUp: () => void; onMoveDown: () => void;
  isFirst: boolean; isLast: boolean;
}) => {
  const [pickerSide, setPickerSide] = useState<"left" | "right" | null>(null);
  const [showArrange, setShowArrange] = useState(false);
  const p = event.photos;

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
        <div className="flex items-center gap-2">
          {/* Move up/down arrows */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={onMoveUp}
              disabled={isFirst}
              className={cn("p-0.5 rounded transition-colors", isFirst ? "text-muted-foreground/30 cursor-not-allowed" : "text-[hsl(var(--tangible-teal))] hover:bg-muted/50")}
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onMoveDown}
              disabled={isLast}
              className={cn("p-0.5 rounded transition-colors", isLast ? "text-muted-foreground/30 cursor-not-allowed" : "text-[hsl(var(--tangible-teal))] hover:bg-muted/50")}
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
          {p.length > 1 && (
            <button
              onClick={() => { setShowArrange(!showArrange); setPickerSide(null); }}
              className="flex items-center gap-1 text-[10px] text-[hsl(var(--tangible-teal))] hover:opacity-70 transition-opacity"
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
        <LayoutPicker
          currentLayout={pickerSide === "left" ? leftLayout : rightLayout}
          onSelect={(l) => { if (pickerSide === "left") onChangeLeft(l); else onChangeRight(l); }}
          onClose={() => setPickerSide(null)}
        />
      )}

      {showArrange && (
        <PhotoArrangement photos={p} onReorder={onReorderPhotos} onClose={() => setShowArrange(false)} />
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
  const [photoOrders, setPhotoOrders] = useState<Record<number, Photo[]>>({});
  const [layouts, setLayouts] = useState<Record<number, { left: LayoutType; right: LayoutType }>>({});
  const [blankPages, setBlankPages] = useState<number[]>([]);
  const [spreadOrder, setSpreadOrder] = useState<number[] | null>(null);

  // Derive ordered indices
  const orderedIndices = spreadOrder || events.map((_, i) => i);
  const allPhotos = events.flatMap((e) => e.photos);

  const getPhotosForEvent = (idx: number, event: PhotoEvent) => photoOrders[idx] || event.photos;

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

  const moveSpread = useCallback((fromPos: number, direction: "up" | "down") => {
    setSpreadOrder((prev) => {
      const order = prev || events.map((_, i) => i);
      const toPos = direction === "up" ? fromPos - 1 : fromPos + 1;
      if (toPos < 0 || toPos >= order.length) return order;
      const newOrder = [...order];
      [newOrder[fromPos], newOrder[toPos]] = [newOrder[toPos], newOrder[fromPos]];
      return newOrder;
    });
  }, [events]);

  const totalPages = (events.length + blankPages.length) * 2 + 4;
  let pageCounter = 3;

  return (
    <div className="flex flex-col gap-6 pb-8">
      <span className="text-xs text-muted-foreground font-medium">
        {events.length} events · {totalPages} pages
      </span>

      <CoverSpread coverPhoto={allPhotos[0]} title={title} subtitle={subtitle} onTitleChange={onTitleChange} onSubtitleChange={onSubtitleChange} />

      {orderedIndices.map((eventIdx, pos) => {
        const event = events[eventIdx];
        if (!event) return null;
        const layout = getLayout(eventIdx, event);
        const currentPage = pageCounter;
        pageCounter += 2;

        const arrangedEvent = { ...event, photos: getPhotosForEvent(eventIdx, event) };
        const blanksAfter = blankPages.filter((b) => b === eventIdx).length;

        return (
          <div key={`spread-${eventIdx}-${pos}`} className="flex flex-col gap-4">
            <SpreadWithControls
              event={arrangedEvent}
              pageNum={currentPage}
              leftLayout={layout.left}
              rightLayout={layout.right}
              onChangeLeft={(l) => setLayout(eventIdx, "left", l)}
              onChangeRight={(l) => setLayout(eventIdx, "right", l)}
              onReorderPhotos={(photos) => handleReorderPhotos(eventIdx, photos)}
              onMoveUp={() => moveSpread(pos, "up")}
              onMoveDown={() => moveSpread(pos, "down")}
              isFirst={pos === 0}
              isLast={pos === orderedIndices.length - 1}
            />

            {Array.from({ length: blanksAfter }).map((_, bi) => {
              const blankPage = pageCounter;
              pageCounter += 2;
              return (
                <div key={`blank-${eventIdx}-${bi}`} className="flex flex-col items-center gap-1.5">
                  <div className="w-full rounded-md overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.12)] border border-border/40 bg-white"
                    style={{ aspectRatio: "297 / 105" }}>
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

            <button
              onClick={() => addBlankPage(eventIdx)}
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
