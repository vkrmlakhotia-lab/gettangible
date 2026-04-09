import { PhotoEvent, Photo } from "@/data/samplePhotos";

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
    <div className="w-[37%] h-full overflow-hidden"><Img src={photos[1].url} /></div>
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
      <div className="flex-1 overflow-hidden"><Img src={photos[1].url} /></div>
      <div className="flex-1 overflow-hidden"><Img src={photos[2].url} /></div>
    </div>
  </div>
);

const Page2Stack = ({ photos }: { photos: Photo[] }) => (
  <div className="flex flex-col gap-[2px] h-full w-full">
    <div className="flex-1 overflow-hidden"><Img src={photos[0].url} /></div>
    <div className="flex-1 overflow-hidden"><Img src={photos[1].url} /></div>
  </div>
);

const Page1Top2Bottom = ({ photos }: { photos: Photo[] }) => (
  <div className="flex flex-col gap-[2px] h-full w-full">
    <div className="flex-1 overflow-hidden"><Img src={photos[0].url} /></div>
    <div className="flex-1 flex gap-[2px]">
      <div className="flex-1 overflow-hidden"><Img src={photos[1].url} /></div>
      <div className="flex-1 overflow-hidden"><Img src={photos[2].url} /></div>
    </div>
  </div>
);

const PageEmpty = () => <div className="w-full h-full bg-muted/20" />;

/* ── Spread builder ──────────────────────────────── */

interface SpreadPages {
  left: React.ReactNode;
  right: React.ReactNode;
  fullBleed?: boolean;
}

const buildSpread = (event: PhotoEvent): SpreadPages => {
  const p = event.photos;
  const count = p.length;

  switch (count) {
    case 1:
      return { left: <Page1 photos={[p[0]]} />, right: <PageEmpty />, fullBleed: true };
    case 2:
      return { left: <PageMatted photos={[p[0]]} />, right: <PageMatted photos={[p[1]]} /> };
    case 3:
      return { left: <PagePortraitAndLandscapes photos={[p[0], p[1], p[2]]} />, right: <PageEmpty /> };
    case 4:
      return { left: <Page2Stack photos={[p[0], p[1]]} />, right: <Page2Stack photos={[p[2], p[3]]} /> };
    case 5:
      return { left: <PageHeroDetail photos={[p[0], p[1]]} />, right: <Page3Portraits photos={[p[2], p[3], p[4]]} /> };
    default: {
      const left = p.slice(0, 3);
      const right = p.slice(3, 6);
      return {
        left: <Page1Top2Bottom photos={left} />,
        right: right.length >= 3
          ? <Page1Top2Bottom photos={right} />
          : right.length === 2
            ? <Page2Stack photos={right} />
            : right.length === 1
              ? <Page1 photos={right} />
              : <PageEmpty />,
      };
    }
  }
};

/* ── Cover: Front (right) = hero + title, Back (left) = TANGIBLE branding ── */

const CoverSpread = ({ coverPhoto, title, subtitle, onTitleChange, onSubtitleChange }: { coverPhoto?: Photo; title: string; subtitle: string; onTitleChange: (v: string) => void; onSubtitleChange: (v: string) => void }) => (
  <div className="flex flex-col items-center gap-1.5">
    <div
      className="w-full rounded-md overflow-hidden shadow-[0_8px_30px_-6px_rgba(0,0,0,0.18)] border border-border/40 bg-white"
      style={{ aspectRatio: "297 / 105" }}
    >
      <div className="flex h-full">
        {/* Back cover (left) — white with TANGIBLE */}
        <div className="flex-1 flex items-center justify-center bg-white">
          <span
            className="text-[10px] tracking-[0.35em] uppercase font-medium text-muted-foreground/40"
          >
            Tangible
          </span>
        </div>
        <div className="w-px bg-border/30 flex-shrink-0" />
        {/* Front cover (right) — hero photo with title overlay */}
        <div className="flex-1 overflow-hidden relative">
          {coverPhoto && <Img src={coverPhoto.url} />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="text-sm font-bold text-white tracking-wide bg-transparent border-none outline-none w-full placeholder:text-white/50"
              placeholder="Your Photobook Title"
            />
            <input
              type="text"
              value={subtitle}
              onChange={(e) => onSubtitleChange(e.target.value)}
              className="text-[9px] text-white/70 mt-0.5 bg-transparent border-none outline-none w-full placeholder:text-white/40"
              placeholder="Subtitle"
            />
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

/* ── Spread component ────────────────────────────── */

const SpreadLayout = ({ event, pageNum }: { event: PhotoEvent; pageNum: number }) => {
  const { left, right, fullBleed } = buildSpread(event);
  const padding = fullBleed ? "" : "p-1.5";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-full px-1">
        <p className="text-[10px] font-semibold text-foreground/60 tracking-wide">
          {formatDate(event.date)}
          {event.location && <span className="text-muted-foreground font-normal"> · {event.location}</span>}
        </p>
      </div>
      <div
        className="w-full rounded-md overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.12)] border border-border/40 bg-white"
        style={{ aspectRatio: "297 / 105" }}
      >
        <div className="flex h-full">
          <div className={`flex-1 overflow-hidden ${padding}`}>
            <div className="w-full h-full rounded-sm overflow-hidden">{left}</div>
          </div>
          <div className="w-px bg-border/30 flex-shrink-0" />
          <div className={`flex-1 overflow-hidden ${padding}`}>
            <div className="w-full h-full rounded-sm overflow-hidden">{right}</div>
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

const PhotobookPreview = ({ events, title, subtitle, onTitleChange, onSubtitleChange }: PhotobookPreviewProps) => {
  const allPhotos = events.flatMap((e) => e.photos);
  const totalPages = events.length * 2 + 2;

  return (
    <div className="flex flex-col gap-6 pb-8">
      <span className="text-xs text-muted-foreground font-medium">
        {events.length} events · {totalPages} pages
      </span>
      <CoverSpread coverPhoto={allPhotos[0]} title={title} subtitle={subtitle} onTitleChange={onTitleChange} onSubtitleChange={onSubtitleChange} />
      {events.map((event, i) => (
        <SpreadLayout key={`${event.date}-${event.location}`} event={event} pageNum={i * 2 + 3} />
      ))}
    </div>
  );
};

export default PhotobookPreview;
